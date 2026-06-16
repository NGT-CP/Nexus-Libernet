'use client';

import React, { useState } from 'react';
import { LogOut, User, CheckCircle2, History, Receipt, Loader2 } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import ModernCalendar from '@/components/ModernCalendar';
import { useRouter } from 'next/navigation';

export default function DashboardClient({
    studentId, studentName, attendanceDates, subStart, subEnd, subscriptions
}: {
    studentId: number; studentName: string; attendanceDates: string[]; subStart: string | null; subEnd: string | null; subscriptions: any[];
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handleMarkAttendance = async () => {
        setLoading(true); setMsg({ type: '', text: '' });
        const { markAttendance } = await import('@/app/actions/student');
        const res = await markAttendance(studentId);

        if (res.error) setMsg({ type: 'error', text: res.error });
        else {
            setMsg({ type: 'success', text: 'Attendance logged successfully!' });
            router.refresh(); // Update the calendar instantly
        }
        setLoading(false);
    };

    // Sort subscriptions newest first
    const sortedSubs = [...subscriptions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    return (
        <div className="min-h-screen bg-zinc-950 text-slate-50 font-sans p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-sky-500/10 rounded-full border border-sky-500/30 flex items-center justify-center">
                            <User className="w-6 h-6 text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Welcome back, {studentName}</h1>
                            <p className="text-sm text-zinc-400">Student Portal</p>
                        </div>
                    </div>
                    <form action={logoutAction}>
                        <button className="px-4 py-2 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/50 text-zinc-400 hover:text-rose-400 rounded-xl transition-all text-sm font-medium flex items-center">
                            <LogOut className="w-4 h-4 mr-2" /> Logout
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Calendar & Attendance */}
                    <div className="space-y-6">
                        <ModernCalendar attendanceDates={attendanceDates} subStart={subStart} subEnd={subEnd} />

                        <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                            <h3 className="text-lg font-bold mb-2">Daily Check-In</h3>
                            <p className="text-xs text-zinc-400 mb-6">Mark your attendance to maintain access to the library network.</p>

                            {msg.text && (
                                <div className={`w-full mb-4 p-3 rounded-lg text-xs font-medium border ${msg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                    {msg.text}
                                </div>
                            )}

                            <button
                                onClick={handleMarkAttendance}
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Log Present Today</>}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Subscription History */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[700px]">
                        <div className="p-6 border-b border-zinc-800/80 flex items-center">
                            <History className="w-5 h-5 text-sky-400 mr-2" />
                            <h3 className="text-lg font-bold">Subscription History</h3>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {sortedSubs.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center italic mt-10">No subscription history found.</p>
                            ) : (
                                sortedSubs.map((sub, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border relative overflow-hidden ${sub.status === 'ACTIVE' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                                        {sub.status === 'ACTIVE' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}

                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${sub.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                                    {sub.status}
                                                </span>
                                                <p className="text-xs text-zinc-400 mt-2 font-mono flex items-center"><Receipt className="w-3 h-3 mr-1" /> {sub.receipt_number}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-200">{sub.payment_method === 'CASH' ? `₹${sub.amount_paid}` : 'FREE TRIAL'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between text-xs text-zinc-400">
                                            <div><span className="text-zinc-500 block text-[10px] uppercase">Started</span> {new Date(sub.started_at).toLocaleDateString()}</div>
                                            <div className="text-right"><span className="text-zinc-500 block text-[10px] uppercase">Expires</span> {new Date(sub.expires_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}