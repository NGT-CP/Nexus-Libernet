'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 1. Update Admin Profile (Email/Password)
export async function updateAdminProfile(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const updates: { email?: string; password?: string } = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
        return { error: 'No changes provided.' };
    }

    // Supabase's built-in secure user update method
    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

// Update Device Speed Limit in the PostgreSQL Database
export async function updateDeviceSpeedLimit(macAddress: string, download: string, upload: string) {
    const supabase = await createClient();

    // Format the string exactly how your DB expects it (e.g., "10M/5M")
    const formattedSpeedLimit = `${download}/${upload}`;

    const { error } = await supabase
        .from('devices')
        .update({ speed_limit: formattedSpeedLimit })
        .eq('mac_address', macAddress); // We use the exact PK column name from your schema

    if (error) {
        console.error("Failed to update speed limit:", error);
        return { error: error.message };
    }

    // Force Next.js to immediately refetch the data so the UI updates
    revalidatePath('/admin');
    return { success: true };
}