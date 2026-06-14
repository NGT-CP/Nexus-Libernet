import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogOut, GraduationCap } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Kick out unauthenticated users
    if (!user) {
        redirect('/');
    }

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-6">

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl flex flex-col items-center text-center space-y-4 shadow-2xl">
                <GraduationCap className="w-12 h-12 text-sky-500" />

                <div>
                    <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Student Dashboard</h1>
                    <p className="text-sm text-zinc-400 mt-1">Logged in as: <span className="text-sky-400">{user.email}</span></p>
                </div>

                {/* Server Action Logout Form */}
                <form action={logoutAction} className="pt-4 w-full">
                    <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-zinc-950 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/50 text-zinc-400 hover:text-rose-400 px-4 py-3 rounded-lg transition-all duration-200">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </form>
            </div>

        </main>
    );
}