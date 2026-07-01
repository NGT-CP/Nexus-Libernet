import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminClient';
import { getNetworkGraphData } from '@/app/actions/telemetry';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin') redirect('/');

  // 1. Fetch ALL Devices directly (Notice we added 'student_id' so we can link them manually)
  const { data: rawDevices } = await supabase.from('devices').select(`mac_address, ip_address, device_name, status, speed_limit, student_id, students ( name )`);

  const mappedDevices: any[] = (rawDevices as any[])?.map((d) => {
    const [down, up] = (d.speed_limit || '7M/7M').split('/');
    const studentData = Array.isArray(d.students) ? d.students[0] : d.students;
    return {
      mac: d.mac_address,
      hostname: d.device_name || 'Unknown Device',
      ip: String(d.ip_address || 'N/A'),
      status: d.status || 'pending',
      user: studentData?.name || 'Unassigned',
      down: down || '7M',
      up: up || '7M'
    };
  }) || [];

  // 2. Fetch Users (Removed the nested 'devices' query here)
  const { data: rawStudents } = await supabase.from('students')
    .select(`id, name, is_online, phone, email, password, target_exam, address, emergency_contact, subscriptions ( status, started_at, expires_at ), attendance ( attendance_date )`)
    .order('created_at', { ascending: false });

  // 3. Manually map Devices to Students to guarantee multi-device visibility
  const mappedUsers: any[] = (rawStudents as any[])?.map((s) => {
    const subsArray = Array.isArray(s.subscriptions) ? s.subscriptions : [];
    const activeSub = subsArray.find((sub: any) => sub.status === 'ACTIVE');

    // Find ALL devices belonging to this specific student ID from the raw array
    const studentDevices = (rawDevices as any[])?.filter(d => d.student_id === s.id) || [];

    const formattedDevices = studentDevices.map((d: any) => ({
      mac: d.mac_address,
      hostname: d.device_name || 'Unknown Hardware',
      status: d.status === 'bypassed' ? 'online' : 'offline'
    }));

    const attendanceDates = s.attendance?.map((a: any) => a.attendance_date) || [];

    return {
      id: `STU-${s.id}`,
      name: s.name,
      is_online: !!s.is_online,
      devices: formattedDevices, // Both devices will now securely pass to the UI
      active_devices: formattedDevices.filter((d: any) => d.status === 'online').length,
      offline_devices: formattedDevices.filter((d: any) => d.status === 'offline').length,
      sub_start: activeSub?.started_at ? activeSub.started_at.split('T')[0] : 'None',
      sub_end: activeSub?.expires_at ? activeSub.expires_at.split('T')[0] : 'None',
      attendance: attendanceDates,
      raw: s
    };
  }) || [];

  // 4. Fetch Graph Data
  const graphData = await getNetworkGraphData();

  return (
    <AdminDashboardClient
      adminUser={user}
      initialDevices={mappedDevices}
      initialUsers={mappedUsers}
      graphData={graphData}
    />
  );
}