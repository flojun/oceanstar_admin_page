"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

// ---------- Types ----------
interface DailyStats {
    totalPax: number;
    optionStats: Record<string, number>; // "1부": 40, "2부": 12...
}

// ---------- Helper: Parse Pax ----------
// Example: "2명" -> 2
function parsePax(paxStr: string): number {
    if (!paxStr) return 0;
    const num = parseInt(paxStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

// ---------- Helper: Option Grouping ----------
function getOptionGroupKey(option: string): string {
    if (!option) return '기타';
    const lower = option.toLowerCase();
    if (lower.includes('1부')) return '1부';
    if (lower.includes('2부')) return '2부';
    if (lower.includes('3부')) return '3부';
    // Treat Turtle, Para, Jet as their own or "기타" depending on rendering requirement.
    // Spec says Traffic Light Logic applies to 1,2,3. Others are gray/blue.
    if (lower.includes('거북이')) return '거북이';
    if (lower.includes('패러')) return '패러';
    if (lower.includes('제트')) return '제트';
    return '기타';
}

// ---------- Traffic Light Logic ----------
// Returns color class and width percentage
function getReservationStatus(group: string, count: number) {
    let max = 0;
    // Default for others: Pink (기타)
    let color = 'from-pink-400 to-pink-600 border-pink-300';
    let percent = 100;

    if (group === '1부' || group === '2부') {
        max = 45;
        if (count >= 46) color = 'from-red-500 to-red-700 border-red-400'; // 초과 (Red)
        else if (count >= 44) color = 'from-blue-500 to-blue-700 border-blue-400'; // 마감 (Blue)
        else if (count >= 10) color = 'from-emerald-400 to-emerald-600 border-emerald-300'; // 10+ (Green)
        else color = 'from-yellow-400 to-yellow-600 border-yellow-300'; // 1~9 (Yellow)

        percent = Math.min(100, (count / max) * 100);
    } else if (group === '3부') {
        max = 40;
        if (count >= 41) color = 'from-red-500 to-red-700 border-red-400'; // 초과
        else if (count >= 38) color = 'from-blue-500 to-blue-700 border-blue-400'; // 마감
        else if (count >= 10) color = 'from-emerald-400 to-emerald-600 border-emerald-300'; // 10+
        else color = 'from-yellow-400 to-yellow-600 border-yellow-300'; // 1~9

        percent = Math.min(100, (count / max) * 100);
    }

    return { color, percent };
}



// Order to render bars
const DISPLAY_ORDER = ['1부', '2부', '3부', '패러 및 제트', '패러', '제트', '기타'];

export default function MonthlyPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // For mobile double-tap

    // Calculate Month Range
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fetch Data
    useEffect(() => {
        const fetchMonthData = async () => {
            setLoading(true);
            const startStr = format(monthStart, 'yyyy-MM-dd');
            const endStr = format(monthEnd, 'yyyy-MM-dd');

            try {
                const { data, error } = await supabase
                    .from("reservations")
                    .select("*")
                    .gte("tour_date", startStr)
                    .lte("tour_date", endStr);

                if (error) throw error;
                setReservations(data || []);
            } catch (err) {
                console.error("Fetch monthly error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMonthData();
    }, [currentDate]);

    // Aggregate Data by Date
    const statsByDate = useMemo(() => {
        const stats: Record<string, DailyStats> = {};

        reservations.forEach(r => {
            const dateKey = r.tour_date; // YYYY-MM-DD
            if (!stats[dateKey]) {
                stats[dateKey] = { totalPax: 0, optionStats: {} };
            }

            const pax = parsePax(r.pax);
            const group = getOptionGroupKey(r.option);

            // Add to Group
            stats[dateKey].optionStats[group] = (stats[dateKey].optionStats[group] || 0) + pax;
            // Add to Total
            stats[dateKey].totalPax += pax;
        });

        return stats;
    }, [reservations]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleYearMonthChange = (e: React.ChangeEvent<HTMLSelectElement>, type: 'year' | 'month') => {
        const newDate = new Date(currentDate);
        if (type === 'year') newDate.setFullYear(parseInt(e.target.value));
        if (type === 'month') newDate.setMonth(parseInt(e.target.value));
        setCurrentDate(newDate);
    };

    // Navigate to Today view with date param (with double-tap on mobile)
    const handleDateClick = (dateStr: string) => {
        // Check if same date is already selected (second tap)
        if (selectedDate === dateStr) {
            router.push(`/dashboard/today?date=${dateStr}`);
            setSelectedDate(null); // Reset selection after navigation
        } else {
            // First tap: just select the date
            setSelectedDate(dateStr);
        }
    };

    // Calculate grid blanks
    const startDayOfWeek = monthStart.getDay(); // 0 (Sun) - 6 (Sat)
    const blanks = Array.from({ length: startDayOfWeek });

    // Range for Picker
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i); // Current -2 to +2
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })}
                </h2>
                <div className="flex gap-2 items-center relative">
                    <button onClick={handlePrevMonth} className="p-2 rounded hover:bg-blue-50 text-blue-600 transition-colors">
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    {/* Date Picker Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="px-4 py-2 text-sm font-bold bg-white border border-blue-200 rounded-full shadow-sm text-blue-700 hover:bg-blue-50 transition-all flex items-center gap-2"
                        >
                            <span>{format(currentDate, 'yyyy.MM')}</span>
                            <span className="text-xs">▼</span>
                        </button>

                        {/* Dropdown Popup */}
                        {showDatePicker && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-3 z-50 grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <select
                                    className="p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    value={currentDate.getFullYear()}
                                    onChange={(e) => handleYearMonthChange(e, 'year')}
                                >
                                    {years.map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select
                                    className="p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    value={currentDate.getMonth()}
                                    onChange={(e) => handleYearMonthChange(e, 'month')}
                                >
                                    {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
                                </select>
                                <button
                                    onClick={() => { setCurrentDate(new Date()); setShowDatePicker(false); }}
                                    className="col-span-2 mt-1 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                    오늘 날짜로 이동
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={handleNextMonth} className="p-2 rounded hover:bg-blue-50 text-blue-600 transition-colors">
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Overlay to close picker */}
                    {showDatePicker && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="w-full border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-200px)] sm:max-h-none sm:flex-1">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-blue-100 bg-blue-50/50">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                        <div key={day} className={cn(
                            "py-2 text-center text-sm font-bold",
                            i === 0 ? "text-red-500" : (i === 6 ? "text-blue-600" : "text-gray-700")
                        )}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="overflow-y-auto sm:flex-1 grid grid-cols-7 auto-rows-auto sm:auto-rows-fr">
                    {/* Blanks for previous month */}
                    {blanks.map((_, i) => (
                        <div key={`blank-${i}`} className="border-b border-r border-gray-100 bg-gray-50/30" />
                    ))}

                    {/* Actual Days */}
                    {daysInMonth.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isTodayDate = isToday(day);
                        const isSelected = selectedDate === dateStr;
                        const dayStats = statsByDate[dateStr];

                        return (
                            <div
                                key={dateStr}
                                onClick={() => handleDateClick(dateStr)}
                                className={cn(
                                    "relative border-b border-r border-gray-100 p-1 hover:bg-blue-50 cursor-pointer sm:min-h-[100px] transition-colors flex flex-col",
                                    isTodayDate && "bg-red-50 ring-1 ring-inset ring-red-400",
                                    isSelected && "bg-blue-100 ring-2 ring-inset ring-blue-500"
                                )}
                            >
                                {/* Date Number */}
                                <span className={cn(
                                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ml-auto mb-1", // mb-1 plus gap in container provides spacing
                                    isTodayDate ? "bg-blue-600 text-white shadow-sm" : "text-gray-700"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {/* Bars Container - Pushed to top but below date due to normal flow + spacing */}
                                <div className="flex flex-col gap-0.5 w-full mt-1">
                                    {dayStats && DISPLAY_ORDER.map(group => {
                                        const count = dayStats.optionStats[group];
                                        if (!count) return null;

                                        const { color, percent } = getReservationStatus(group, count);

                                        return (
                                            <div
                                                key={group}
                                                // Outer Container: "Slot"
                                                className="relative w-full h-9 sm:h-6 rounded-md bg-gray-200 shadow-inner border border-gray-300 overflow-hidden"
                                            >
                                                {/* Inner Fill: 3D Bar */}
                                                <div
                                                    className={cn(
                                                        "h-full absolute left-0 top-0 transition-all duration-300 ease-out",
                                                        "bg-gradient-to-b shadow-md border-t border-b-2 border-r",
                                                        color
                                                    )}
                                                    style={{ width: `${percent}%` }}
                                                />

                                                {/* Text Overlay (White Text with Premium Shadow) */}
                                                <div className="relative z-10 w-full h-full flex flex-col sm:flex-row items-center justify-center sm:justify-between px-2 text-[10px] sm:text-xs font-bold leading-tight sm:leading-none text-white select-none">
                                                    <span className="hidden sm:inline" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5)' }}>
                                                        {group} : {count}명
                                                    </span>
                                                    {/* Mobile View: Stacked */}
                                                    <div className="sm:hidden flex flex-col items-center justify-center w-full h-full leading-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5)' }}>
                                                        <span className="mb-0.5">
                                                            {group === '1부' ? '1부:' :
                                                                group === '2부' ? '2부:' :
                                                                    group === '3부' ? '3부:' :
                                                                        group === '패러 및 제트' ? '패+제:' :
                                                                            group === '패러' ? '패러:' :
                                                                                group === '제트' ? '제트:' :
                                                                                    group === '거북이' ? '거북:' :
                                                                                        '기타:'}
                                                        </span>
                                                        <span>{count}명</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            <div className="shrink-0 flex gap-4 text-sm font-medium text-gray-500 px-2 justify-end flex-wrap">
                <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gradient-to-b from-yellow-400 to-yellow-600 border border-yellow-300 shadow-sm"></span>1~9명</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gradient-to-b from-emerald-400 to-emerald-600 border border-emerald-300 shadow-sm"></span>10명~</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gradient-to-b from-blue-500 to-blue-700 border border-blue-400 shadow-sm"></span>마감</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gradient-to-b from-red-500 to-red-700 border border-red-400 shadow-sm"></span>초과</div>
                <div className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gradient-to-b from-pink-400 to-pink-600 border border-pink-300 shadow-sm"></span>기타</div>
            </div>
        </div>
    );
}
