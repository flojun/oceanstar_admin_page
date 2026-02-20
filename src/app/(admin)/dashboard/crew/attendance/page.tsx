"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { format, startOfWeek, addDays, subWeeks, addWeeks } from "date-fns";
import { supabase } from "@/lib/supabase";
import {
    CalendarDays, ClipboardCheck, ChevronLeft, ChevronRight,
    QrCode, X, Loader2, AlertCircle, Download
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ---- Types ----
type CrewMember = { id: string; name: string; sort_order: number; pin: string | null };
type Captain = { id: string; name: string; pin: string | null };
type CrewSchedule = { crew_id: string; date: string; option: string };
type ShiftCaptain = { captain_id: string; date: string; option: string };
type CrewAttendance = { crew_id: string; date: string; option: string };
type CaptainAttendance = { captain_id: string; date: string; option: string };

const OPTIONS = ["1부", "2부", "3부"];

// ---- Attendance Table (reusable) ----
function AttendanceTable({
    members,
    weekDates,
    hasSchedule,
    hasAttendance,
    weeklyCount,
    getMismatch,
    label,
}: {
    members: { id: string; name: string }[];
    weekDates: Date[];
    hasSchedule: (id: string, date: string, opt: string) => boolean;
    hasAttendance: (id: string, date: string, opt: string) => boolean;
    weeklyCount: (id: string) => number;
    getMismatch: (id: string) => number;
    label: string;
}) {
    return (
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-2 pb-2">
                <h2 className="font-bold text-gray-700">{label}</h2>
                <div className="flex gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-200 inline-block" /> 출석</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> 결근</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-200 inline-block" /> 미배정출석</span>
                </div>
            </div>
            <div className="w-full overflow-x-auto border rounded shadow-inner pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full border-collapse text-xs table-fixed min-w-[1000px] bg-white">
                    <thead className="bg-green-800 text-white">
                        <tr>
                            <th rowSpan={2} className="border border-green-700 w-20 p-1 bg-gray-100 text-gray-800 sticky left-0 z-30 shadow-md">
                                <div className="text-[10px] text-gray-500">{format(weekDates[0], "M/d")}–{format(weekDates[6], "M/d")}</div>
                                <div className="font-bold text-xs">이름</div>
                            </th>
                            <th rowSpan={2} className="border border-green-700 w-12 p-1 bg-gray-100 text-gray-600 text-[10px] font-semibold">주간{"\n"}출석</th>
                            {weekDates.map(date => (
                                <th
                                    key={date.toString()}
                                    colSpan={3}
                                    className={`border p-1 font-bold text-center ${format(date, 'E') === 'Sun' ? 'bg-red-600 border-red-500' : 'bg-green-800 border-green-600'}`}
                                >
                                    {format(date, "EEE").toUpperCase()}
                                </th>
                            ))}
                        </tr>
                        <tr className="bg-gray-100 text-gray-800">
                            {weekDates.map(date =>
                                OPTIONS.map(opt => (
                                    <th key={`${date}-${opt}`} className="border border-gray-300 p-0.5 text-center w-10 font-semibold bg-green-50">
                                        {opt.replace('부', '')}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(m => {
                            const count = weeklyCount(m.id);
                            const mismatchCount = getMismatch(m.id);
                            return (
                                <tr key={m.id} className="hover:bg-gray-50 h-8">
                                    <td className="p-1 border font-bold text-gray-800 bg-white sticky left-0 z-20 text-center shadow-md truncate">
                                        {m.name}{mismatchCount > 0 && <span className="text-red-500 ml-0.5">⚠</span>}
                                    </td>
                                    <td className="border p-0 text-center font-bold text-green-700 text-[11px]">{count}회</td>
                                    {weekDates.map(d => {
                                        const dateStr = format(d, "yyyy-MM-dd");
                                        return OPTIONS.map(opt => {
                                            const sched = hasSchedule(m.id, dateStr, opt);
                                            const att = hasAttendance(m.id, dateStr, opt);
                                            let cellClass = "bg-white", text = "";
                                            if (sched && att) { cellClass = "bg-green-100 text-green-800"; text = "✓"; }
                                            else if (sched && !att) { cellClass = "bg-red-100 text-red-700"; text = "✕"; }
                                            else if (!sched && att) { cellClass = "bg-yellow-100 text-yellow-700"; text = "★"; }
                                            return (
                                                <td key={`${m.id}-${dateStr}-${opt}`} className={`border p-0 text-center ${cellClass}`}>
                                                    <div className="w-full flex items-center justify-center font-bold text-[11px] select-none" style={{ height: '2rem' }}>{text}</div>
                                                </td>
                                            );
                                        });
                                    })}
                                </tr>
                            );
                        })}
                        {members.length === 0 && (
                            <tr><td colSpan={23} className="p-4 text-center text-gray-400">데이터 없음</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ---- Summary Cards ----
function SummaryCards({
    members,
    weeklyCount,
    getMismatch,
}: {
    members: { id: string; name: string }[];
    weeklyCount: (id: string) => number;
    getMismatch: (id: string) => number;
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
            {members.map(m => {
                const count = weeklyCount(m.id);
                const mismatch = getMismatch(m.id);
                return (
                    <div
                        key={m.id}
                        className={`rounded-xl border p-3 flex flex-col items-center text-center relative ${mismatch > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}
                    >
                        {mismatch > 0 && (
                            <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-red-600 bg-red-100 px-1 rounded">⚠ {mismatch}</span>
                        )}
                        <p className="font-bold text-gray-800 text-sm">{m.name}</p>
                        <p className="text-3xl font-extrabold mt-1 text-green-600">{count}</p>
                        <p className="text-xs text-gray-400">회 출석</p>
                    </div>
                );
            })}
        </div>
    );
}

// ---- Main Page ----
export default function CrewAttendancePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [crew, setCrew] = useState<CrewMember[]>([]);
    const [captains, setCaptains] = useState<Captain[]>([]);
    const [crewSchedules, setCrewSchedules] = useState<CrewSchedule[]>([]);
    const [shiftCaptains, setShiftCaptains] = useState<ShiftCaptain[]>([]);
    const [crewAtt, setCrewAtt] = useState<CrewAttendance[]>([]);
    const [captainAtt, setCaptainAtt] = useState<CaptainAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQr, setShowQr] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");
    const qrRef = useRef<HTMLDivElement>(null);

    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const startStr = format(weekDates[0], "yyyy-MM-dd");
    const endStr = format(weekDates[6], "yyyy-MM-dd");
    const checkinUrl = `${baseUrl}/checkin`;

    useEffect(() => { setBaseUrl(window.location.origin); }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [crewRes, captainRes, crewSchedRes, shiftCapRes, crewAttRes, capAttRes] = await Promise.all([
                supabase.from("crew_members").select("*").order("sort_order"),
                supabase.from("captains").select("*").order("created_at"),
                supabase.from("crew_schedules").select("crew_id, date, option").gte("date", startStr).lte("date", endStr),
                supabase.from("shift_captains").select("captain_id, date, option").gte("date", startStr).lte("date", endStr),
                supabase.from("crew_attendance").select("crew_id, date, option").gte("date", startStr).lte("date", endStr),
                supabase.from("captain_attendance").select("captain_id, date, option").gte("date", startStr).lte("date", endStr),
            ]);
            setCrew((crewRes.data || []) as CrewMember[]);
            setCaptains((captainRes.data || []) as Captain[]);
            setCrewSchedules(crewSchedRes.data || []);
            setShiftCaptains(shiftCapRes.data || []);
            setCrewAtt(crewAttRes.data || []);
            setCaptainAtt(capAttRes.data || []);
        } finally {
            setLoading(false);
        }
    }, [startStr, endStr]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ---- Crew Helpers ----
    const crewHasSched = (id: string, d: string, opt: string) => crewSchedules.some(s => s.crew_id === id && s.date === d && s.option === opt);
    const crewHasAtt = (id: string, d: string, opt: string) => crewAtt.some(a => a.crew_id === id && a.date === d && a.option === opt);
    const crewCount = (id: string) => crewAtt.filter(a => a.crew_id === id).length;
    const crewMismatch = (id: string) => {
        let n = 0;
        weekDates.forEach(d => {
            const ds = format(d, "yyyy-MM-dd");
            OPTIONS.forEach(opt => {
                const s = crewHasSched(id, ds, opt), a = crewHasAtt(id, ds, opt);
                if ((s && !a) || (!s && a)) n++;
            });
        });
        return n;
    };

    // ---- Captain Helpers ----
    const capHasSched = (id: string, d: string, opt: string) => shiftCaptains.some(s => s.captain_id === id && s.date === d && s.option === opt);
    const capHasAtt = (id: string, d: string, opt: string) => captainAtt.some(a => a.captain_id === id && a.date === d && a.option === opt);
    const capCount = (id: string) => captainAtt.filter(a => a.captain_id === id).length;
    const capMismatch = (id: string) => {
        let n = 0;
        weekDates.forEach(d => {
            const ds = format(d, "yyyy-MM-dd");
            OPTIONS.forEach(opt => {
                const s = capHasSched(id, ds, opt), a = capHasAtt(id, ds, opt);
                if ((s && !a) || (!s && a)) n++;
            });
        });
        return n;
    };

    const totalMismatches =
        crew.reduce((acc, c) => acc + crewMismatch(c.id), 0) +
        captains.reduce((acc, c) => acc + capMismatch(c.id), 0);

    // ---- PIN 저장 ----
    const savePinCrew = async (id: string, pin: string) => { await supabase.from("crew_members").update({ pin }).eq("id", id); setCrew(prev => prev.map(c => c.id === id ? { ...c, pin } : c)); };
    const savePinCaptain = async (id: string, pin: string) => { await supabase.from("captains").update({ pin }).eq("id", id); setCaptains(prev => prev.map(c => c.id === id ? { ...c, pin } : c)); };

    // ---- QR 다운로드 ----
    const handleDownloadQr = () => {
        const svg = qrRef.current?.querySelector("svg");
        if (!svg) return;
        const svgStr = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const SIZE = 400;
        canvas.width = SIZE; canvas.height = SIZE + 60;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, SIZE, SIZE);
            ctx.fillStyle = "#1f2937"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center";
            ctx.fillText("OCEANSTAR 출석 체크", SIZE / 2, SIZE + 30);
            ctx.font = "14px sans-serif"; ctx.fillStyle = "#6b7280";
            ctx.fillText("QR 스캔 후 PIN 입력", SIZE / 2, SIZE + 52);
            const link = document.createElement("a");
            link.download = "oceanstar-checkin-qr.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
    };

    return (
        <div className="p-2 md:p-6 space-y-4 max-w-[1800px] mx-auto w-full">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1.5 rounded-xl">
                <Link href="/dashboard/crew" className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-white/60">
                    <CalendarDays className="w-4 h-4" /> 스케쥴 관리
                </Link>
                <Link href="/dashboard/crew/attendance" className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 bg-green-700 text-white shadow-md">
                    <ClipboardCheck className="w-4 h-4" /> 출석 현황
                </Link>
            </div>

            {/* QR 카드 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="font-bold text-gray-800">📱 출석 체크 QR 코드</h2>
                    <p className="text-xs text-gray-500 mt-0.5">하나의 QR로 모든 크루·캡틴이 체크인 — 스캔 후 각자 PIN 입력</p>
                    <p className="text-xs text-blue-600 font-mono mt-1 break-all">{checkinUrl || "/checkin"}</p>
                </div>
                <button onClick={() => setShowQr(true)} className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition">
                    <QrCode className="w-4 h-4" /> QR 보기
                </button>
            </div>

            {/* Week Nav */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="font-bold text-base whitespace-nowrap">{format(weekDates[0], "yyyy.MM.dd")} ~ {format(weekDates[6], "MM.dd")}</span>
                    <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5" /></button>
                </div>
                {totalMismatches > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700">
                        <AlertCircle className="w-4 h-4" /> 불일치 {totalMismatches}건
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : (
                <>
                    {/* ===== CAPTAIN 섹션 ===== */}
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-amber-50 flex items-center gap-2">
                            <span className="text-lg">⚓</span>
                            <h2 className="font-bold text-amber-800">캡틴 주간 근무 횟수</h2>
                        </div>
                        <SummaryCards members={captains} weeklyCount={capCount} getMismatch={capMismatch} />
                    </div>

                    <AttendanceTable
                        members={captains}
                        weekDates={weekDates}
                        hasSchedule={capHasSched}
                        hasAttendance={capHasAtt}
                        weeklyCount={capCount}
                        getMismatch={capMismatch}
                        label="⚓ 캡틴 스케쥴 vs 출석 비교"
                    />

                    {/* ===== CREW 섹션 ===== */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                            <span className="text-lg">🧑‍✈️</span>
                            <h2 className="font-bold text-gray-700">크루 주간 근무 횟수</h2>
                        </div>
                        <SummaryCards members={crew} weeklyCount={crewCount} getMismatch={crewMismatch} />
                    </div>

                    <AttendanceTable
                        members={crew}
                        weekDates={weekDates}
                        hasSchedule={crewHasSched}
                        hasAttendance={crewHasAtt}
                        weeklyCount={crewCount}
                        getMismatch={crewMismatch}
                        label="🧑‍✈️ 크루 스케쥴 vs 출석 비교"
                    />

                    {/* PIN 관리 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h2 className="font-bold text-gray-700">🔑 PIN 관리</h2>
                            <p className="text-xs text-gray-500 mt-1">공용 QR 스캔 후 이 PIN으로 로그인합니다.</p>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* 캡틴 PIN */}
                            <div>
                                <p className="text-xs font-bold text-amber-700 mb-2">⚓ 캡틴</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {captains.map(c => (
                                        <div key={c.id} className="flex flex-col gap-1">
                                            <p className="text-xs font-semibold text-gray-700">{c.name}</p>
                                            <input
                                                type="text"
                                                defaultValue={c.pin || ""}
                                                placeholder="PIN"
                                                className="w-full px-2 py-1.5 border rounded-lg text-sm text-center tracking-widest font-mono focus:border-amber-400 focus:outline-none"
                                                onBlur={(e) => { const v = e.target.value.trim(); if (v !== (c.pin || "")) savePinCaptain(c.id, v); }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* 크루 PIN */}
                            <div>
                                <p className="text-xs font-bold text-sky-700 mb-2">🧑‍✈️ 크루</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {crew.map(c => (
                                        <div key={c.id} className="flex flex-col gap-1">
                                            <p className="text-xs font-semibold text-gray-700">{c.name}</p>
                                            <input
                                                type="text"
                                                defaultValue={c.pin || ""}
                                                placeholder="PIN"
                                                className="w-full px-2 py-1.5 border rounded-lg text-sm text-center tracking-widest font-mono focus:border-sky-400 focus:outline-none"
                                                onBlur={(e) => { const v = e.target.value.trim(); if (v !== (c.pin || "")) savePinCrew(c.id, v); }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* QR 모달 */}
            {showQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowQr(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 max-w-xs w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between w-full items-center">
                            <h2 className="text-lg font-bold text-gray-800">출석 체크 QR</h2>
                            <button onClick={() => setShowQr(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div ref={qrRef} className="flex flex-col items-center gap-2">
                            <QRCodeSVG value={checkinUrl || "https://oceanstar.vercel.app/checkin"} size={220} level="M" includeMargin />
                            <p className="text-sm font-bold text-gray-800">OCEANSTAR 출석 체크</p>
                            <p className="text-xs text-gray-400">QR 스캔 후 각자 PIN 입력</p>
                        </div>
                        <button onClick={handleDownloadQr} className="w-full flex items-center justify-center gap-2 py-3 bg-green-700 text-white font-semibold rounded-xl hover:bg-green-800 transition">
                            <Download className="w-4 h-4" /> 이미지로 저장
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
