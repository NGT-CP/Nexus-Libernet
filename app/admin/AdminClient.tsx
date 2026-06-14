'use client';

import React, { useState, Fragment } from 'react';
import {
    ShieldAlert, LogOut, Activity, Users, Network, Router,
    BarChart3, Download, Upload, Plus, Edit, Settings2, UserCog, X, ChevronDown, Save, Loader2
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { updateAdminProfile, updateDeviceSpeedLimit } from '@/app/actions/admin';

export default function AdminDashboardClient({
    adminUser,
    initialDevices,
    initialUsers
}: {
    adminUser: any;
    initialDevices: any[];
    initialUsers: any[];
}) {

    // UI State
    const [activeTab, setActiveTab] = useState('overview');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [expandedMac, setExpandedMac] = useState<string | null>(null);

    // Form State
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Temporary State for inline speed limits
    const [tempDown, setTempDown] = useState('');
    const [tempUp, setTempUp] = useState('');

    // ==========================================
    // HANDLERS
    // ==========================================
    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        const formData = new FormData(e.currentTarget);
        const res = await updateAdminProfile(formData);

        if (res.error) setMsg({ type: 'error', text: res.error });
        else setMsg({ type: 'success', text: 'Profile updated. Check email for confirmation if changed.' });

        setLoading(false);
    };

    const toggleSpeedLimitRow = (conn: any) => {
        if (expandedMac === conn.mac) {
            setExpandedMac(null);
        } else {
            setExpandedMac(conn.mac);
            setTempDown(conn.down);
            setTempUp(conn.up);
        }
    };

    const handleSaveSpeedLimit = async (mac: string) => {
        await updateDeviceSpeedLimit(mac, tempDown, tempUp);
        setExpandedMac(null);
    };

    return (
        <div className="min-h-screen flex w-full bg-zinc-950 text-slate-50 font-sans">

            {/* LEFT SIDEBAR SECTION */}
            <aside className="w-64 bg-zinc-900/40 border-r border-zinc-800/80 flex flex-col justify-between backdrop-blur-xl shrink-0">
                <div>
                    <div className="p-6 border-b border-zinc-800/80">
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="w-full flex items-center space-x-3 p-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 rounded-xl transition-all group"
                        >
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <UserCog className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="text-left overflow-hidden">
                                <p className="text-sm font-bold truncate">System Admin</p>
                                <p className="text-xs text-zinc-500 truncate">{adminUser.email}</p>
                            </div>
                        </button>
                    </div>

                    <nav className="p-4 space-y-1.5">
                        {[
                            { id: 'overview', icon: Activity, label: 'Overview' },
                            { id: 'connections', icon: Network, label: 'Live Connections' },
                            { id: 'users', icon: Users, label: 'User Directory' },
                            { id: 'router', icon: Router, label: 'Router Info' },
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner'
                                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-slate-200 border border-transparent'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-zinc-800/80">
                    <form action={logoutAction}>
                        <button type="submit" className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-zinc-950 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/50 text-zinc-400 hover:text-rose-400 rounded-xl transition-all text-sm font-medium group">
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Terminate Session</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* MAIN CONTENT CANVAS */}
            <main className="flex-1 p-8 overflow-y-auto bg-zinc-950 relative">
                <div className="max-w-6xl mx-auto space-y-6">

                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md min-h-[600px] shadow-2xl">

                        {/* 1. OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="animate-in fade-in">
                                <h2 className="text-xl font-bold text-slate-50 mb-6 border-b border-zinc-800 pb-4">Network Telemetry</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                                        <p className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Total Users</p>
                                        {/* Dynamically count users from the database */}
                                        <p className="text-4xl font-bold mt-2 text-slate-50">{initialUsers.length}</p>
                                    </div>
                                    <div className="p-6 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                                        <p className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Total Devices</p>
                                        {/* Dynamically count devices from the database */}
                                        <p className="text-4xl font-bold mt-2 text-emerald-400">{initialDevices.length}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. CONNECTIONS TAB */}
                        {activeTab === 'connections' && (
                            <div className="animate-in fade-in space-y-6">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                    <h2 className="text-xl font-bold text-slate-50">Live Connections</h2>
                                    <button className="px-3 py-1.5 bg-zinc-800 text-xs font-medium rounded-md hover:bg-zinc-700 transition-colors flex items-center"><Settings2 className="w-3 h-3 mr-1" /> Global Rules</button>
                                </div>

                                <div className="overflow-x-auto border border-zinc-800/80 rounded-xl">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-4 border-b border-zinc-800">Hostname / MAC</th>
                                                <th className="px-4 py-4 border-b border-zinc-800">IP Address</th>
                                                <th className="px-4 py-4 border-b border-zinc-800">Status</th>
                                                <th className="px-4 py-4 border-b border-zinc-800">User Assignment</th>
                                                <th className="px-4 py-4 border-b border-zinc-800">Speed (D/U)</th>
                                                <th className="px-4 py-4 border-b border-zinc-800 text-right">Settings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50">
                                            {/* NOW USING REAL DATABASE DEVICES */}
                                            {initialDevices.map((conn) => (
                                                <Fragment key={conn.mac}>
                                                    <tr className={`transition-colors ${expandedMac === conn.mac ? 'bg-sky-900/10' : 'hover:bg-zinc-800/20'}`}>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-slate-200">{conn.hostname}</div>
                                                            <div className="text-xs text-zinc-500 font-mono">{conn.mac}</div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-zinc-400">{conn.ip}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded border ${conn.status === 'bypassed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                                                                {conn.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-zinc-300">{conn.user}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center space-x-2 text-xs">
                                                                <span className="flex items-center text-sky-400"><Download className="w-3 h-3 mr-1" /> {conn.down}</span>
                                                                <span className="flex items-center text-emerald-400"><Upload className="w-3 h-3 mr-1" /> {conn.up}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => toggleSpeedLimitRow(conn)}
                                                                className="flex items-center justify-end w-full text-zinc-400 hover:text-sky-400 text-xs font-medium focus:outline-none transition-colors"
                                                            >
                                                                Manage <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${expandedMac === conn.mac ? 'rotate-180 text-sky-400' : ''}`} />
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {expandedMac === conn.mac && (
                                                        <tr className="bg-black/40 shadow-inner">
                                                            <td colSpan={6} className="px-6 py-4 border-b border-zinc-800">
                                                                <div className="flex items-end justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                                                                    <div className="flex space-x-4">
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs text-zinc-500 font-semibold uppercase">Download Limit</label>
                                                                            <div className="relative">
                                                                                <Download className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                                                                                <input
                                                                                    type="text"
                                                                                    value={tempDown}
                                                                                    onChange={(e) => setTempDown(e.target.value)}
                                                                                    className="w-28 bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                                                                                    placeholder="e.g. 5M"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs text-zinc-500 font-semibold uppercase">Upload Limit</label>
                                                                            <div className="relative">
                                                                                <Upload className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                                                                                <input
                                                                                    type="text"
                                                                                    value={tempUp}
                                                                                    onChange={(e) => setTempUp(e.target.value)}
                                                                                    className="w-28 bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                                                                                    placeholder="e.g. 5M"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleSaveSpeedLimit(conn.mac)}
                                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg flex items-center transition-colors"
                                                                    >
                                                                        <Save className="w-4 h-4 mr-2" /> Apply Queue
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            ))}
                                            {initialDevices.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-sm">No devices found in database.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 3. USERS TAB */}
                        {activeTab === 'users' && (
                            <div className="animate-in fade-in space-y-6">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                    <h2 className="text-xl font-bold text-slate-50">Registered Profiles</h2>
                                    <button className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-md hover:bg-emerald-600/30 transition-colors flex items-center">
                                        <Plus className="w-3 h-3 mr-1" /> Add User
                                    </button>
                                </div>

                                <div className="overflow-x-auto border border-zinc-800/80 rounded-xl">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-4 border-b border-zinc-800">User ID / Name</th>
                                                <th className="px-4 py-4 border-b border-zinc-800">Registered Devices</th>
                                                <th className="px-4 py-4 border-b border-zinc-800">Subscription Status</th>
                                                <th className="px-4 py-4 border-b border-zinc-800 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50">
                                            {/* NOW USING REAL DATABASE USERS */}
                                            {initialUsers.map((u, i) => (
                                                <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-200">{u.name}</div>
                                                        <div className="text-xs text-zinc-500 font-mono">{u.id}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col space-y-1.5">
                                                            {u.devices.map((device: any, idx: number) => (
                                                                <div key={idx} className="flex items-center space-x-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-700'}`} />
                                                                    <span className={`text-xs ${device.status === 'online' ? 'text-slate-300' : 'text-zinc-500'}`}>
                                                                        {device.hostname}
                                                                    </span>
                                                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${device.status === 'online' ? 'text-emerald-500/80' : 'text-zinc-600'}`}>
                                                                        {device.status}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {u.devices.length === 0 && <span className="text-xs text-zinc-600 italic">No devices</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {u.sub_start === 'None' ? (
                                                            <span className="text-zinc-500 italic text-xs">No Active Sub</span>
                                                        ) : (
                                                            <div className="text-xs">
                                                                <div className="text-zinc-300">Start: {u.sub_start}</div>
                                                                <div className="text-zinc-500">End: {u.sub_end}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right space-x-4">
                                                        <button className="text-emerald-500 hover:text-emerald-400 text-xs font-medium inline-flex items-center"><Plus className="w-3 h-3 mr-1" /> Sub</button>
                                                        <button className="text-sky-500 hover:text-sky-400 text-xs font-medium inline-flex items-center"><Edit className="w-3 h-3 mr-1" /> Edit</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {initialUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-sm">No users found in database.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 4. ROUTER INFO TAB */}
                        {activeTab === 'router' && (
                            <div className="animate-in fade-in space-y-6">
                                <h2 className="text-xl font-bold text-slate-50 border-b border-zinc-800 pb-4">Hardware Diagnostics</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-6">
                                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 flex items-center">
                                            <Settings2 className="w-4 h-4 mr-2" /> System Versions
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between"><span className="text-zinc-500">RouterOS</span><span className="text-slate-300 font-mono bg-zinc-800/50 px-2 rounded">v7.22.3</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500">Firmware</span><span className="text-slate-300 font-mono bg-zinc-800/50 px-2 rounded">7.12</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500">Architecture</span><span className="text-slate-300 font-mono bg-zinc-800/50 px-2 rounded">ARM64</span></div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-6">
                                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 flex items-center">
                                            <Activity className="w-4 h-4 mr-2" /> Hardware Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between"><span className="text-zinc-500">Board Name</span><span className="text-slate-300">MikroTik hAP ax3</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500">CPU Load</span><span className="text-emerald-400 font-medium">12%</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500">Uptime</span><span className="text-slate-300">14d 6h 22m</span></div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-6">
                                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 flex items-center">
                                            <Network className="w-4 h-4 mr-2" /> NAT Configuration
                                        </h3>
                                        <div className="text-sm text-zinc-400 space-y-3">
                                            <p className="flex items-center bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg text-emerald-400">
                                                <ShieldAlert className="w-4 h-4 mr-2" /> Masquerade Active (WAN1)
                                            </p>
                                            <p className="flex items-center p-2">
                                                <Activity className="w-4 h-4 text-zinc-500 mr-2" /> Walled Garden Bypassed
                                            </p>
                                            <p className="flex items-center p-2">
                                                <Activity className="w-4 h-4 text-sky-500 mr-2" /> Hotspot Profile Linked
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* ADMIN PROFILE MODAL */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
                    <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">

                        <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-slate-200 transition-colors">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center">
                                <ShieldAlert className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-50">Admin Profile</h2>
                                <p className="text-xs text-zinc-400">Security Credentials</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase">Change Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    defaultValue={adminUser.email}
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase">Change Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Leave blank to keep current"
                                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600"
                                />
                            </div>

                            {msg.text && (
                                <div className={`p-3 rounded-lg text-xs font-medium border ${msg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                    {msg.text}
                                </div>
                            )}

                            <button disabled={loading} type="submit" className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg py-2.5 text-sm transition-colors flex justify-center mt-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Credentials'}
                            </button>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}