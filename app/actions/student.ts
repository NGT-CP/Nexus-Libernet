'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markAttendance(studentId: number) {
    const supabase = await createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Check if already marked
    const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .single();

    if (existing) return { error: 'Attendance already marked for today.' };

    // 2. Insert Attendance Record
    const { error } = await supabase.from('attendance').insert({
        student_id: studentId,
        attendance_date: today,
        marked_by: 'STUDENT',
    });

    if (error) return { error: error.message };

    // 3. TRIGGER THE STATE MACHINE (Library PC)
    // By updating the status to 'pending', the Library PC will catch the 
    // WebSocket event, see that attendance is now true, and grant internet access!
    await supabase
        .from('devices')
        .update({ status: 'pending' })
        .eq('student_id', studentId);

    // Refresh the UI
    revalidatePath('/dashboard');
    revalidatePath('/admin');

    return { success: true };
}