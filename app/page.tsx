'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Wifi, Mail, Lock, Router } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans text-slate-50 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-emerald-500" />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}

function LoginForm() {
    const searchParams = useSearchParams();

    // Grab MAC and IP from MikroTik redirect URL
    const mac = searchParams.get('mac') || '';
    const ip = searchParams.get('ip') || '';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true); setError('');

        const formData = new FormData(e.currentTarget);
        const res = await loginAction(formData);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-3xl shadow-2xl p-8 backdrop-blur-xl z-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <Wifi className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Library Network</h1>
                <p className="text-sm text-zinc-400 mt-2">Authenticate to access high-speed internet.</p>
            </div>

            {mac && (
                <div className="mb-6 p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center text-sky-400 text-xs">
                    <Router className="w-4 h-4 mr-3 shrink-0" />
                    <div>
                        <p className="font-semibold uppercase tracking-wider text-[10px]">Hardware Sync Active</p>
                        <p className="font-mono mt-0.5">Device: {mac}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* THESE HIDDEN INPUTS SEND THE HARDWARE DATA TO VERCEL */}
                <input type="hidden" name="macAddress" value={mac} />
                <input type="hidden" name="ipAddress" value={ip} />

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">Email Address</label>
                    <div className="relative">
                        <Mail className="w-5 h-5 absolute left-3 top-3 text-zinc-500" />
                        <input required type="email" name="email" placeholder="student@example.com" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">Password</label>
                    <div className="relative">
                        <Lock className="w-5 h-5 absolute left-3 top-3 text-zinc-500" />
                        <input required type="password" name="password" placeholder="••••••••" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" />
                    </div>
                </div>

                {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center">{error}</div>}

                <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center mt-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5 mr-2" /> Secure Login</>}
                </button>
            </form>
        </div>
    );
}