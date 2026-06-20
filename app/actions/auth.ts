'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const supabase = await createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const macAddress = formData.get('macAddress') as string;
    const ipAddress = formData.get('ipAddress') as string;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const user = data.user;
    const role = user.user_metadata?.role || 'student';

    if ((!macAddress || macAddress.length < 5) && role !== 'admin') {
        await supabase.auth.signOut();
        return { error: 'Access Denied: You must be connected to the Library Wi-Fi to log in.' };
    }

    if (macAddress && macAddress.length > 5) {
        let studentId = null;

        if (role !== 'admin') {
            const { data: student } = await supabase.from('students').select('id').eq('email', email).single();

            if (student) {
                studentId = student.id;

                const { data: registeredDevices } = await supabase.from('devices').select('mac_address').eq('student_id', studentId);

                if (registeredDevices && registeredDevices.length > 0) {
                    const isRecognized = registeredDevices.some(d => d.mac_address.toUpperCase() === macAddress.toUpperCase());

                    if (!isRecognized) {
                        await supabase.auth.signOut();
                        return { error: 'Device Limit Reached: Your account is locked to another device.' };
                    }
                }
            }
        }

        // ADMIN DIRECT BYPASS: Role 'admin' is instantly inserted as 'bypassed' 
        // triggering the Enforcer's Instant Net feature immediately.
        await supabase.from('devices').upsert({
            mac_address: macAddress,
            ip_address: ipAddress || '0.0.0.0',
            student_id: studentId,
            status: role === 'admin' ? 'bypassed' : 'pending',
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