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

// FIX: Manual block/unblock — this was a missing feature. Admin can now
// forcibly kick a device offline (e.g. abuse, walked out without WiFi
// dropping cleanly) or manually re-grant access without waiting on the
// attendance/subscription gate.
export async function setDeviceStatus(macAddress: string, status: 'blocked' | 'pending') {
    const supabase = await createAdminClient();
    const { error } = await supabase.from('devices').update({ status }).eq('mac_address', macAddress);
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
// ADD STUDENT
// ==========================================
// FIX: stores auth_user_id so updateStudent can later sync password
// changes to the real Supabase Auth credential instead of just
// rewriting a disconnected plaintext column.
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
    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters (Supabase Auth minimum).' };
    }

    // 1. Create the user in Supabase Authentication so they can log in
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'student', name: name }
    });

    if (authError) return { error: `Auth Error: ${authError.message}` };

    // 2. Insert their profile into your public.students table.
    // NOTE: no longer storing plaintext `password` — only auth_user_id link.
    // Run migration_auth_user_id.sql before deploying this, and once
    // confirmed working, drop the students.password column entirely.
    const { error } = await supabase.from('students').insert({
        name, phone, email, auth_user_id: authData.user?.id,
        target_exam, address, emergency_contact
    });

    if (error) {
        // Roll back the auth user so we don't leave an orphaned login
        // with no matching student profile.
        if (authData.user?.id) {
            await supabase.auth.admin.deleteUser(authData.user.id);
        }
        if (error.code === '23505') return { error: 'A student with this phone or email already exists in the database.' };
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
}

// ==========================================
// UPDATE STUDENT
// ==========================================
// FIX: password is now OPTIONAL ("leave blank to keep current") and,
// when provided, is synced to the REAL Supabase Auth credential via
// auth.admin.updateUserById — not just overwritten in a disconnected
// plaintext column that the login flow never actually reads from.
export async function updateStudent(formData: FormData) {
    const supabase = await createAdminClient();
    const id = parseInt(formData.get('id') as string);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const newPassword = (formData.get('password') as string || '').trim();

    const target_exam = formData.get('target_exam') as string || null;
    const address = formData.get('address') as string || null;
    const emergency_contact = formData.get('emergency_contact') as string || null;

    if (!id || !name || !phone || !email) {
        return { error: 'ID, Name, Phone, and Email are required.' };
    }
    if (newPassword && newPassword.length < 6) {
        return { error: 'New password must be at least 6 characters.' };
    }

    // Look up the auth link so we can sync email/password changes for real
    const { data: existingStudent } = await supabase
        .from('students')
        .select('auth_user_id')
        .eq('id', id)
        .single();

    if (existingStudent?.auth_user_id) {
        const authUpdates: { email?: string; password?: string } = {};
        if (email) authUpdates.email = email;
        if (newPassword) authUpdates.password = newPassword;

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabase.auth.admin.updateUserById(
                existingStudent.auth_user_id,
                authUpdates
            );
            if (authError) return { error: `Auth sync failed: ${authError.message}` };
        }
    } else {
        console.warn(`Student ${id} has no auth_user_id linked — email/password changes will NOT sync to their actual login credentials. Run migration_auth_user_id.sql to fix this for existing students.`);
    }

    const { error } = await supabase.from('students').update({
        name, phone, email, target_exam, address, emergency_contact
    }).eq('id', id);

    if (error) {
        if (error.code === '23505') return { error: 'Phone or Email already exists on another profile.' };
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
}