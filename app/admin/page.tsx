import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminClient';

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  // ==========================================
  // 1. FETCH LIVE CONNECTIONS (Devices Table)
  // ==========================================
  const { data: rawDevices, error: devError } = await supabase
    .from('devices')
    .select(`
      mac_address,
      ip_address,
      device_name,
      status,
      speed_limit,
      students ( name )
    `);

  if (devError) console.error("Database Error (Devices):", devError);

  // FIX 1 & 2: Explicitly type as any[] to satisfy the Client Component, 
  // and handle the Supabase object/array join ambiguity.
  const mappedDevices: any[] = (rawDevices as any[])?.map((d) => {
    const [down, up] = (d.speed_limit || '5M/5M').split('/'); 
    
    // Safely extract the student name whether Supabase returns an array or an object
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

  // ==========================================
  // 2. FETCH REGISTERED USERS (Students Table)
  // ==========================================
  const { data: rawStudents, error: stuError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      devices ( device_name, status ),
      subscriptions ( status, started_at, expires_at )
    `);

  if (stuError) console.error("Database Error (Students):", stuError);

  // Apply the same strict any[] typing here
  const mappedUsers: any[] = (rawStudents as any[])?.map((s) => {
    
    const subsArray = Array.isArray(s.subscriptions) ? s.subscriptions : [];
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

  // Cast to any to satisfy mismatched prop typings between server and client component
  return (
    <AdminDashboardClient {...({ adminUser: user, initialDevices: mappedDevices, initialUsers: mappedUsers } as any)} />
  );
}