"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Link2, Copy, Check, Loader2, AlertTriangle, MapPin } from "lucide-react";
import { grossUp, feeAmount, type Currency } from "@/lib/pricing";
import { findClosestPickup, getWalkingMinutes, type PickupLocation } from "@/lib/utils";

interface Created {
    url: string;
    currency: Currency;
    base: number;
    fee: number;
    total: number;
    order_id: string;
    id: string;
}

/** 옵션 select 에 필요한 것만. tour_settings 전체 타입을 끌고 올 이유가 없다. */
interface TourOption {
    tour_id: string;
    name: string;
    name_en?: string | null;
    is_active?: boolean | null;
}

const libraries: "places"[] = ["places"];

const symbolFor = (c: Currency) => (c === "USD" ? "$" : "₩");
const money = (v: number, c: Currency) =>
    symbolFor(c) + (c === "USD" ? v.toFixed(2) : Math.round(v).toLocaleString());

const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const FIELD = "w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100";

export default function CustomPaymentLinkView() {
    // 결제
    const [currency, setCurrency] = useState<Currency>("USD");
    const [amount, setAmount] = useState("3200");
    const [addFee, setAddFee] = useState(true);
    const [lang, setLang] = useState<"ko" | "en">("ko");

    // 예약
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");
    const [tourDate, setTourDate] = useState("");
    const [pax, setPax] = useState("");
    const [tourId, setTourId] = useState("");
    const [timeRange, setTimeRange] = useState("");
    const [note, setNote] = useState("");
    const [productName, setProductName] = useState("");

    // 픽업
    const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
    const [tourOptions, setTourOptions] = useState<TourOption[]>([]);
    const [pickupId, setPickupId] = useState("");
    const [hotelName, setHotelName] = useState("");
    const [suggestion, setSuggestion] = useState<{ name: string; minutes: number } | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<Created | null>(null);
    const [copied, setCopied] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    useEffect(() => {
        fetch("/api/pickup")
            .then((r) => r.json())
            .then((d) => setPickupLocations(d.pickupLocations ?? d ?? []))
            .catch(() => { /* 목록을 못 받아도 직접 선택은 가능하다 */ });
        fetch("/api/settings")
            .then((r) => r.json())
            .then((d) => setTourOptions((d.tourSettings ?? d ?? []).filter((t: TourOption) => t.is_active !== false)))
            .catch(() => { /* 옵션을 못 받으면 선택지가 비고, 저장은 막힌다 */ });
    }, []);

    const base = Number(amount);
    const validAmount = Number.isFinite(base) && base > 0;
    const previewTotal = validAmount ? (addFee ? grossUp(base, currency) : base) : 0;
    const previewFee = validAmount && addFee ? feeAmount(base, currency) : 0;

    const pickupName = useMemo(
        () => pickupLocations.find((p) => p.id === pickupId)?.name ?? "",
        [pickupLocations, pickupId],
    );
    const tour = useMemo(
        () => tourOptions.find((t) => t.tour_id === tourId),
        [tourOptions, tourId],
    );

    /**
     * 주소를 고르면 가장 가까운 픽업장소를 찾아 자동 선택한다.
     * 예약 페이지와 같은 findClosestPickup 을 쓴다.
     */
    const onPlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        if (!place) return;
        setHotelName(place.name ?? "");

        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        if (lat == null || lng == null || pickupLocations.length === 0) return;

        const result = findClosestPickup(lat, lng, pickupLocations);
        if (!result) return;
        setPickupId(result.closestLocation.id);
        setSuggestion({
            name: result.closestLocation.name,
            minutes: getWalkingMinutes(result.distanceMeters),
        });
    };

    const submit = async () => {
        setError(null);
        if (!validAmount) return setError("금액을 확인하세요.");
        if (!name.trim()) return setError("예약자명을 입력하세요.");
        if (!tourDate) return setError("투어 날짜를 선택하세요.");
        if (!Number(pax)) return setError("인원수를 입력하세요.");
        if (!tour) return setError("옵션을 선택하세요.");
        if (!pickupName) return setError("픽업장소를 선택하세요.");

        setRunning(true);
        try {
            const res = await fetch("/api/admin/payment-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: base, currency, addFee, lang,
                    name, contact, email, tourDate,
                    pax: Number(pax),
                    option: tour.name,
                    optionEn: tour.name_en ?? undefined,
                    productName,
                    timeRange,
                    // 손님이 적어준 숙소가 있으면 같이 남긴다. 기사에게 필요하다.
                    pickupLocation: hotelName.trim() ? `${pickupName} (${hotelName.trim()})` : pickupName,
                    note,
                }),
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
                    요금표에 없는 금액을 받을 때 쓰세요. 결제되면 예약이 자동으로 등록됩니다.
                </p>
            </div>

            {/* 예약 정보 */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <p className="font-bold text-gray-700">예약 정보</p>

                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label className={LABEL}>예약자명</label>
                        <input type="text" value={name} disabled={running}
                            onChange={(e) => setName(e.target.value)} className={FIELD} />
                    </div>
                    <div>
                        <label className={LABEL}>연락처</label>
                        <input type="tel" value={contact} disabled={running} placeholder="010-0000-0000"
                            onChange={(e) => setContact(e.target.value)} className={FIELD} />
                    </div>
                    <div>
                        <label className={LABEL}>투어 날짜</label>
                        <input type="date" value={tourDate} disabled={running}
                            onChange={(e) => setTourDate(e.target.value)} className={FIELD} />
                    </div>
                    <div>
                        <label className={LABEL}>인원수</label>
                        <input type="number" min="1" step="1" value={pax} disabled={running} placeholder="명"
                            onChange={(e) => setPax(e.target.value)} className={FIELD} />
                    </div>
                    <div>
                        <label className={LABEL}>옵션</label>
                        <select value={tourId} disabled={running}
                            onChange={(e) => setTourId(e.target.value)}
                            className={FIELD + " bg-white"}>
                            <option value="">선택하세요</option>
                            {tourOptions.map((t) => (
                                <option key={t.tour_id} value={t.tour_id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={LABEL}>
                            시간대 <span className="font-normal text-gray-400">(선택)</span>
                        </label>
                        <input type="text" value={timeRange} disabled={running} placeholder="09:00-13:00"
                            onChange={(e) => setTimeRange(e.target.value)} className={FIELD} />
                    </div>
                </div>

                <div>
                    <label className={LABEL}>손님 이메일</label>
                    <input type="email" value={email} disabled={running}
                        onChange={(e) => setEmail(e.target.value)} className={FIELD} />
                </div>

                {/* 픽업 */}
                <div>
                    <label className={LABEL}>
                        숙소 주소 <span className="font-normal text-gray-400">(입력하면 가까운 픽업장소를 추천합니다)</span>
                    </label>
                    {isLoaded ? (
                        <Autocomplete
                            onLoad={(a) => { autocompleteRef.current = a; }}
                            onPlaceChanged={onPlaceChanged}
                            options={{ componentRestrictions: { country: "us" } }}
                        >
                            <input type="text" value={hotelName} disabled={running}
                                placeholder="호텔 이름이나 주소를 입력하세요"
                                onChange={(e) => setHotelName(e.target.value)} className={FIELD} />
                        </Autocomplete>
                    ) : (
                        <input type="text" value={hotelName} disabled={running}
                            placeholder="호텔 이름이나 주소를 입력하세요"
                            onChange={(e) => setHotelName(e.target.value)} className={FIELD} />
                    )}
                    {suggestion && (
                        <p className="mt-1.5 text-xs text-blue-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            가장 가까운 픽업장소: <b>{suggestion.name}</b> (도보 약 {suggestion.minutes}분)
                        </p>
                    )}
                </div>

                <div>
                    <label className={LABEL}>픽업장소</label>
                    <select value={pickupId} disabled={running}
                        onChange={(e) => { setPickupId(e.target.value); setSuggestion(null); }}
                        className={FIELD + " bg-white"}>
                        <option value="">선택하세요</option>
                        {pickupLocations.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={LABEL}>
                        기타 / 요청사항 <span className="font-normal text-gray-400">(선택)</span>
                    </label>
                    <textarea value={note} disabled={running} rows={3}
                        placeholder="손님 요청사항, 내부 메모 등"
                        onChange={(e) => setNote(e.target.value)}
                        className={FIELD + " resize-none"} />
                </div>
            </div>

            {/* 결제 */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <p className="font-bold text-gray-700">결제 금액</p>

                <div>
                    <label className={LABEL}>
                        상품명
                        <span className="font-normal text-gray-400"> (결제창에 이대로 표시됩니다)</span>
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

                {validAmount && (
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
                    <li>· <b>결제가 완료돼야 예약이 생깁니다.</b> 링크만 만든 상태에서는 자리가 잡히지 않습니다.</li>
                    <li>· 링크 주소를 아는 사람은 누구나 열 수 있습니다. <b>1회 결제되면 자동으로 닫힙니다.</b></li>
                    <li>· 일반 예약과 같이 <b>투어 전날 결제가 확정</b>되고, 그 전에는 수수료 없이 취소됩니다.</li>
                    <li>· 손님 언어를 <b>English</b> 로 하면 결제창과 안내 화면이 영어로 뜹니다. 바우처 메일은 원래 한/영 두 통이 나갑니다.</li>
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
                        링크 생성 완료 · 예약번호 <span className="font-mono">{created.order_id}</span> · {money(created.total, created.currency)}
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
                        만료되지 않습니다. 공유하면 <b>Oceanstar Custom Checkout</b> 으로 뜹니다.
                        결제되면 예약관리에 <b>{created.order_id}</b> 번으로 들어옵니다.
                    </p>
                </div>
            )}
        </div>
    );
}
