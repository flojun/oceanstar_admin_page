"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { cancelTiming } from "@/lib/cancelTiming";
import { remainingOf, symbolFor, isUsd } from "@/lib/refundAmounts";
import BulkRefundSheet from "@/components/reservations/BulkRefundSheet";

type Filter = "취소요청" | "예정" | "전체";

const FILTERS: { key: Filter; label: string; hint: string }[] = [
    { key: "취소요청", label: "취소 요청", hint: "손님이 취소를 요청한 건" },
    { key: "예정", label: "다가오는 투어", hint: "오늘 이후 투어 · 기상 악화 취소용" },
    { key: "전체", label: "전체", hint: "최근 예약 전부" },
];

export default function RefundView() {
    const [filter, setFilter] = useState<Filter>("취소요청");
    const [rows, setRows] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [sheetOpen, setSheetOpen] = useState(false);

    /** 조회만 한다. 로딩 표시는 부르는 쪽이 켠다(effect 안에서 동기 setState 를 피하려고). */
    const loadRows = async (f: Filter) => {
        let q = supabase.from("reservations").select("*");
        if (f === "취소요청") {
            q = q.eq("status", "취소요청").order("cancel_requested_at", { ascending: false, nullsFirst: false });
        } else if (f === "예정") {
            // 기상 악화·모객부족으로 그날 출항을 통째로 취소하는 경우를 위해
            // 투어 날짜순으로 본다.
            q = q.gte("tour_date", new Date().toISOString().slice(0, 10))
                .neq("status", "취소")
                .order("tour_date", { ascending: true });
        } else {
            q = q.order("created_at", { ascending: false });
        }

        const { data, error } = await q.limit(300);
        if (error) console.error("환불 대상 조회 실패:", error.message || error);
        setRows(data || []);
        setLoading(false);
    };

    // 최초 1회. loading 은 이미 true 로 시작하므로 여기서 켜지 않는다.
    useEffect(() => {
        // loadRows 는 await 이후에만 setState 한다. 연쇄 렌더가 생기지 않으므로
        // set-state-in-effect 는 여기서 오탐이다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadRows("취소요청");
    }, []);

    const reload = (f: Filter) => {
        setLoading(true);
        setSelected(new Set());
        loadRows(f);
    };

    const changeFilter = (f: Filter) => {
        setFilter(f);
        reload(f);
    };

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            (r.name || "").toLowerCase().includes(q) ||
            (r.order_id || "").toLowerCase().includes(q) ||
            (r.tour_date || "").includes(q) ||
            (r.contact || "").includes(q),
        );
    }, [rows, query]);

    const chosen = visible.filter(r => selected.has(r.id));

    const toggle = (id: string) => setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const toggleAll = () => setSelected(prev =>
        prev.size === visible.length ? new Set() : new Set(visible.map(r => r.id)),
    );

    // 환불된 뒤에는 목록을 다시 읽어 잔액과 상태를 맞춘다.
    const handleRefunded = () => { reload(filter); };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-800">취소 및 환불</h1>
                <p className="text-sm text-gray-500 mt-1">
                    환불할 예약을 고르고 <b>선택 건 환불</b>을 누르세요. 건마다 비율·금액·사유를 따로 정합니다.
                </p>
            </div>

            {/* 필터 */}
            <div className="flex flex-wrap items-center gap-2">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => changeFilter(f.key)}
                        title={f.hint}
                        className={
                            "px-3 py-1.5 text-sm font-medium rounded-md " +
                            (filter === f.key
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")
                        }
                    >
                        {f.label}
                    </button>
                ))}
                <div className="relative ml-auto">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="이름 · 예약번호 · 날짜 · 연락처"
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md w-64 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500">불러오는 중...</div>
            ) : visible.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    해당하는 예약이 없습니다.
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs">
                            <tr>
                                <th className="w-10 p-2">
                                    <input
                                        type="checkbox"
                                        className="rounded"
                                        checked={selected.size === visible.length && visible.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="p-2 text-left font-medium">이름</th>
                                <th className="p-2 text-left font-medium">날짜</th>
                                <th className="p-2 text-left font-medium">옵션</th>
                                <th className="p-2 text-left font-medium">인원</th>
                                <th className="p-2 text-left font-medium">취소요청</th>
                                <th className="p-2 text-right font-medium">결제</th>
                                <th className="p-2 text-right font-medium">환불가능</th>
                                <th className="p-2 text-left font-medium">상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map(r => {
                                const timing = cancelTiming(r.created_at, r.cancel_requested_at);
                                const remaining = remainingOf(r);
                                const noStripe = !r.payment_intent_id;
                                return (
                                    <tr
                                        key={r.id}
                                        onClick={() => toggle(r.id)}
                                        className={
                                            "border-t border-gray-100 cursor-pointer hover:bg-blue-50/50 " +
                                            (selected.has(r.id) ? "bg-blue-50" : "")
                                        }
                                    >
                                        <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={selected.has(r.id)}
                                                onChange={() => toggle(r.id)}
                                            />
                                        </td>
                                        <td className="p-2 font-bold text-gray-900">
                                            {r.name}
                                            <span className="ml-1.5 text-xs font-mono font-normal text-gray-400">{r.order_id}</span>
                                        </td>
                                        <td className="p-2 text-gray-600">{r.tour_date}</td>
                                        <td className="p-2 text-gray-600">{r.option}</td>
                                        <td className="p-2 text-gray-600">{r.pax}</td>
                                        <td className={"p-2 text-xs " + (timing.withinGracePeriod ? "text-orange-600 font-bold" : "text-gray-400")}>
                                            {timing.requestedAt
                                                ? `${timing.requestedAt} · 예약 ${timing.hoursAfterBooking}시간 후`
                                                : "—"}
                                            {timing.withinGracePeriod && " ⚠"}
                                        </td>
                                        <td className="p-2 text-right text-gray-600">
                                            {symbolFor(r.currency)}{Number(r.total_price ?? 0).toLocaleString()}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-gray-900">
                                            {symbolFor(r.currency)}
                                            {isUsd(r.currency) ? remaining.toFixed(2) : Math.round(remaining).toLocaleString()}
                                        </td>
                                        <td className="p-2 text-xs">
                                            {noStripe ? (
                                                <span className="text-gray-400">수기 환불</span>
                                            ) : remaining <= 0 ? (
                                                <span className="text-gray-400">환불 완료</span>
                                            ) : r.captured_at ? (
                                                <span className="text-gray-600">결제확정</span>
                                            ) : (
                                                <span className="text-green-700 font-bold">결제확정X</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 선택 툴바 */}
            {chosen.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-40">
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                        {chosen.length}개 선택됨
                    </span>
                    <div className="h-4 w-px bg-gray-300" />
                    <button
                        onClick={() => setSheetOpen(true)}
                        className="px-4 py-1.5 text-sm font-bold bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-1.5"
                    >
                        <RotateCcw className="w-4 h-4" />
                        선택 건 환불
                    </button>
                    <button onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>
            )}

            {sheetOpen && (
                <BulkRefundSheet
                    reservations={chosen}
                    onClose={() => { setSheetOpen(false); handleRefunded(); }}
                    onRefunded={handleRefunded}
                />
            )}
        </div>
    );
}
