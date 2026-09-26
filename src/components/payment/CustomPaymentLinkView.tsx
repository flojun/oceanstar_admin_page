"use client";

import React, { useState } from "react";
import { Link2, Copy, Check, Loader2, AlertTriangle } from "lucide-react";
import { grossUp, feeAmount, type Currency } from "@/lib/pricing";

interface Created {
    url: string;
    currency: Currency;
    base: number;
    fee: number;
    total: number;
    id: string;
}

const symbolFor = (c: Currency) => (c === "USD" ? "$" : "₩");
const money = (v: number, c: Currency) =>
    symbolFor(c) + (c === "USD" ? v.toFixed(2) : Math.round(v).toLocaleString());

export default function CustomPaymentLinkView() {
    const [currency, setCurrency] = useState<Currency>("USD");
    const [amount, setAmount] = useState("3200");
    const [description, setDescription] = useState("오션스타 프라이빗 차터");
    const [addFee, setAddFee] = useState(true);

    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<Created | null>(null);
    const [copied, setCopied] = useState(false);

    const base = Number(amount);
    const valid = Number.isFinite(base) && base > 0;
    // 미리보기는 화면에서 계산하고, 실제 금액은 서버가 같은 함수로 다시 계산한다.
    const previewTotal = valid ? (addFee ? grossUp(base, currency) : base) : 0;
    const previewFee = valid && addFee ? feeAmount(base, currency) : 0;

    const submit = async () => {
        if (!valid) { setError("금액을 확인하세요."); return; }
        if (!description.trim()) { setError("상품 설명을 입력하세요."); return; }

        setRunning(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/payment-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: base, currency, description, addFee }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "HTTP " + res.status);
            setCreated(json);
            setCopied(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류");
        } finally {
            setRunning(false);
        }
    };

    const copy = async () => {
        if (!created) return;
        await navigator.clipboard.writeText(created.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 sm:p-6 max-w-2xl space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-800">맞춤 결제 링크</h1>
                <p className="text-sm text-gray-500 mt-1">
                    요금표에 없는 금액을 받을 때 쓰세요. 프라이빗 별도 견적, 추가 인원, 특별 패키지 등.
                </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4" /> 일반 예약과 다른 점
                </p>
                <ul className="space-y-1 ml-1">
                    <li>· <b>예약이 자동으로 생기지 않습니다.</b> 결제 확인 후 예약관리에서 직접 넣으세요.</li>
                    <li>· <b>즉시 결제됩니다.</b> 승인만 걸어두는 방식이 아니라 바로 돈이 빠져나갑니다.</li>
                    <li>· <b>환불은 Stripe 대시보드에서</b> 하셔야 합니다. 환불 화면에는 안 뜹니다.</li>
                    <li>· 링크 주소를 아는 사람은 누구나 열 수 있습니다. <b>1회 결제되면 자동으로 닫힙니다.</b></li>
                </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
                    <input
                        type="text"
                        value={description}
                        disabled={running}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="손님 결제창에 표시됩니다"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="w-28">
                        <label className="block text-sm font-medium text-gray-700 mb-1">통화</label>
                        <select
                            value={currency}
                            disabled={running}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white disabled:bg-gray-100"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="KRW">KRW (₩)</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">금액 (수수료 전)</label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">
                                {symbolFor(currency)}
                            </span>
                            <input
                                type="number"
                                step={currency === "USD" ? "0.01" : "1"}
                                min="0"
                                value={amount}
                                disabled={running}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full border border-gray-300 rounded pl-6 pr-2 py-2 text-sm text-right disabled:bg-gray-100"
                            />
                        </div>
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={addFee}
                        disabled={running}
                        onChange={(e) => setAddFee(e.target.checked)}
                        className="rounded"
                    />
                    온라인 예약 수수료를 손님에게 붙이기
                </label>

                {valid && (
                    <div className="bg-gray-50 border border-gray-100 rounded p-3 text-sm space-y-1">
                        <div className="flex justify-between text-gray-500">
                            <span>상품가</span><span>{money(base, currency)}</span>
                        </div>
                        {addFee && (
                            <div className="flex justify-between text-gray-500">
                                <span>수수료</span><span>{money(previewFee, currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                            <span>손님 결제액</span><span>{money(previewTotal, currency)}</span>
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <button
                    onClick={submit}
                    disabled={running || !valid}
                    className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    결제 링크 만들기
                </button>
            </div>

            {created && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3">
                    <p className="font-bold text-green-900">
                        링크가 만들어졌습니다 · 결제액 {money(created.total, created.currency)}
                    </p>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={created.url}
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 border border-green-300 rounded px-3 py-2 text-xs font-mono bg-white"
                        />
                        <button
                            onClick={copy}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 flex items-center gap-1.5 shrink-0"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "복사됨" : "복사"}
                        </button>
                    </div>
                    <p className="text-xs text-green-800">
                        만료되지 않습니다. <b>한 번 결제되면 자동으로 닫힙니다.</b>
                        결제 내역은 Stripe 대시보드에서 확인하세요.
                    </p>
                </div>
            )}
        </div>
    );
}
