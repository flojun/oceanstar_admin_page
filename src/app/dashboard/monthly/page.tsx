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
// Returns color class
function getBarColor(group: string, count: number): string {
    // Traffic Light Logic ONLY for 1부, 2부, 3부
    if (['1부', '2부', '3부'].includes(group)) {
        if (count >= 46) return 'bg-red-500 text-white'; // 초과 -> Red
        if (count >= 44) return 'bg-green-600 text-white'; // 마감 -> Green (Darker)
        if (count >= 40) return 'bg-yellow-400 text-black'; // 주의 -> Yellow
        if (count <= 10) return 'bg-red-500 text-white'; // 미달 -> Red
        return 'bg-blue-500 text-white'; // Normal (11-39)
    }

    // All other options -> Brown (Other Options)
    return 'bg-[#8B4513] text-white';
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

                                        return (
                                            <div
                                                key={group}
                                                className={cn(
                                                    "text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-sm flex justify-between items-center w-full font-bold leading-tight shadow-sm",
                                                    getBarColor(group, count)
                                                )}
                                            >
                                                {/* Desktop: "1부 : 2명" | Mobile: "1부 : 2명" for 1부/2부/3부 */}
                                                <span className="hidden sm:inline">{group} : {count}명</span>
                                                <span className="sm:hidden">
                                                    {group === '1부' ? `1부 : ${count}명` :
                                                        group === '2부' ? `2부 : ${count}명` :
                                                            group === '3부' ? `3부 : ${count}명` :
                                                                group === '패러 및 제트' ? `패+제 : ${count}명` :
                                                                    group === '패러' ? `패러 : ${count}명` :
                                                                        group === '제트' ? `제트 : ${count}명` :
                                                                            group === '거북이' ? `거북이 : ${count}명` :
                                                                                `기타 : ${count}명`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="shrink-0 flex gap-4 text-sm font-medium text-gray-500 px-2 justify-end">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span>미달/초과(≤10 or ≥46)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span>정상(11~39)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full"></span>주의(≥40)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded-full"></span>마감 (≥44)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#8B4513] rounded-full"></span>기타옵션</div>
            </div>
        </div>
    );
}
