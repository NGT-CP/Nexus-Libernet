'use client';

import { useState } from 'react';
import { Lock, Mail, Server, ArrowRight, Loader2, ShieldAlert, GraduationCap, X } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

type LoginRole = 'student' | 'admin' | null;

export default function LoginPage() {
    const [activeModal, setActiveModal] = useState<LoginRole>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleOpenModal = (role: LoginRole) => {
        setActiveModal(role);
        setErrorMsg('');
    };

    const handleCloseModal = () => {
        if (loading) return;
        setActiveModal(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const formData = new FormData(e.currentTarget);

        // Execute the backend Server Action
        const result = await loginAction(formData, activeModal!);

        // If it succeeds, the Server Action redirects automatically. 
        // If it fails, we catch the error here and unlock the UI.
        if (result?.error) {
            setErrorMsg(result.error);
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-sky-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10 flex flex-col space-y-10">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shadow-lg">
                        <Server className="w-6 h-6 text-sky-500" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Libernet OS</h1>
                        <p className="text-zinc-400 text-sm mt-1 font-medium">Select your authentication tier to continue</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => handleOpenModal('student')} className="group flex flex-col items-start text-left p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:bg-zinc-800/60 hover:border-sky-500/30 transition-all backdrop-blur-md">
                        <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-sky-500/10 transition-colors mb-4">
                            <GraduationCap className="w-6 h-6 text-sky-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-200">Student Access</h2>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Log in to view your attendance history and active device bindings.</p>
                    </button>

                    <button onClick={() => handleOpenModal('admin')} className="group flex flex-col items-start text-left p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:bg-zinc-800/60 hover:border-emerald-500/30 transition-all backdrop-blur-md">
                        <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-emerald-500/10 transition-colors mb-4">
                            <ShieldAlert className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-200">System Admin</h2>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Privileged access to hardware telemetry and network overrides.</p>
                    </button>
                </div>
            </div>

            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        <button onClick={handleCloseModal} disabled={loading} className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-slate-200 hover:bg-zinc-800 rounded-md transition-colors">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-50 flex items-center">
                                {activeModal === 'admin' ? <><ShieldAlert className="w-5 h-5 text-emerald-500 mr-2" /> Admin Portal</> : <><GraduationCap className="w-5 h-5 text-sky-500 mr-2" /> Student Login</>}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input type="text" name="email" className="w-full bg-black/40 border border-zinc-800 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors" placeholder={activeModal === 'admin' ? "sysadmin@libernet.local" : "student@example.com"} required />
                                </div>
                            </div>

                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input type="password" name="password" className="w-full bg-black/40 border border-zinc-800 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors" placeholder="••••••••••••" required />
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg">
                                    <span className="text-xs font-medium text-amber-500">{errorMsg}</span>
                                </div>
                            )}

                            <button type="submit" disabled={loading} className={`w-full text-white text-sm font-medium rounded-lg py-3 px-4 flex items-center justify-center transition-all ${activeModal === 'admin' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'}`}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Authenticate Session <ArrowRight className="w-4 h-4 ml-2" /></>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}