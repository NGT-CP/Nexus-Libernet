'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const supabase = await createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const macAddress = formData.get('macAddress') as string;
    const ipAddress = formData.get('ipAddress') as string;

    console.log(`\n=== 🔐 NEW LOGIN ATTEMPT ===`);
    console.log(`Email: ${email}`);
    console.log(`MAC Address from Router: ${macAddress || 'NONE DETECTED'}`);

    // 1. Authenticate the User
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error("❌ Auth Error:", error.message);
        return { error: error.message };
    }

    const user = data.user;
    const role = user.user_metadata?.role || 'student';
    console.log(`Role: ${role.toUpperCase()}`);

    // 2. Hardware Sync (If MAC is provided)
    if (macAddress && macAddress.length > 5) {
        let targetStatus = 'blocked';
        let studentId = null;

        if (role === 'admin') {
            targetStatus = 'bypassed'; // Admin gets instant access
        } else {
            // Find the Student ID
            const { data: student } = await supabase.from('students').select('id').eq('email', email).single();
            if (student) {
                studentId = student.id;

                // Check if they already marked attendance today
                const today = new Date().toISOString().split('T')[0];
                const { data: att } = await supabase.from('attendance')
                    .select('id').eq('student_id', studentId).eq('attendance_date', today).single();

                if (att) {
                    targetStatus = 'bypassed'; // Already present, let them through
                    console.log(`✅ Student already marked present today. Bypassing.`);
                } else {
                    console.log(`⚠️ Student has NOT marked present today. Blocking.`);
                }
            } else {
                console.error("❌ ERROR: Could not find a student profile for this email in the database!");
            }
        }

        console.log(`Writing MAC ${macAddress} to Database as: ${targetStatus}`);

        // 3. Force the Device into the Database (This triggers the Library PC!)
        const { error: dbError } = await supabase.from('devices').upsert({
            mac_address: macAddress,
            ip_address: ipAddress || '0.0.0.0',
            student_id: studentId,
            status: targetStatus,
            device_name: role === 'admin' ? 'Admin Device' : 'Student Device',
            speed_limit: role === 'admin' ? '100M/100M' : '5M/5M'
        }, { onConflict: 'mac_address' });

        if (dbError) {
            console.error("❌ CRITICAL DATABASE ERROR (Upsert Failed):", dbError.message);
        } else {
            console.log("✅ Device saved to database successfully! Library PC should react NOW.");
        }
    } else {
        console.log("ℹ️ No MAC address detected. Skipping hardware sync.");
    }

    // 4. Redirect
    if (role === 'admin') redirect('/admin');
    else redirect('/dashboard');
}

export async function logoutAction() {
    const supabase = await createAdminClient();
    await supabase.auth.signOut();
    redirect('/');
}