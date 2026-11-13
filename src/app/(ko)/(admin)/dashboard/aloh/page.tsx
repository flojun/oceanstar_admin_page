"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ALOH_COMMISSION } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

/** ALOH QR 두 개. 일반가는 홈, 특가는 예약 창을 바로 연다 (BookingContext 의 ?ref · ?book). */
const ALOH_QRS = [
    { key: "aloh", title: "일반가 QR", desc: "홈페이지 정상가", url: `${SITE_URL}/?ref=aloh` },
    // book=deal 은 투어 키가 아니라서 투어 고르기(1·2부 · 선셋)부터 열린다
    { key: "aloh-sale", title: "특가 QR (1·2부 $80 · 선셋 $120)", desc: "투어 2일 전부터 · 1·2부 41명 · 선셋 34명까지", url: `${SITE_URL}/?ref=aloh-sale&book=deal` },
];

type AlohRow = { id: string; tour_date: string; order_id: string; option: string | null; name: string; pax: string | null; note: string | null; total_price: number | null; currency: string | null };

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const cents = (n: number) => Math.round(n * 100) / 100;

/** ALOH 관리: 예약 QR 두 개와 달마다 수수료(결제 총액 × 비율). 투어 날짜 기준, 취소 건은 뺀다. */
export default function AlohPage() {
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
    const [reservations, setReservations] = useState<AlohRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const start = `${month.y}-${String(month.m).padStart(2, "0")}-01`;
        const next = month.m === 12 ? `${month.y + 1}-01-01` : `${month.y}-${String(month.m + 1).padStart(2, "0")}-01`;
        let alive = true;
        supabase
            .from("reservations")
            .select("id, tour_date, order_id, option, name, pax, note, total_price, currency")
            .eq("source", "ALOH")
            .gte("tour_date", start)
            .lt("tour_date", next)
            .not("status", "in", "(취소,취소요청)")
            .order("tour_date", { ascending: true })
            .then(({ data, error }) => {
                if (!alive) return;
                setError(error?.message ?? null);
                setReservations((data as AlohRow[]) ?? []);
                setLoading(false);
            });
        return () => { alive = false; };
    }, [month]);

    const shift = (n: number) => {
        setLoading(true);
        setMonth(({ y, m }) => {
            const d = new Date(y, m - 1 + n, 1);
            return { y: d.getFullYear(), m: d.getMonth() + 1 };
        });
    };

    const rows = reservations.map(r => {
        const total = Number(r.total_price) || 0;
        return { r, total, fees: ALOH_COMMISSION.map(c => cents(total * c.rate)) };
    });
    const sumTotal = cents(rows.reduce((a, x) => a + x.total, 0));
    const sumFees = ALOH_COMMISSION.map((_, i) => cents(rows.reduce((a, x) => a + x.fees[i], 0)));
    const net = cents(sumTotal - sumFees.reduce((a, b) => a + b, 0));

    const save = (key: string) => {
        const c = document.getElementById(`qr-${key}`) as HTMLCanvasElement | null;
        if (!c) return;
        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = `ALOH-${key}-qr.png`;
        a.click();
    };

    return (
        <div className="p-6 w-full space-y-6 bg-white">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">ALOH 관리</h1>
                <p className="text-gray-500 mt-1">ALOH 호스텔 QR 로 들어온 예약과 달마다 줄 수수료 (조덕 10% · 하준 5%, 결제 총액 기준).</p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => shift(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50" aria-label="이전 달"><ChevronLeft className="w-4 h-4" /></button>
                    <h2 className="font-bold text-lg text-gray-800 w-32 text-center">{month.y}년 {month.m}월</h2>
                    <button type="button" onClick={() => shift(1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50" aria-label="다음 달"><ChevronRight className="w-4 h-4" /></button>
                    <span className="text-xs text-gray-400 ml-2">투어 날짜 기준 · 취소 건 제외</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="text-xs font-bold text-gray-500">결제 총액 ({rows.length}건)</div>
                        <div className="text-xl font-extrabold text-gray-900 mt-1">{usd(sumTotal)}</div>
                    </div>
                    {ALOH_COMMISSION.map((c, i) => (
                        <div key={c.name} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="text-xs font-bold text-amber-700">{c.name} 수수료 ({c.rate * 100}%)</div>
                            <div className="text-xl font-extrabold text-amber-900 mt-1">{usd(sumFees[i])}</div>
                        </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="text-xs font-bold text-blue-700">수수료 뺀 금액</div>
                        <div className="text-xl font-extrabold text-blue-900 mt-1">{usd(net)}</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-gray-500 font-semibold text-xs">
                                <th className="p-3 text-center">날짜</th>
                                <th className="p-3 text-left">예약번호</th>
                                <th className="p-3 text-left">옵션</th>
                                <th className="p-3 text-left">예약자명</th>
                                <th className="p-3 text-center">인원</th>
                                <th className="p-3 text-right">결제액</th>
                                {ALOH_COMMISSION.map(c => <th key={c.name} className="p-3 text-right">{c.name} {c.rate * 100}%</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6 + ALOH_COMMISSION.length} className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" /></td></tr>
                            ) : error ? (
                                <tr><td colSpan={6 + ALOH_COMMISSION.length} className="p-16 text-center text-red-500">조회 중 오류: {error}</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={6 + ALOH_COMMISSION.length} className="p-16 text-center text-gray-400 font-medium">이 달 ALOH 예약이 없습니다.</td></tr>
                            ) : rows.map(({ r, total, fees }) => (
                                <tr key={r.id} className="hover:bg-blue-50/50">
                                    <td className="p-3 text-center text-gray-600 whitespace-nowrap">{r.tour_date}</td>
                                    <td className="p-3 font-mono text-gray-600">{r.order_id}</td>
                                    <td className="p-3 text-gray-700">{r.option}{r.note?.includes("ALOH 특가") && <span className="ml-1 text-xs font-bold text-rose-600 bg-rose-50 px-1.5 rounded">특가</span>}</td>
                                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">{r.name}</td>
                                    <td className="p-3 text-center">{r.pax}</td>
                                    <td className="p-3 text-right font-bold">{usd(total)}{r.currency && r.currency !== "USD" && <span className="ml-1 text-xs text-red-500">{r.currency}</span>}</td>
                                    {fees.map((f, i) => <td key={i} className="p-3 text-right text-amber-800">{usd(f)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="font-bold text-gray-800 mb-4">ALOH 예약 QR</h2>
                <div className="flex flex-wrap gap-8">
                    {ALOH_QRS.map(q => (
                        <div key={q.key} className="flex flex-col items-center gap-2 text-center">
                            <QRCodeCanvas id={`qr-${q.key}`} value={q.url} size={600} marginSize={2} level="M" style={{ width: 180, height: 180 }} />
                            <b className="text-gray-800">{q.title}</b>
                            <span className="text-xs text-gray-500">{q.desc}</span>
                            <a href={q.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all max-w-[220px]">{q.url}</a>
                            <button type="button" onClick={() => save(q.key)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <Download className="w-3 h-3" /> PNG 저장
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
