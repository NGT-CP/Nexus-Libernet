'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markAttendance(studentId: number) {
    const supabase = await createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .single();

    if (existing) return { error: 'Attendance already marked for today.' };

    // 1. Insert Attendance
    const { error } = await supabase.from('attendance').insert({
        student_id: studentId,
        attendance_date: today,
        marked_by: 'STUDENT',
    });

    if (error) return { error: error.message };

    // 2. Instantly grant internet access to all devices owned by this student
    await supabase
        .from('devices')
        .update({ status: 'bypassed' })
        .eq('student_id', studentId);

    revalidatePath('/dashboard');
    revalidatePath('/admin');

    return { success: true };
}