'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function logDailyUsage(studentId: number, newDownBytes: number, newUpBytes: number) {
    const supabase = await createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: existingRecord } = await supabase
        .from('daily_data_usage')
        .select('bytes_downloaded, bytes_uploaded')
        .eq('student_id', studentId)
        .eq('record_date', today)
        .single();

    const currentDown = existingRecord?.bytes_downloaded || 0;
    const currentUp = existingRecord?.bytes_uploaded || 0;

    const { error } = await supabase
        .from('daily_data_usage')
        .upsert({
            student_id: studentId,
            record_date: today,
            bytes_downloaded: currentDown + newDownBytes,
            bytes_uploaded: currentUp + newUpBytes,
        }, { onConflict: 'student_id, record_date' });

    if (error) console.error("Telemetry Processing Fault:", error);
    return { success: !error };
}

export async function getNetworkGraphData() {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from('daily_data_usage')
        .select('record_date, bytes_downloaded, bytes_uploaded')
        .order('record_date', { ascending: true })
        .limit(1000);

    if (error || !data) return [];

    const groupedData = data.reduce((acc: any, row) => {
        const date = row.record_date;
        if (!acc[date]) {
            acc[date] = { name: date, Download: 0, Upload: 0 };
        }
        acc[date].Download += Number(row.bytes_downloaded) / (1024 ** 3);
        acc[date].Upload += Number(row.bytes_uploaded) / (1024 ** 3);
        return acc;
    }, {});

    return Object.values(groupedData).map((day: any) => ({
        ...day,
        Download: Number(day.Download.toFixed(2)),
        Upload: Number(day.Upload.toFixed(2))
    }));
}