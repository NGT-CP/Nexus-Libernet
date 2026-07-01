'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const MAX_DEVICES_PER_STUDENT = 2;

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

    // ==========================================
    // 1. ADMIN FLOW (Instant Bypass)
    // ==========================================
    if (role === 'admin') {
        // If the admin is physically connected to the library WiFi, bypass their MAC instantly.
        if (macAddress && macAddress.length > 5) {
            await supabase.from('devices').upsert({
                mac_address: macAddress.toUpperCase(),
                ip_address: ipAddress || '0.0.0.0',
                student_id: null, // Admins don't need to be linked to a student profile
                status: 'bypassed',
                device_name: 'Admin Device',
                role: role,
                speed_limit: role === 'admin' ? '100M/100M' : '7M/7M'
            }, { onConflict: 'mac_address' });
        }
        // Redirect immediately. If they are at home (no MAC), they still get in safely.
        redirect('/admin');
    }

    // ==========================================
    // 2. STUDENT FLOW (Device Limit Checks)
    // ==========================================
    if (!macAddress || macAddress.length < 5) {
        await supabase.auth.signOut();
        return { error: 'Access Denied: You must be connected to the Library Wi-Fi to log in.' };
    }

    // Find the student profile
    const { data: student } = await supabase.from('students').select('id,is_blocked').eq('email', email).single();

    if (!student) {
        await supabase.auth.signOut();
        return { error: 'No student profile found for this account.' };
    }

    const studentId = student.id;

    // Fetch all currently registered devices for this student
    const { data: registeredDevices } = await supabase
        .from('devices')
        .select('mac_address')
        .eq('student_id', studentId);

    if (registeredDevices && registeredDevices.length > 0) {
        const isRecognized = registeredDevices.some(
            d => d.mac_address.toUpperCase() === macAddress.toUpperCase()
        );

        // If it's a brand NEW device, enforce the limit
        if (!isRecognized && registeredDevices.length >= MAX_DEVICES_PER_STUDENT) {
            await supabase.auth.signOut();
            return {
                error: `Device Limit Reached: You can register up to ${MAX_DEVICES_PER_STUDENT} devices. Ask an admin to remove an old device first.`
            };
        }
    }

    // Upsert the device. Because we use onConflict: 'mac_address', a new phone gets a NEW row, 
    // while an existing phone just updates its IP address. This fixes the "second device not showing" bug!
    await supabase.from('devices').upsert({
        mac_address: macAddress.toUpperCase(),
        ip_address: ipAddress || '0.0.0.0',
        student_id: studentId,
        status: 'pending',
        device_name: 'Student Device',
        speed_limit: '7M/7M'
    }, { onConflict: 'mac_address' });

    // Send students to the dashboard
    redirect('/dashboard');
}

export async function logoutAction() {
    const supabase = await createAdminClient();
    await supabase.auth.signOut();
    redirect('/');
}

// Allows admins to easily free up a slot for a student
export async function removeStudentDevice(macAddress: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase.from('devices').delete().eq('mac_address', macAddress);
    if (error) return { error: error.message };
    return { success: true };
}