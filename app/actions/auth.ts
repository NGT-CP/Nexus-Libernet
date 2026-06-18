'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const supabase = await createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const macAddress = formData.get('macAddress') as string;
    const ipAddress = formData.get('ipAddress') as string;

    // 1. Authenticate the user's password
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const user = data.user;
    const role = user.user_metadata?.role || 'student';

    // 2. The "Messenger" Logic (Hardware Sync)
    // Only execute if the MikroTik router successfully passed a MAC address
    if (macAddress && macAddress.length > 5) {
        let studentId = null;

        // Get internal Student ID for linking
        if (role !== 'admin') {
            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('email', email)
                .single();

            if (student) studentId = student.id;
        }

        // Insert the device into the database.
        // If student: Set to 'pending' (Triggers Library PC to evaluate them)
        // If admin: Set to 'bypassed' (Triggers Library PC to grant instant access)
        await supabase.from('devices').upsert({
            mac_address: macAddress,
            ip_address: ipAddress || '0.0.0.0',
            student_id: studentId,
            status: role === 'admin' ? 'bypassed' : 'pending',
            device_name: role === 'admin' ? 'Admin Device' : 'Student Device',
            speed_limit: role === 'admin' ? '100M/100M' : '5M/5M'
        }, { onConflict: 'mac_address' });
    }

    // 3. Route to the correct dashboard
    if (role === 'admin') redirect('/admin');
    else redirect('/dashboard');
}

export async function logoutAction() {
    const supabase = await createAdminClient();
    await supabase.auth.signOut();
    redirect('/');
}