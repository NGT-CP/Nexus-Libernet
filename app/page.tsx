'use client';

import { useState } from 'react';
import { Lock, Mail, Server, ArrowRight, Loader2, ShieldAlert, GraduationCap, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NexusLogo from '@/images/Nexus-logo.jpg';
import Image from 'next/image';

// Define the available roles to strictly type our state
type LoginRole = 'student' | 'admin' | null;

export default function LoginPage() {
    const router = useRouter();

    // UI State
    const [activeModal, setActiveModal] = useState<LoginRole>(null);

    // Form State
    const [identifier, setIdentifier] = useState(''); // Could be Email or Roll Number
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleOpenModal = (role: LoginRole) => {
        setActiveModal(role);
        setIdentifier('');
        setPassword('');
        setErrorMsg('');
    };

    const handleCloseModal = () => {
        if (loading) return; // Prevent closing while authenticating
        setActiveModal(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // Simulate network delay for UI demonstration
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (!identifier || !password) {
                throw new Error('Please provide valid credentials.');
            }

            // Route based on role
            if (activeModal === 'admin') {
                // router.push('/admin/dashboard');
                console.log("Admin login triggered");
            } else {
                router.push('/dashboard');
            }

        } catch (err: any) {
            setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">

            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-sky-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10 flex flex-col space-y-10">

                {/* Header */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center justify-center py-6">
                        <Image
                            src={NexusLogo}
                            alt="Nexus Logo"
                            className="w-[100px] h-[100px]"
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Libernet</h1>
                        <p className="text-zinc-400 text-sm mt-1 font-medium">
                            Select your authentication tier to continue
                        </p>
                    </div>
                </div>

                {/* Role Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Student Entry Card */}
                    <button
                        onClick={() => handleOpenModal('student')}
                        className="group flex flex-col items-start text-left p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:bg-zinc-800/60 hover:border-sky-500/30 hover:-translate-y-1 transition-all duration-200 backdrop-blur-md"
                    >
                        <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-sky-500/10 transition-colors mb-4">
                            <GraduationCap className="w-6 h-6 text-sky-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-200">Student Access</h2>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Log in to view your attendance history, active device bindings, and network limits.
                        </p>
                    </button>

                    {/* Admin Entry Card */}
                    <button
                        onClick={() => handleOpenModal('admin')}
                        className="group flex flex-col items-start text-left p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:bg-zinc-800/60 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-200 backdrop-blur-md"
                    >
                        <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-emerald-500/10 transition-colors mb-4">
                            <ShieldAlert className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-200">System Admin</h2>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Privileged access to hardware telemetry, student ledgers, and network overrides.
                        </p>
                    </button>

                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-zinc-600 font-mono">
                        Secured via Zero-Trust AES-256 Transport
                    </p>
                </div>
            </div>

            {/* --- THE AUTHENTICATION MODAL --- */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                    {/* Modal Backdrop overlay */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleCloseModal}
                    />

                    {/* Modal Content Box */}
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Close Button */}
                        <button
                            onClick={handleCloseModal}
                            disabled={loading}
                            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-slate-200 hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-50 flex items-center">
                                {activeModal === 'admin' ? (
                                    <><ShieldAlert className="w-5 h-5 text-emerald-500 mr-2" /> Admin Portal</>
                                ) : (
                                    <><GraduationCap className="w-5 h-5 text-sky-500 mr-2" /> Student Login</>
                                )}
                            </h2>
                            <p className="text-xs text-zinc-400 mt-1">
                                {activeModal === 'admin'
                                    ? 'Enter your privileged credentials.'
                                    : 'Use your registered library email or ID.'}
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="flex flex-col space-y-5">

                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input
                                        type="text" // Kept text to allow Roll Numbers later if needed
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-colors placeholder:text-zinc-600"
                                        placeholder={activeModal === 'admin' ? "sysadmin@libernet.local" : "student@example.com"}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-colors placeholder:text-zinc-600"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg flex items-center">
                                    <span className="text-xs font-medium text-amber-500">{errorMsg}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full group text-white text-sm font-medium rounded-lg py-3 px-4 flex items-center justify-center transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg mt-2 ${activeModal === 'admin'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/20'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Authenticate Session
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                    </div>
                </div>
            )}
        </main>
    );
}