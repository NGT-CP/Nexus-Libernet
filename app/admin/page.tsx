import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminClient';
import { getNetworkGraphData } from '@/app/actions/telemetry';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  // Use the high-privilege admin client to read across RLS boundaries
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  // 1. Fetch Devices (Bypassing RLS)
  const { data: rawDevices, error: devError } = await supabase
    .from('devices')
    .select(`mac_address, ip_address, device_name, status, speed_limit, students ( name )`);

  if (devError) console.error("Admin Fetch Error (devices):", devError);

  const mappedDevices: any[] = (rawDevices as any[])?.map((d) => {
    const [down, up] = (d.speed_limit || '5M/5M').split('/');
    const studentData = Array.isArray(d.students) ? d.students[0] : d.students;
    return {
      mac: d.mac_address,
      hostname: d.device_name || 'Unknown Device',
      ip: String(d.ip_address || 'N/A'),
      status: d.status || 'pending',
      user: studentData?.name || 'Unassigned',
      down: down || '5M',
      up: up || '5M'
    };
  }) || [];

  // 2. Fetch Users & Relational Joins (Bypassing RLS)
  const { data: rawStudents, error: stuError } = await supabase
    .from('students')
    .select(`id, name, devices ( device_name, status ), subscriptions ( status, started_at, expires_at )`);

  if (stuError) console.error("Admin Fetch Error (students):", stuError);

  const mappedUsers: any[] = (rawStudents as any[])?.map((s) => {
    const subsArray = Array.isArray(s.subscriptions) ? s.subscriptions : [];
    // Identify the true current active pass
    const activeSub = subsArray.find((sub: any) => sub.status === 'ACTIVE');

    const devicesArray = Array.isArray(s.devices) ? s.devices : [s.devices].filter(Boolean);
    const formattedDevices = devicesArray.map((d: any) => ({
      hostname: d.device_name || 'Unknown Hardware',
      status: d.status === 'bypassed' ? 'online' : 'offline'
    }));

    return {
      id: `STU-${s.id}`,
      name: s.name,
      devices: formattedDevices,
      active_devices: formattedDevices.filter((d: any) => d.status === 'online').length,
      offline_devices: formattedDevices.filter((d: any) => d.status === 'offline').length,
      sub_start: activeSub?.started_at ? new Date(activeSub.started_at).toLocaleDateString() : 'None',
      sub_end: activeSub?.expires_at ? new Date(activeSub.expires_at).toLocaleDateString() : 'None'
    };
  }) || [];

  // 3. Fetch Graph Time-Series Data
  const graphData = await getNetworkGraphData();
  console.log("--- DEBUG: DATABASE USERS ---", mappedUsers.length);
  console.log("--- DEBUG: GRAPH ROWS ---", graphData);

  return (
    <AdminDashboardClient
      adminUser={user}
      initialDevices={mappedDevices}
      initialUsers={mappedUsers}
      graphData={graphData}
    />
  );
}