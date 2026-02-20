"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, XCircle, Loader2, Anchor, LogIn } from "lucide-react";

// ---- HST Time Utils ----
function getHSTNow() {
    const now = new Date();
    const hstOffset = -10 * 60;
    const utcMinutes = now.getTime() / 60000 + now.getTimezoneOffset();
    return new Date((utcMinutes + hstOffset) * 60000);
}

function getHSTDateStr(hstDate: Date) {
    const y = hstDate.getFullYear();
    const m = String(hstDate.getMonth() + 1).padStart(2, "0");
    const d = String(hstDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getAvailableOptions(hstDate: Date): string[] {
    const totalMin = hstDate.getHours() * 60 + hstDate.getMinutes();
    const available: string[] = [];
    if (totalMin >= 7 * 60 + 30 && totalMin <= 10 * 60 + 59) available.push("1부");
    if (totalMin >= 10 * 60 + 45 && totalMin <= 13 * 60 + 59) available.push("2부");
    if (totalMin >= 14 * 60 && totalMin <= 19 * 60) available.push("3부");
    return available;
}

const SESSION_LABEL: Record<string, string> = {
    "1부": "1st Charter",
    "2부": "2nd Charter",
    "3부": "3rd Charter",
};
const SESSION_TIME: Record<string, string> = {
    "1부": "7:30 – 10:59 AM",
    "2부": "10:45 AM – 1:59 PM",
    "3부": "2:00 – 7:00 PM",
};
const SESSION_STYLE: Record<string, string> = {
    "1부": "bg-sky-500 hover:bg-sky-600",
    "2부": "bg-violet-500 hover:bg-violet-600",
    "3부": "bg-amber-500 hover:bg-amber-600",
};

type Member = { id: string; name: string; pin: string | null; role: "crew" | "captain" };
type Schedule = { option: string };
type AttendanceRecord = { option: string };

function CheckinContent() {
    const searchParams = useSearchParams();
    const urlPin = searchParams?.get("pin") || "";

    const [pin, setPin] = useState(urlPin);
    const [step, setStep] = useState<"pin" | "checkin" | "done">(urlPin ? "checkin" : "pin");
    const [member, setMember] = useState<Member | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [attended, setAttended] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successOpt, setSuccessOpt] = useState("");

    const hstNow = getHSTNow();
    const todayStr = getHSTDateStr(hstNow);
    const availableOptions = getAvailableOptions(hstNow);

    useEffect(() => {
        if (urlPin) loginWithPin(urlPin);
    }, []);

    const loginWithPin = async (inputPin: string) => {
        if (!inputPin.trim()) return;
        setLoading(true);
        setError("");
        try {
            // crew_members 먼저 조회
            const { data: crewData } = await supabase
                .from("crew_members")
                .select("id, name, pin")
                .eq("pin", inputPin.trim())
                .single();

            if (crewData) {
                const found: Member = { ...crewData, role: "crew" };
                setMember(found);
                const [schedRes, attRes] = await Promise.all([
                    supabase.from("crew_schedules").select("option").eq("crew_id", found.id).eq("date", todayStr),
                    supabase.from("crew_attendance").select("option").eq("crew_id", found.id).eq("date", todayStr),
                ]);
                setSchedules(schedRes.data || []);
                setAttended(attRes.data || []);
                setStep("checkin");
                return;
            }

            // captains 조회
            const { data: captainData } = await supabase
                .from("captains")
                .select("id, name, pin")
                .eq("pin", inputPin.trim())
                .single();

            if (captainData) {
                const found: Member = { ...captainData, role: "captain" };
                setMember(found);
                const [schedRes, attRes] = await Promise.all([
                    supabase.from("shift_captains").select("option").eq("captain_id", found.id).eq("date", todayStr),
                    supabase.from("captain_attendance").select("option").eq("captain_id", found.id).eq("date", todayStr),
                ]);
                setSchedules(schedRes.data || []);
                setAttended(attRes.data || []);
                setStep("checkin");
                return;
            }

            setError("Invalid PIN. Please check and try again.");
            setStep("pin");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckin = async (option: string) => {
        if (!member) return;
        setLoading(true);
        setError("");
        try {
            const table = member.role === "captain" ? "captain_attendance" : "crew_attendance";
            const idField = member.role === "captain" ? "captain_id" : "crew_id";
            const { error } = await supabase.from(table).insert({
                [idField]: member.id,
                date: todayStr,
                option,
            });

            if (error) {
                if (error.code === "23505") {
                    setError(`You already checked in for ${SESSION_LABEL[option]} today.`);
                } else {
                    setError(`Error: ${error.message}`);
                }
                return;
            }
            setAttended(prev => [...prev, { option }]);
            setSuccessOpt(option);
            setStep("done");
        } finally {
            setLoading(false);
        }
    };

    const isScheduled = (opt: string) => schedules.some(s => s.option === opt);
    const isAttended = (opt: string) => attended.some(a => a.option === opt);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-green-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
                        <Anchor className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">OCEANSTAR</h1>
                    <p className="text-green-300 text-sm mt-1">Crew Attendance Check-In</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-6">

                    {/* STEP 1: PIN */}
                    {step === "pin" && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 text-center">Enter Your PIN</h2>
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <XCircle className="w-4 h-4 shrink-0" />{error}
                                </div>
                            )}
                            <input
                                type="tel"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && loginWithPin(pin)}
                                placeholder="PIN"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-xl tracking-widest font-bold focus:border-green-500 focus:outline-none"
                                autoFocus
                            />
                            <button
                                onClick={() => loginWithPin(pin)}
                                disabled={loading || !pin.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 disabled:opacity-50 transition"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                                Sign In
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Session */}
                    {step === "checkin" && member && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Welcome,</p>
                                <p className="text-2xl font-extrabold text-gray-900">{member.name}</p>
                                <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${member.role === "captain" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>
                                    {member.role === "captain" ? "Captain" : "Crew"}
                                </span>
                                <p className="text-xs text-gray-400 mt-1">Today · {todayStr} (HST)</p>
                            </div>

                            {availableOptions.length === 0 ? (
                                <div className="text-center py-6 text-gray-400">
                                    <p className="text-sm font-semibold">No check-in available right now.</p>
                                    <div className="mt-3 text-xs space-y-1">
                                        <p>1st Charter · 7:30 – 10:59 AM</p>
                                        <p>2nd Charter · 10:45 AM – 1:59 PM</p>
                                        <p>3rd Charter · 2:00 – 7:00 PM</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-center text-gray-500">Select your charter</p>
                                    {(["1부", "2부", "3부"] as const).map(opt => {
                                        const avail = availableOptions.includes(opt);
                                        const alreadyDone = isAttended(opt);
                                        const scheduled = isScheduled(opt);
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleCheckin(opt)}
                                                disabled={!avail || alreadyDone || loading}
                                                className={`w-full py-4 rounded-xl font-bold text-base transition flex items-center justify-between px-5 ${alreadyDone
                                                        ? "bg-green-100 text-green-700 border-2 border-green-400 cursor-default"
                                                        : avail
                                                            ? `${SESSION_STYLE[opt]} text-white`
                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    }`}
                                            >
                                                <span>{SESSION_LABEL[opt]}</span>
                                                <span className="text-sm font-normal opacity-90">
                                                    {alreadyDone ? "✅ Checked In" : !scheduled ? "Not Scheduled" : avail ? SESSION_TIME[opt] : "Not Available"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <XCircle className="w-4 h-4 shrink-0" />{error}
                                </div>
                            )}
                            <button
                                onClick={() => { setStep("pin"); setMember(null); setPin(""); setError(""); }}
                                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
                            >
                                Switch account
                            </button>
                        </div>
                    )}

                    {/* STEP 3: Done */}
                    {step === "done" && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xl font-extrabold text-gray-900">Checked In!</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {member?.name} · {SESSION_LABEL[successOpt]} · {todayStr}
                                </p>
                            </div>
                            <button
                                onClick={() => setStep("checkin")}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-white/40 text-xs mt-6">
                    © OCEANSTAR · Hawaii Standard Time (HST)
                </p>
            </div>
        </div>
    );
}

export default function CheckinPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        }>
            <CheckinContent />
        </Suspense>
    );
}
