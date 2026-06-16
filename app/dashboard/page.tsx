import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/');
    if (user.user_metadata?.role === 'admin') redirect('/admin');

    // Find the student profile linked to this user's email
    const { data: student } = await supabase
        .from('students')
        .select(`
      id, name, 
      attendance ( attendance_date ),
      subscriptions ( receipt_number, status, payment_method, started_at, expires_at, amount_paid )
    `)
        .eq('email', user.email)
        .single();

    if (!student) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-slate-50">
                <p>Your account is not linked to a student profile yet. Contact the administrator.</p>
            </div>
        );
    }

    // Extract dates for the calendar
    const attendanceDates = student.attendance?.map((a: any) => a.attendance_date) || [];

    // Find current active subscription dates
    const activeSub = student.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
    const subStart = activeSub?.started_at ? activeSub.started_at.split('T')[0] : null;
    const subEnd = activeSub?.expires_at ? activeSub.expires_at.split('T')[0] : null;

    return (
        <DashboardClient
            studentId={student.id}
            studentName={student.name}
            attendanceDates={attendanceDates}
            subStart={subStart}
            subEnd={subEnd}
            subscriptions={student.subscriptions || []}
        />
    );
}