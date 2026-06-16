'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, PlaySquare, StopCircle } from 'lucide-react';

type CalendarProps = {
    attendanceDates: string[]; // Array of "YYYY-MM-DD"
    subStart?: string | null;  // "YYYY-MM-DD"
    subEnd?: string | null;    // "YYYY-MM-DD"
};

export default function ModernCalendar({ attendanceDates, subStart, subEnd }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Generate blank spaces for the start of the month
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    // Generate the actual days
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl w-full max-w-md mx-auto">

            {/* Header Controls */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-slate-200 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-slate-50 tracking-wide">
                    {monthNames[month]} <span className="text-zinc-500 font-normal">{year}</span>
                </h2>
                <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-slate-200 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">{day}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {blanks.map(blank => (
                    <div key={`blank-${blank}`} className="h-10 w-full" />
                ))}

                {days.map(day => {
                    // Format current grid day to YYYY-MM-DD for comparison
                    const currentGridDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    const isAttended = attendanceDates.includes(currentGridDateStr);
                    const isSubStart = subStart === currentGridDateStr;
                    const isSubEnd = subEnd === currentGridDateStr;
                    const isToday = new Date().toISOString().split('T')[0] === currentGridDateStr;

                    // Determine styles based on your rules
                    let bgClass = "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800";
                    let borderClass = "border border-transparent";
                    let indicator = null;

                    if (isAttended) {
                        bgClass = "bg-emerald-500/10 text-emerald-400 font-bold";
                        borderClass = "border border-emerald-500/30";
                    }
                    if (isSubStart) {
                        indicator = <PlaySquare className="w-3 h-3 absolute top-1 right-1 text-emerald-400" />;
                        borderClass = "border border-emerald-500";
                    }
                    if (isSubEnd) {
                        indicator = <StopCircle className="w-3 h-3 absolute top-1 right-1 text-rose-500" />;
                        borderClass = "border border-rose-500";
                        if (!isAttended) bgClass = "bg-rose-500/10 text-rose-400 font-bold";
                    }

                    return (
                        <div
                            key={day}
                            className={`relative h-10 w-full rounded-lg flex items-center justify-center text-sm transition-all ${bgClass} ${borderClass} ${isToday ? 'ring-2 ring-sky-500/50' : ''}`}
                        >
                            {day}
                            {indicator}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-[10px] uppercase tracking-wider font-semibold text-zinc-500 justify-center border-t border-zinc-800/80 pt-4">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" /> Present</div>
                <div className="flex items-center"><PlaySquare className="w-3 h-3 text-emerald-400 mr-1.5" /> Sub Starts</div>
                <div className="flex items-center"><StopCircle className="w-3 h-3 text-rose-500 mr-1.5" /> Sub Expires</div>
            </div>
        </div>
    );
}