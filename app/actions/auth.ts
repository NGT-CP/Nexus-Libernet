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
    if ((!macAddress || macAddress.length < 5) && role !== 'admin') {
        // Force sign out immediately to destroy their session token
        await supabase.auth.signOut();
        return { error: 'Network Security: You must be connected to the Library Wi-Fi to log in.' };
    }

    // 2. Hardware Sync & Security
    if (macAddress && macAddress.length > 5) {
        let studentId = null;

        if (role !== 'admin') {
            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('email', email)
                .single();

            if (student) {
                studentId = student.id;

                // ==========================================
                // SECURITY: HARDWARE BINDING (1 Device Per Student)
                // ==========================================
                const { data: registeredDevices } = await supabase
                    .from('devices')
                    .select('mac_address')
                    .eq('student_id', studentId);

                // If the student already has devices linked to their account...
                if (registeredDevices && registeredDevices.length > 0) {

                    // Check if the MAC they are using right now matches their linked device
                    const isRecognized = registeredDevices.some(
                        d => d.mac_address.toUpperCase() === macAddress.toUpperCase()
                    );

                    // If it's a completely different device, BLOCK THE LOGIN
                    if (!isRecognized) {
                        // Force logout so they don't even get a valid session token
                        await supabase.auth.signOut();
                        return { error: 'Device Limit Reached: Your account is permanently locked to another device. See Admin to reset.' };
                    }
                }
            }
        }

        // 3. Register the device (If it's their first time logging in, it locks this MAC to them)
        await supabase.from('devices').upsert({
            mac_address: macAddress,
            ip_address: ipAddress || '0.0.0.0',
            student_id: studentId,
            status: role === 'admin' ? 'bypassed' : 'pending',
            device_name: role === 'admin' ? 'Admin Device' : 'Student Device',
            speed_limit: role === 'admin' ? '100M/100M' : '5M/5M'
        }, { onConflict: 'mac_address' });
    }

    // 4. Route to the correct dashboard
    if (role === 'admin') redirect('/admin');
    else redirect('/dashboard');
}

export async function logoutAction() {
    const supabase = await createAdminClient();
    await supabase.auth.signOut();
    redirect('/');
}