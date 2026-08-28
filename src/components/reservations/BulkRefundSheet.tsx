"use client";

import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Reservation } from "@/types/reservation";
import { cancelTiming } from "@/lib/cancelTiming";
import {
    isUsd, symbolFor, toInputValue,
    percentAmount, defaultAmount,
    REFUND_REASONS, DEFAULT_REFUND_REASON, isPresetReason,
} from "@/lib/refundAmounts";

type Outcome = { status: "ok" | "fail"; message: string };

interface Props {
    reservations: Reservation[];
    onClose: () => void;
    /** 환불에 성공한 예약. 그리드 상태를 맞추는 데 쓴다. 건별로 호출된다. */
    onRefunded: (updates: { orderId: string; refundedAmount: number; fullyRefunded: boolean }[]) => void;
}

export default function BulkRefundSheet({ reservations, onClose, onRefunded }: Props) {
    // 콤보 예약은 1결제 2행이다. 결제 단위로 합치지 않으면 이중 환불이 난다.
    const { targets, skipped } = useMemo(() => {
        const seen = new Set<string>();
        const targets: Reservation[] = [];
        const skipped: { r: Reservation; why: string }[] = [];

        for (const r of reservations) {
            if (!r.id || r.isNew || r.id.startsWith("temp-")) {
                skipped.push({ r, why: "저장되지 않은 예약" });
            } else if (!r.payment_intent_id) {
                skipped.push({ r, why: "Stripe 결제 아님 (수기 환불 필요)" });
            } else if (seen.has(r.payment_intent_id)) {
                // 콤보의 두 번째 행. 첫 행이 결제 전체를 대표한다.
                continue;
            } else if (defaultAmount(r) <= 0) {
                skipped.push({ r, why: "이미 전액 환불됨" });
            } else {
                seen.add(r.payment_intent_id);
                targets.push(r);
            }
        }
        return { targets, skipped };
    }, [reservations]);

    const [amounts, setAmounts] = useState<Record<string, string>>(() =>
        Object.fromEntries(targets.map((r) => [r.id, toInputValue(defaultAmount(r), r.currency)])),
    );
    const [reasons, setReasons] = useState<Record<string, string>>(() =>
        Object.fromEntries(targets.map((r) => [r.id, DEFAULT_REFUND_REASON as string])),
    );

    /** 목록에서 고르면 그 문구로, "직접입력"이면 비워서 타이핑하게 한다. */
    const setReasonPreset = (r: Reservation, choice: string) => {
        setReasons((prev) => {
            if (choice === "custom") {
                // 이미 직접 입력한 내용이 있으면 지우지 않는다.
                return isPresetReason(prev[r.id] ?? "") ? { ...prev, [r.id]: "" } : prev;
            }
            return { ...prev, [r.id]: choice };
        });
    };
    const [results, setResults] = useState<Record<string, Outcome>>({});
    const [runningId, setRunningId] = useState<string | null>(null);

    // 재시도해도 같은 값을 보내야 이중 환불이 안 난다. 시트를 열 때 한 번만 만든다.
    const requestIds = useRef<Record<string, string>>(
        Object.fromEntries(targets.map((r) => [r.id, crypto.randomUUID()])),
    );

    const pending = targets.filter((r) => results[r.id]?.status !== "ok");

    /** 그 행 하나에만 비율을 적용한다. 건마다 사정이 다르다. */
    const setPreset = (r: Reservation, preset: string) => {
        if (preset === "custom") return;
        const value = preset === "policy" ? defaultAmount(r) : percentAmount(r, Number(preset));
        setAmounts((prev) => ({ ...prev, [r.id]: toInputValue(value, r.currency) }));
    };

    /**
     * 지금 입력된 금액이 어느 비율에 해당하는지 되짚는다.
     * 별도 state 를 두지 않아 직접 입력과 어긋날 일이 없다.
     */
    const presetOf = (r: Reservation, raw: string): string => {
        const v = Number(raw);
        if (!Number.isFinite(v)) return "custom";
        for (const p of [100, 50, 30]) {
            if (v === percentAmount(r, p)) return String(p);
        }
        if (v === defaultAmount(r)) return "policy";
        return "custom";
    };

    /** 한 건만 환불한다. */
    const refundOne = async (r: Reservation) => {
        const amount = Number(amounts[r.id]);
        if (!Number.isFinite(amount) || amount <= 0) {
            setResults((prev) => ({ ...prev, [r.id]: { status: "fail", message: "금액이 올바르지 않습니다" } }));
            return;
        }

        setRunningId(r.id);
        try {
            const res = await fetch("/api/admin/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: r.order_id,
                    amount,
                    reason: reasons[r.id],
                    requestId: requestIds.current[r.id],
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "HTTP " + res.status);

            const label = json.mode === "canceled" ? "결제 취소 완료 (수수료 없음)"
                : json.mode === "partially_captured" ? "부분 확정 완료"
                : "환불 완료";
            setResults((prev) => ({ ...prev, [r.id]: { status: "ok", message: label } }));
            onRefunded([{
                orderId: r.order_id!,
                refundedAmount: Number(json.refunded_amount) || 0,
                fullyRefunded: Number(json.remaining) <= 0,
            }]);
        } catch (err) {
            setResults((prev) => ({
                ...prev,
                [r.id]: { status: "fail", message: err instanceof Error ? err.message : "알 수 없는 오류" },
            }));
        } finally {
            setRunningId(null);
        }
    };

    const totalsByCurrency = useMemo(() => {
        const acc: Record<string, number> = {};
        for (const r of pending) {
            const v = Number(amounts[r.id] || 0);
            if (!Number.isFinite(v)) continue;
            const key = r.currency || "USD";
            acc[key] = (acc[key] || 0) + v;
        }
        return acc;
    }, [pending, amounts]);

    const busy = runningId !== null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        환불 처리
                    </h3>
                    {pending.length > 0 && (
                        <span className="text-xs text-gray-600">
                            미처리 {pending.length}건
                            {Object.entries(totalsByCurrency).map(([cur, sum]) => (
                                <span key={cur} className="ml-2 font-bold text-gray-700">
                                    {symbolFor(cur)}{isUsd(cur) ? sum.toFixed(2) : Math.round(sum).toLocaleString()}
                                </span>
                            ))}
                        </span>
                    )}
                </div>

                <div className="p-5 space-y-3 overflow-y-auto">
                    {targets.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">환불 가능한 예약이 없습니다.</p>
                    ) : (
                        <>
                            <p className="text-xs text-gray-500">
                                건마다 따로 처리합니다. 기상 악화·모객부족이면 규정과 무관하게 전액을 고르세요.
                                <b className="text-green-700"> 결제확정X</b> 는 아직 돈이 빠져나가지 않은 상태라 수수료 없이 취소됩니다.
                            </p>

                            {targets.map((r) => {
                                const timing = cancelTiming(r.created_at, r.cancel_requested_at);
                                const outcome = results[r.id];
                                const done = outcome?.status === "ok";
                                const thisRunning = runningId === r.id;
                                const uncaptured = !r.captured_at;

                                return (
                                    <div
                                        key={r.id}
                                        className={"border rounded-lg p-4 space-y-2.5 " + (
                                            done ? "bg-green-50 border-green-200"
                                                : outcome?.status === "fail" ? "bg-red-50 border-red-300"
                                                : "border-gray-200"
                                        )}
                                    >
                                        {/* 누구를, 언제 취소 요청했는지 */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="text-sm space-y-0.5">
                                                {([
                                                    ["이름", r.name],
                                                    ["날짜", r.tour_date],
                                                    ["옵션", r.option],
                                                    ["인원", r.pax],
                                                ] as [string, string][]).map(([label, value]) => (
                                                    <div key={label} className="flex">
                                                        <span className="w-9 shrink-0 text-gray-400">{label}</span>
                                                        <span className="text-gray-900">: {value || "—"}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-right shrink-0 space-y-0.5">
                                                <p className="text-xs text-gray-400 font-mono">{r.order_id}</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {symbolFor(r.currency)}{Number(r.total_price ?? 0).toLocaleString()}
                                                </p>
                                                {uncaptured && (
                                                    <p className="text-xs text-green-700 font-bold">결제확정X</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className={"text-xs " + (timing.withinGracePeriod ? "text-orange-600 font-bold" : "text-gray-400")}>
                                            {timing.label}
                                            {timing.withinGracePeriod && "  ⚠ 예약 후 24시간 이내"}
                                        </p>

                                        {/* 비율 + 금액 */}
                                        <div className="flex gap-2">
                                            <select
                                                value={presetOf(r, amounts[r.id] ?? "")}
                                                disabled={busy || done}
                                                onChange={(e) => setPreset(r, e.target.value)}
                                                className="w-32 border border-gray-300 rounded px-2 py-2 text-sm bg-white disabled:bg-gray-100"
                                            >
                                                <option value="100">전액 100%</option>
                                                <option value="50">50%</option>
                                                <option value="30">30%</option>
                                                <option value="policy">규정대로</option>
                                                <option value="custom">직접입력</option>
                                            </select>
                                            <div className="relative flex-1">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">
                                                    {symbolFor(r.currency)}
                                                </span>
                                                <input
                                                    type="number"
                                                    step={isUsd(r.currency) ? "0.01" : "1"}
                                                    min="0"
                                                    disabled={busy || done}
                                                    value={amounts[r.id] ?? ""}
                                                    onChange={(e) => setAmounts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded pl-6 pr-2 py-2 text-sm text-right disabled:bg-gray-100"
                                                />
                                            </div>
                                        </div>

                                        {/* 사유 / 메모 */}
                                        <select
                                            value={isPresetReason(reasons[r.id] ?? "") ? reasons[r.id] : "custom"}
                                            disabled={busy || done}
                                            onChange={(e) => setReasonPreset(r, e.target.value)}
                                            className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white disabled:bg-gray-100"
                                        >
                                            {REFUND_REASONS.map((v) => <option key={v} value={v}>{v}</option>)}
                                            <option value="custom">직접입력</option>
                                        </select>
                                        {!isPresetReason(reasons[r.id] ?? "") && (
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="사유를 입력하세요"
                                                disabled={busy || done}
                                                value={reasons[r.id] ?? ""}
                                                onChange={(e) => setReasons((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
                                            />
                                        )}

                                        {uncaptured && Number(amounts[r.id]) < Number(r.total_price ?? 0) && !done && (
                                            <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
                                                아직 결제가 확정되지 않은 건입니다. 일부만 환불하면 <b>나머지 금액이 즉시 결제 확정</b>되고,
                                                확정은 한 번뿐이라 <b>되돌릴 수 없습니다.</b>
                                            </p>
                                        )}

                                        {/* 결과 + 실행 */}
                                        <div className="flex items-center gap-2">
                                            {outcome && (
                                                <span className={"text-xs font-medium " + (done ? "text-green-700" : "text-red-700")}>
                                                    {done ? "✓ " : "✗ "}{outcome.message}
                                                </span>
                                            )}
                                            {!done && (
                                                <button
                                                    type="button"
                                                    onClick={() => refundOne(r)}
                                                    disabled={busy || !(reasons[r.id] ?? "").trim()}
                                                    title={!(reasons[r.id] ?? "").trim() ? "사유를 입력하세요" : undefined}
                                                    className="ml-auto px-4 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {thisRunning
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <RotateCcw className="w-4 h-4" />}
                                                    {outcome?.status === "fail" ? "다시 시도"
                                                        : uncaptured ? "결제 취소" : "환불"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <datalist id="refund-reasons">
                                {REFUND_REASONS.map((v) => <option key={v} value={v} />)}
                            </datalist>
                        </>
                    )}

                    {skipped.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-gray-100">
                            <p className="text-sm font-bold text-gray-500">건너뜀 {skipped.length}건</p>
                            {skipped.map(({ r, why }, i) => (
                                <p key={(r.id || "new") + "-" + i} className="text-xs text-gray-400">
                                    {r.name} — {why}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-2 border-t border-gray-100">
                    {targets.length > 0 && pending.length === 0 && (
                        <span className="mr-auto text-sm text-green-700 font-medium">모두 처리되었습니다.</span>
                    )}
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
