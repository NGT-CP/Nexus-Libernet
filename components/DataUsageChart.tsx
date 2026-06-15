'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity } from 'lucide-react';

export default function DataUsageChart({ data }: { data: any[] }) {

    // Custom Dark Mode Tooltip for the hover effect
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl">
                    <p className="text-slate-200 font-bold mb-2">{label}</p>
                    <div className="space-y-1 text-sm font-medium">
                        <p className="text-sky-400">Download: {payload[0].value} GB</p>
                        <p className="text-emerald-400">Upload: {payload[1].value} GB</p>
                        <div className="pt-2 mt-2 border-t border-zinc-800">
                            <p className="text-slate-400">Total: {(payload[0].value + payload[1].value).toFixed(2)} GB</p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-72 bg-zinc-950/50 border border-zinc-800/80 rounded-xl flex flex-col items-center justify-center text-zinc-500">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Not enough telemetry data to generate graph.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-80 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 pl-2">7-Day Network Traffic (GB)</h3>
            <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => val.split('-').slice(1).join('/')} // formats YYYY-MM-DD to MM/DD
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="Download"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorDown)"
                        />
                        <Area
                            type="monotone"
                            dataKey="Upload"
                            stroke="#34d399"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorUp)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}