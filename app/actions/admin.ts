'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Update Admin Profile Credentials
export async function updateAdminProfile(formData: FormData) {
    const supabase = await createAdminClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const updates: { email?: string; password?: string } = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
        return { error: 'No changes provided.' };
    }

    const { error } = await supabase.auth.updateUser(updates);
    if (error) return { error: error.message };

    return { success: true };
}

// Update Target Device Queues 
export async function updateDeviceSpeedLimit(macAddress: string, download: string, upload: string) {
    const supabase = await createAdminClient();
    const formattedSpeedLimit = `${download}/${upload}`;

    const { error } = await supabase
        .from('devices')
        .update({ speed_limit: formattedSpeedLimit })
        .eq('mac_address', macAddress);

    if (error) {
        console.error("Failed to update speed limit:", error);
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
}

// Provision Active Student Passes (Clears overlapping subscriptions first)
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
    }
    else if (subType === 'CASH') {
        amount = parseFloat(formData.get('amount') as string);
        if (!amount || amount <= 0) return { error: 'Please provide a valid cash amount.' };
        expiresAt.setMonth(now.getMonth() + 1);
        receiptNumber = `CSH-${Date.now()}`;
    }
    else {
        return { error: 'Invalid subscription method.' };
    }

    // Retract any old active rows to prevent layout stack duplication
    await supabase
        .from('subscriptions')
        .update({ status: 'EXPIRED' })
        .eq('student_id', studentId)
        .eq('status', 'ACTIVE');

    // Write new authorization record directly to public tables
    const { error } = await supabase.from('subscriptions').insert({
        student_id: studentId,
        receipt_number: receiptNumber,
        amount_paid: amount,
        payment_method: subType,
        status: 'ACTIVE',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
    });

    if (error) {
        console.error("Subscription Writing Error:", error);
        return { error: error.message };
    }

    revalidatePath('/admin');
    return { success: true, receipt: receiptNumber };
}