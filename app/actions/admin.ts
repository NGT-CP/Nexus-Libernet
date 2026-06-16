'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateAdminProfile(formData: FormData) {
    const supabase = await createAdminClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const updates: { email?: string; password?: string } = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) return { error: 'No changes provided.' };

    const { error } = await supabase.auth.updateUser(updates);
    if (error) return { error: error.message };

    return { success: true };
}

export async function updateDeviceSpeedLimit(macAddress: string, download: string, upload: string) {
    const supabase = await createAdminClient();
    const formattedSpeedLimit = `${download}/${upload}`;

    const { error } = await supabase.from('devices').update({ speed_limit: formattedSpeedLimit }).eq('mac_address', macAddress);

    if (error) return { error: error.message };
    revalidatePath('/admin');
    return { success: true };
}

export async function addSubscription(formData: FormData) {
    const supabase = await createAdminClient();
    const rawId = formData.get('studentId') as string;
    const studentId = parseInt(rawId.replace('STU-', ''));
    const subType = formData.get('subType') as string;

    if (!studentId || !subType) return { error: 'Missing required fields.' };

    const now = new Date();
    const expiresAt = new Date();
    let amount = 0;
    let receiptNumber = '';

    if (subType === 'TRIAL') {
        const days = parseInt(formData.get('days') as string);
        if (!days || days <= 0) return { error: 'Please provide a valid number of days.' };
        expiresAt.setDate(now.getDate() + days);
        receiptNumber = `TRL-${Date.now()}`;
    } else if (subType === 'CASH') {
        amount = parseFloat(formData.get('amount') as string);
        if (!amount || amount <= 0) return { error: 'Please provide a valid cash amount.' };
        expiresAt.setMonth(now.getMonth() + 1);
        receiptNumber = `CSH-${Date.now()}`;
    } else return { error: 'Invalid subscription method.' };

    await supabase.from('subscriptions').update({ status: 'EXPIRED' }).eq('student_id', studentId).eq('status', 'ACTIVE');

    const { error } = await supabase.from('subscriptions').insert({
        student_id: studentId, receipt_number: receiptNumber, amount_paid: amount,
        payment_method: subType, status: 'ACTIVE', started_at: now.toISOString(), expires_at: expiresAt.toISOString(),
    });

    if (error) return { error: error.message };
    revalidatePath('/admin');
    return { success: true, receipt: receiptNumber };
}

// ==========================================
// ADD STUDENT (Updated for Password & Auth)
// ==========================================
export async function addStudent(formData: FormData) {
    const supabase = await createAdminClient();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const target_exam = formData.get('target_exam') as string || null;
    const address = formData.get('address') as string || null;
    const emergency_contact = formData.get('emergency_contact') as string || null;

    if (!name || !phone || !email || !password) {
        return { error: 'Name, Phone, Email, and Password are all required.' };
    }

    // 1. Create the user in Supabase Authentication so they can log in
    const { error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'student', name: name }
    });

    if (authError) return { error: `Auth Error: ${authError.message}` };

    // 2. Insert their profile into your public.students table
    const { error } = await supabase.from('students').insert({
        name, phone, email, password, target_exam, address, emergency_contact
    });

    if (error) {
        if (error.code === '23505') return { error: 'A student with this phone or email already exists in the database.' };
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
}

// ==========================================
// UPDATE STUDENT (Updated for Password)
// ==========================================
export async function updateStudent(formData: FormData) {
    const supabase = await createAdminClient();
    const id = parseInt(formData.get('id') as string);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const target_exam = formData.get('target_exam') as string || null;
    const address = formData.get('address') as string || null;
    const emergency_contact = formData.get('emergency_contact') as string || null;

    if (!id || !name || !phone || !email || !password) {
        return { error: 'ID, Name, Phone, Email, and Password are required.' };
    }

    // Note: Updating a user's Auth password requires their Auth UUID, 
    // but we will keep their table password updated per your schema.
    const { error } = await supabase.from('students').update({
        name, phone, email, password, target_exam, address, emergency_contact
    }).eq('id', id);

    if (error) {
        if (error.code === '23505') return { error: 'Phone or Email already exists on another profile.' };
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
}