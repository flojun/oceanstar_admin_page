"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Loader2, MapPin, CreditCard } from "lucide-react";
import { findClosestPickup, getWalkingMinutes, type PickupLocation } from "@/lib/utils";
import type { Currency } from "@/lib/pricing";

interface TourOption {
    tour_id: string;
    name: string;
    name_en?: string | null;
    is_active?: boolean | null;
}

interface Props {
    priceId: string;
    lang: "ko" | "en";
    active: boolean;
    productName: string;
    currency: Currency;
    base: number;
    fee: number;
}

const libraries: "places"[] = ["places"];

const COPY = {
    ko: {
        heading: "예약 정보 입력",
        lead: "결제 전에 아래 정보를 입력해 주세요.",
        name: "예약자명", contact: "연락처", email: "이메일",
        date: "투어 날짜", pax: "인원수", option: "옵션",
        time: "희망 시간대", timeHint: "(선택)",
        address: "숙소 주소", addressHint: "입력하면 가까운 픽업장소를 찾아드립니다",
        addressPlaceholder: "호텔 이름이나 주소를 입력하세요",
        pickup: "픽업 장소",
        nearest: "가장 가까운 픽업장소",
        walk: (m: number) => `도보 약 ${m}분`,
        note: "요청사항", noteHint: "(선택)",
        notePlaceholder: "알레르기, 동행 정보, 기타 요청사항",
        select: "선택하세요",
        product: "상품", amount: "금액", feeLabel: "온라인 예약 수수료", total: "결제 금액",
        submit: "결제하기",
        submitting: "결제창으로 이동 중…",
        closedTitle: "이미 결제가 완료된 링크입니다.",
        closedBody: "결제하지 않으셨다면 오션스타로 문의해 주세요.",
        pickupNotice: "픽업 시간은 예약 확정 후 별도로 안내드립니다.",
        paxPlaceholder: "예: 8",
    },
    en: {
        heading: "Booking details",
        lead: "Please fill in your details before paying.",
        name: "Full name", contact: "Phone", email: "Email",
        date: "Tour date", pax: "Number of guests", option: "Option",
        time: "Preferred time", timeHint: "(optional)",
        address: "Hotel or address", addressHint: "We will find your nearest pickup point",
        addressPlaceholder: "Enter your hotel name or address",
        pickup: "Pickup location",
        nearest: "Nearest pickup point",
        walk: (m: number) => `about ${m} min walk`,
        note: "Requests", noteHint: "(optional)",
        notePlaceholder: "Allergies, who is joining, anything else",
        select: "Please select",
        product: "Item", amount: "Amount", feeLabel: "Online booking fee", total: "Total",
        submit: "Continue to payment",
        submitting: "Opening payment…",
        closedTitle: "This payment link has already been used.",
        closedBody: "If you have not paid yet, please contact Ocean Star.",
        pickupNotice: "Pickup time will be sent separately once your booking is confirmed.",
        paxPlaceholder: "e.g. 8",
    },
} as const;

const LABEL = "block text-sm font-medium text-slate-700 mb-1";
const FIELD = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100";

export default function CustomBookingForm({
    priceId, lang, active, productName, currency, base, fee,
}: Props) {
    const t = COPY[lang];
    const money = (v: number) =>
        (currency === "USD" ? "$" : "₩") + (currency === "USD" ? v.toFixed(2) : Math.round(v).toLocaleString());

    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");
    const [tourDate, setTourDate] = useState("");
    const [pax, setPax] = useState("");
    const [tourId, setTourId] = useState("");
    const [timeRange, setTimeRange] = useState("");
    const [note, setNote] = useState("");

    const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
    const [tourOptions, setTourOptions] = useState<TourOption[]>([]);
    const [pickupId, setPickupId] = useState("");
    const [hotelName, setHotelName] = useState("");
    const [suggestion, setSuggestion] = useState<{ name: string; minutes: number } | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        // 맞춤 링크는 프라이빗 차터 전용이다. 다른 옵션은 정규 예약 페이지에서
        // 받는다. tour_settings 에서 이름을 읽어 오므로 이름을 바꿔도 따라간다.
        fetch("/api/settings")
            .then((r) => r.json())
            .then((d) => setTourOptions(
                (d.tourSettings ?? d ?? []).filter((x: TourOption) => x.tour_id === "private"),
            ))
            .catch(() => { /* 옵션을 못 받으면 선택지가 빈다 */ });
    }, []);

    const pickupName = useMemo(
        () => pickupLocations.find((p) => p.id === pickupId)?.name ?? "",
        [pickupLocations, pickupId],
    );
    const tour = useMemo(
        () => tourOptions.find((x) => x.tour_id === tourId),
        [tourOptions, tourId],
    );

    /** 주소를 고르면 가장 가까운 픽업장소를 자동 선택한다. */
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
        setRunning(true);
        try {
            const res = await fetch(`/api/pay/${priceId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, contact, email, tourDate,
                    pax: Number(pax),
                    // DB 와 관리자 화면은 한국어 옵션명으로 맞춘다.
                    option: tour?.name ?? "",
                    timeRange,
                    pickupLocation: hotelName.trim() ? `${pickupName} (${hotelName.trim()})` : pickupName,
                    note,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
            window.location.href = json.url;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setRunning(false);
        }
    };

    if (!active) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
                <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight mb-6">O C E A N S T A R</h1>
                <p className="text-slate-700 font-bold text-lg">{t.closedTitle}</p>
                <p className="mt-2 text-sm text-slate-500">{t.closedBody}</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="mx-auto w-full max-w-lg space-y-5">
                <div className="text-center">
                    <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">O C E A N S T A R</h1>
                    <h2 className="mt-4 text-lg font-bold text-slate-800">{t.heading}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t.lead}</p>
                </div>

                {/* 금액 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm space-y-1.5 shadow-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">{t.product}</span>
                        <span className="font-semibold text-slate-900">{productName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">{t.amount}</span>
                        <span className="text-slate-700">{money(base)}</span>
                    </div>
                    {fee > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t.feeLabel}</span>
                            <span className="text-slate-700">{money(fee)}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 mt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-900">{t.total}</span>
                        <span className="font-bold text-blue-600 text-lg">{money(base + fee)}</span>
                    </div>
                </div>

                {/* 예약 정보 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label className={LABEL}>{t.name}</label>
                            <input type="text" value={name} disabled={running}
                                onChange={(e) => setName(e.target.value)} className={FIELD} />
                        </div>
                        <div>
                            <label className={LABEL}>{t.contact}</label>
                            <input type="tel" value={contact} disabled={running}
                                onChange={(e) => setContact(e.target.value)} className={FIELD} />
                        </div>
                        <div>
                            <label className={LABEL}>{t.date}</label>
                            <input type="date" value={tourDate} disabled={running}
                                onChange={(e) => setTourDate(e.target.value)} className={FIELD} />
                        </div>
                        <div>
                            <label className={LABEL}>{t.pax}</label>
                            <input type="number" min="1" step="1" value={pax} disabled={running}
                                placeholder={t.paxPlaceholder}
                                onChange={(e) => setPax(e.target.value)} className={FIELD} />
                        </div>
                        <div>
                            <label className={LABEL}>{t.option}</label>
                            <select value={tourId} disabled={running}
                                onChange={(e) => setTourId(e.target.value)} className={FIELD + " bg-white"}>
                                <option value="">{t.select}</option>
                                {tourOptions.map((x) => (
                                    <option key={x.tour_id} value={x.tour_id}>
                                        {lang === "en" ? (x.name_en || "Private Charter") : x.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>
                                {t.time} <span className="font-normal text-slate-400">{t.timeHint}</span>
                            </label>
                            <input type="text" value={timeRange} disabled={running} placeholder="09:00-13:00"
                                onChange={(e) => setTimeRange(e.target.value)} className={FIELD} />
                        </div>
                    </div>

                    <div>
                        <label className={LABEL}>{t.email}</label>
                        <input type="email" value={email} disabled={running}
                            onChange={(e) => setEmail(e.target.value)} className={FIELD} />
                    </div>

                    <div>
                        <label className={LABEL}>
                            {t.address} <span className="font-normal text-slate-400">({t.addressHint})</span>
                        </label>
                        {isLoaded ? (
                            <Autocomplete
                                onLoad={(a) => { autocompleteRef.current = a; }}
                                onPlaceChanged={onPlaceChanged}
                                options={{ componentRestrictions: { country: "us" } }}
                            >
                                <input type="text" value={hotelName} disabled={running}
                                    placeholder={t.addressPlaceholder}
                                    onChange={(e) => setHotelName(e.target.value)} className={FIELD} />
                            </Autocomplete>
                        ) : (
                            <input type="text" value={hotelName} disabled={running}
                                placeholder={t.addressPlaceholder}
                                onChange={(e) => setHotelName(e.target.value)} className={FIELD} />
                        )}
                        {suggestion && (
                            <p className="mt-1.5 text-xs text-blue-700 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {t.nearest}: <b>{suggestion.name}</b> ({t.walk(suggestion.minutes)})
                            </p>
                        )}
                    </div>

                    <div>
                        <label className={LABEL}>{t.pickup}</label>
                        <select value={pickupId} disabled={running}
                            onChange={(e) => { setPickupId(e.target.value); setSuggestion(null); }}
                            className={FIELD + " bg-white"}>
                            <option value="">{t.select}</option>
                            {pickupLocations.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <p className="mt-1.5 text-xs text-slate-500">{t.pickupNotice}</p>
                    </div>

                    <div>
                        <label className={LABEL}>
                            {t.note} <span className="font-normal text-slate-400">{t.noteHint}</span>
                        </label>
                        <textarea value={note} disabled={running} rows={3}
                            placeholder={t.notePlaceholder}
                            onChange={(e) => setNote(e.target.value)}
                            className={FIELD + " resize-none"} />
                    </div>
                </div>

                {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

                <button onClick={submit} disabled={running}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center gap-2 shadow-sm">
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    {running ? t.submitting : `${t.submit} · ${money(base + fee)}`}
                </button>
            </div>
        </main>
    );
}
