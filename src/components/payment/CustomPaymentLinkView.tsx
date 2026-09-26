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

const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const FIELD = "w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100";

export default function CustomPaymentLinkView() {
    const [productName, setProductName] = useState("");
    const [currency, setCurrency] = useState<Currency>("USD");
    const [amount, setAmount] = useState("3200");
    const [lang, setLang] = useState<"ko" | "en">("ko");
    const [addFee, setAddFee] = useState(true);

    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<Created | null>(null);
    const [copied, setCopied] = useState(false);

    const base = Number(amount);
    const valid = Number.isFinite(base) && base > 0;
    const previewTotal = valid ? (addFee ? grossUp(base, currency) : base) : 0;
    const previewFee = valid && addFee ? feeAmount(base, currency) : 0;

    const submit = async () => {
        setError(null);
        if (!productName.trim()) return setError("상품명을 입력하세요.");
        if (!valid) return setError("금액을 확인하세요.");

        setRunning(true);
        try {
            const res = await fetch("/api/admin/payment-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productName, amount: base, currency, addFee, lang }),
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
        <div className="p-4 sm:p-6 max-w-xl space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-800">맞춤 결제 링크</h1>
                <p className="text-sm text-gray-500 mt-1">
                    요금표에 없는 금액을 받을 때 쓰세요. 상품명과 금액만 정하면 되고,
                    예약 정보는 손님이 결제 전에 직접 입력합니다.
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <div>
                    <label className={LABEL}>
                        상품명
                        <span className="font-normal text-gray-400"> (손님 화면과 결제창에 이대로 표시됩니다)</span>
                    </label>
                    <input type="text" value={productName} disabled={running}
                        placeholder={lang === "en" ? "OceanStar Private Charter" : "오션스타 프라이빗 차터"}
                        onChange={(e) => setProductName(e.target.value)} className={FIELD} />
                </div>

                <div className="flex gap-2">
                    <div className="w-28">
                        <label className={LABEL}>통화</label>
                        <select value={currency} disabled={running}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className={FIELD + " bg-white px-2"}>
                            <option value="USD">USD ($)</option>
                            <option value="KRW">KRW (₩)</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className={LABEL}>금액 (수수료 전)</label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">
                                {symbolFor(currency)}
                            </span>
                            <input type="number" step={currency === "USD" ? "0.01" : "1"} min="0"
                                value={amount} disabled={running}
                                onChange={(e) => setAmount(e.target.value)}
                                className={FIELD + " pl-6 text-right"} />
                        </div>
                    </div>
                    <div className="w-32">
                        <label className={LABEL}>손님 언어</label>
                        <select value={lang} disabled={running}
                            onChange={(e) => setLang(e.target.value as "ko" | "en")}
                            className={FIELD + " bg-white px-2"}>
                            <option value="ko">한국어</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={addFee} disabled={running}
                        onChange={(e) => setAddFee(e.target.checked)} className="rounded" />
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
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4" /> 알아두실 점
                </p>
                <ul className="space-y-1 ml-1">
                    <li>· 손님이 <b>이름·날짜·인원·옵션·픽업장소</b>를 직접 고릅니다. 협의한 내용과 다를 수 있으니 결제 후 확인해 주세요.</li>
                    <li>· <b>결제가 완료돼야 예약이 생깁니다.</b> 링크만 보낸 상태에서는 자리가 잡히지 않습니다.</li>
                    <li>· 링크는 <b>1회 결제되면 자동으로 닫힙니다.</b></li>
                    <li>· 바우처 메일의 <b>픽업 시간은 “별도 안내”</b>로 나가고 시간표 PDF는 붙지 않습니다.</li>
                    <li>· 일반 예약과 같이 <b>투어 전날 결제가 확정</b>되고, 그 전에는 수수료 없이 취소됩니다.</li>
                </ul>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <button onClick={submit} disabled={running}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                결제 링크 만들기
            </button>

            {created && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3">
                    <p className="font-bold text-green-900">
                        링크 생성 완료 · {money(created.total, created.currency)}
                    </p>
                    <div className="flex gap-2">
                        <input readOnly value={created.url}
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 border border-green-300 rounded px-3 py-2 text-xs font-mono bg-white" />
                        <button onClick={copy}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 flex items-center gap-1.5 shrink-0">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "복사됨" : "복사"}
                        </button>
                    </div>
                    <p className="text-xs text-green-800 leading-relaxed">
                        공유하면 <b>Oceanstar Custom Checkout</b> 으로 뜹니다.
                        손님이 예약 정보를 채우고 결제하면 예약관리에 자동으로 들어옵니다.
                    </p>
                </div>
            )}
        </div>
    );
}
