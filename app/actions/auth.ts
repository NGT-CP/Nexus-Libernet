'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const supabase = await createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const macAddress = formData.get('macAddress') as string;
    const ipAddress = formData.get('ipAddress') as string;

    // Authenticate User
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const user = data.user;
    const role = user.user_metadata?.role || 'student';

    // If a MAC address was detected, just dump it in the DB.
    // The Library PC will hear this INSERT/UPDATE and do the heavy lifting!
    if (macAddress && macAddress.length > 5) {
        let studentId = null;

        if (role !== 'admin') {
            const { data: student } = await supabase.from('students').select('id').eq('email', email).single();
            if (student) studentId = student.id;
        }

        await supabase.from('devices').upsert({
            mac_address: macAddress,
            ip_address: ipAddress || '0.0.0.0',
            student_id: studentId,
            status: role === 'admin' ? 'bypassed' : 'pending', // Admin gets bypassed, Student gets pending
            device_name: role === 'admin' ? 'Admin Device' : 'Student Device',
            speed_limit: role === 'admin' ? '100M/100M' : '5M/5M'
        }, { onConflict: 'mac_address' });
    }

    if (role === 'admin') redirect('/admin');
    else redirect('/dashboard');
}

export async function logoutAction() {
    const supabase = await createAdminClient();
    await supabase.auth.signOut();
    redirect('/');
}