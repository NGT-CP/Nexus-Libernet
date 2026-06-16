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

  // 1. Fetch Devices
  const { data: rawDevices } = await supabase.from('devices').select(`mac_address, ip_address, device_name, status, speed_limit, students ( name )`);
  const mappedDevices: any[] = (rawDevices as any[])?.map((d) => {
    const [down, up] = (d.speed_limit || '5M/5M').split('/');
    const studentData = Array.isArray(d.students) ? d.students[0] : d.students;
    return {
      mac: d.mac_address, hostname: d.device_name || 'Unknown Device', ip: String(d.ip_address || 'N/A'),
      status: d.status || 'pending', user: studentData?.name || 'Unassigned', down: down || '5M', up: up || '5M'
    };
  }) || [];

  // 2. Fetch Users (Added 'password' to the query string)
  const { data: rawStudents } = await supabase.from('students')
    .select(`id, name, phone, email, password, target_exam, address, emergency_contact, devices ( device_name, status ), subscriptions ( status, started_at, expires_at ), attendance ( attendance_date )`)
    .order('created_at', { ascending: false });

  const mappedUsers: any[] = (rawStudents as any[])?.map((s) => {
    const subsArray = Array.isArray(s.subscriptions) ? s.subscriptions : [];
    const activeSub = subsArray.find((sub: any) => sub.status === 'ACTIVE');
    const devicesArray = Array.isArray(s.devices) ? s.devices : [s.devices].filter(Boolean);
    const formattedDevices = devicesArray.map((d: any) => ({
      hostname: d.device_name || 'Unknown Hardware', status: d.status === 'bypassed' ? 'online' : 'offline'
    }));

    const attendanceDates = s.attendance?.map((a: any) => a.attendance_date) || [];

    return {
      id: `STU-${s.id}`, name: s.name, devices: formattedDevices,
      active_devices: formattedDevices.filter((d: any) => d.status === 'online').length,
      offline_devices: formattedDevices.filter((d: any) => d.status === 'offline').length,
      sub_start: activeSub?.started_at ? activeSub.started_at.split('T')[0] : 'None',
      sub_end: activeSub?.expires_at ? activeSub.expires_at.split('T')[0] : 'None',
      attendance: attendanceDates,
      raw: s
    };
  }) || [];

  // 3. Fetch Graph Data
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