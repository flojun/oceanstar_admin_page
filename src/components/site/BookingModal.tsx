"use client";

/**
 * 예약 창 (캔버스 Sian1A~D). 규칙은 운영 중이던 ReservationClientPage 의 예약 창과 같다.
 *   - 날짜: 지난 날 · 요일 휴무(blocked_days) · 막은 날(blocked_dates) · 자리 부족(/api/availability)
 *   - 콤보: 두 번째 활동은 주말 불가 · 스노클링과 같은 날 불가
 *   - 픽업: 숙소를 넣으면 가장 가까운 픽업 장소를 고른다 (구글 자동완성)
 *   - 결제: POST /api/stripe/checkout → Stripe 결제창. 금액은 서버가 다시 계산한다.
 * 달라진 점: 통화(KRW/USD)를 창 안에서 고르고, 결제 수수료를 포함한 실제 청구액을 보여 준다.
 */
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { addMonths, format, getDaysInMonth, isSameMonth, startOfMonth } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { basePrice, grossUp, resolveExchangeRate, type Currency } from "@/lib/pricing";
import { findClosestPickup, getWalkingMinutes, type PickupLocation } from "@/lib/utils";
import { getTranslation } from "@/lib/translations";
import { getPickupDisplayNameByLang } from "@/constants/pickupLocations";
import type { TourSetting } from "@/lib/tourUtils";
import type { BlockedDate } from "@/lib/siteData";
import { Arrow, Check, Chevron, Close, Minus, Pin, Plus, Shield } from "./Icons";
import {
    TOURS, activeRows, ampm, availableTours, currencyOf, fmtMoney, sessionLabel, sessionRange, shiftTime,
    tourByKey, type Lang, type TourDef, type TourKey,
} from "./tours";

const libraries: "places"[] = ["places"];

type Avail = Record<string, { booked: number; remaining: number; isAvailable: boolean }>;
type Pick = { location: PickupLocation; minutes: number } | null;

const S = {
    ko: {
        perAdult: "성인 1인", teamFare: "팀 요금 · 1-10명", perAdultHead: "성인 1인 기준", change: "바꾸기",
        twoDays: "두 활동이 서로 다른 날에 열립니다", sessionH: "거북이 스노클링 시간 선택", pickupIncl: "픽업 포함 시간",
        comboH: "콤보 세부 옵션 선택", free: "24개월 미만 무료", privatePax: "팀 요금: 1-10명 $1,200 · 11-20명 $1,800 · 21-30명 $2,400",
        dateH: "날짜 선택", datesPickup: "날짜와 픽업", perActivity: "활동마다 따로 받습니다", info: "예약 정보 입력", booker: "예약자 정보",
        recalc: (pax: string, m: number, n: number) => <>{pax} 기준으로 {m}월에 고를 수 있는 날짜는 <b>{n}개</b>입니다.</>,
        clash: (d: string) => <>스노클링 날짜와 <b>같은 날은 고를 수 없습니다.</b>{d && <><br />달력에서 <span className="nw">✕ 로</span> 표시한 {d}입니다.</>}</>,
        noWeekend: "주말 및 공휴일 불가", snorkel: "거북이 스노클링", para: "패러세일링 / 제트스키",
        year: (y: number) => `${y}년`, month: (m: number) => `${m}월`, dows: ["일", "월", "화", "수", "목", "금", "토"],
        prev: "이전 달", next: "다음 달", pickup: "픽업 장소", other: "다른 곳으로", pickHint: "숙소를 넣으면 가장 가까운 곳을 골라 드립니다.",
        emptySide: "투어를 고르면 날짜와 금액이 여기에 쌓입니다. 인원을 넣으면 실제 결제 금액이 계산됩니다.",
        pickFirst: "투어를 먼저 골라주세요", date: "날짜", time: "시간", pax: "인원", option: "옵션",
        paxVal: (a: number, c: number) => `성인 ${a} · 아동 ${c}`, paxTotal: (n: number) => `${n}명`,
        adultLine: (n: number) => `성인 ${n}`, childLine: (n: number) => `아동 ${n}`, personLine: (n: number) => `${n}명`, team: "팀 요금",
        fee: "결제 수수료", feeNote: "카드 결제 수수료가 포함된 금액입니다. 결제 화면에도 같은 금액이 나옵니다.",
        snorkelDate: "스노클링 날짜", snorkelPick: "스노클링 픽업", paraDate: "패러세일링 날짜", paraPick: "패러세일링 픽업",
        privateNote: "프라이빗 차터 픽업 시간은 예약 후 개별 조율됩니다.", close: "닫기",
        err: {
            session: "거북이 스노클링 시간을 선택해주세요.", combo: "패러세일링/제트스키 옵션을 선택해주세요.",
            date: "투어 날짜를 선택해주세요.", date2: "패러세일링/제트스키 날짜를 선택해주세요.",
            pick2: "패러세일링/제트스키 픽업 장소를 입력해주세요.", hotel: "숙소를 입력하거나 픽업 장소를 선택해주세요",
            name: "예약자 성함을 입력해주세요", email: "정확한 이메일을 입력해주세요", phone: "연락처를 입력해주세요",
            pax: "최소 1명 이상 선택해주세요", server: "서버 통신 중 오류가 발생했습니다.", pay: "결제 준비 중 오류가 발생했습니다: ",
        },
        namePh: "예: 홍길동", phonePh: "010-0000-0000 혹은 카카오톡 ID",
    },
    en: {
        perAdult: "Per adult", teamFare: "Team fare · 1-10 guests", perAdultHead: "Price per adult", change: "Change",
        twoDays: "The two activities run on different days", sessionH: "Select snorkeling session", pickupIncl: "Includes pickup",
        comboH: "Select combo option", free: "Under 24 months free", privatePax: "Team fare: 1-10 guests $1,200 · 11-20 $1,800 · 21-30 $2,400",
        dateH: "Select Date", datesPickup: "Dates and pickup", perActivity: "One for each activity", info: "Enter Booking Info", booker: "Booker details",
        recalc: (pax: string, m: number, n: number) => <>For {pax}, <b>{n} dates</b> are open in {format(new Date(2000, m - 1, 1), "MMMM")}.</>,
        clash: (d: string) => <>You <b>cannot pick the same day</b> as your snorkeling date{d && <> ({d}, marked ✕)</>}.</>,
        noWeekend: "No weekends or holidays", snorkel: "Turtle snorkeling", para: "Parasailing / jet ski",
        year: (y: number) => `${y}`, month: (m: number) => format(new Date(2000, m - 1, 1), "MMM"), dows: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        prev: "Previous month", next: "Next month", pickup: "Pickup", other: "Change", pickHint: "Enter your hotel and we will pick the nearest spot.",
        emptySide: "Your dates and price build up here once you pick a tour. Add passengers to see the actual total.",
        pickFirst: "Please pick a tour first", date: "Date", time: "Time", pax: "Guests", option: "Option",
        paxVal: (a: number, c: number) => `${a} adult${a === 1 ? "" : "s"} · ${c} child${c === 1 ? "" : "ren"}`, paxTotal: (n: number) => `${n} guest${n === 1 ? "" : "s"}`,
        adultLine: (n: number) => `Adult ${n}`, childLine: (n: number) => `Child ${n}`, personLine: (n: number) => `${n} guest${n === 1 ? "" : "s"}`, team: "Team fare",
        fee: "Card processing fee", feeNote: "Includes the card processing fee. The payment page shows the same amount.",
        snorkelDate: "Snorkeling date", snorkelPick: "Snorkeling pickup", paraDate: "Parasail date", paraPick: "Parasail pickup",
        privateNote: "Pickup time for private trips will be coordinated individually after booking.", close: "Close",
        err: {
            session: "Please select a snorkeling time.", combo: "Please select a combo option.",
            date: "Please select a tour date.", date2: "Please select a date for the second activity.",
            pick2: "Please enter pickup location for the second activity.", hotel: "Please enter your hotel or select a pickup location",
            name: "Please enter the booker's name", email: "Please enter a valid email", phone: "Please enter a contact number",
            pax: "Please select at least 1 person", server: "Server communication error.", pay: "Payment error: ",
        },
        namePh: "e.g., HONG GILDONG", phonePh: "+1 808-000-0000",
    },
};

const COMBO_OPTS = [
    { id: "1", ko: "거북이 스노클링 + 패러세일링", en: "Turtle Snorkeling + Parasailing", usd: 210, short: { ko: "패러세일링", en: "Parasailing" } },
    { id: "2", ko: "거북이 스노클링 + 제트 스키", en: "Turtle Snorkeling + Jet Ski", usd: 210, short: { ko: "제트스키", en: "Jet ski" } },
    { id: "3", ko: "거북이 스노클링 + 패러세일링 + 제트스키", en: "Turtle Snorkeling + Parasailing + Jet Ski", usd: 310, short: { ko: "패러세일링 + 제트스키", en: "Parasail + jet ski" } },
];

const today0 = () => new Date(new Date().setHours(0, 0, 0, 0));
const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingModal({
    lang, initialTour, tourSettings, blockedDates, onClose,
}: {
    lang: Lang; initialTour?: TourKey; tourSettings: TourSetting[]; blockedDates: BlockedDate[]; onClose: () => void;
}) {
    const s = S[lang];
    const tr = getTranslation(lang);
    const tours = useMemo(() => availableTours(tourSettings), [tourSettings]);

    const [tourKey, setTourKey] = useState<TourKey | undefined>(initialTour && tours.some((t) => t.key === initialTour) ? initialTour : undefined);
    const def = tourKey ? tourByKey(tourKey) : undefined;
    const rows = def ? activeRows(def, tourSettings) : [];
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [comboOption, setComboOption] = useState<string | null>(null);
    const [comboTime, setComboTime] = useState<string | null>(null);
    const morningRows = activeRows(TOURS[0], tourSettings);

    // tour_settings 의 어느 행으로 예약하는지
    const selectedTour: string | null = !def ? null
        : def.key === "turtle" ? sessionId
        : rows[0]?.tour_id ?? null;
    const row = tourSettings.find((t) => t.tour_id === selectedTour) ?? (def ? rows[0] : undefined);
    const isPrivate = !!row?.is_flat_rate && row?.tour_id === "private";
    const isFlat = !!row?.is_flat_rate;
    const isCombo = def?.key === "combo";

    const [adult, setAdult] = useState(2);
    const [child, setChild] = useState(0);
    const pax = adult + child;
    const [currency, setCurrency] = useState<Currency>(currencyOf(lang));

    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [date, setDate] = useState<Date | undefined>();
    const [month2, setMonth2] = useState(() => startOfMonth(new Date()));
    const [date2, setDate2] = useState<Date | undefined>();
    const [avail, setAvail] = useState<Avail>({});
    const [maxCap, setMaxCap] = useState(45);
    const [loadingAvail, setLoadingAvail] = useState(false);

    const [pickups, setPickups] = useState<PickupLocation[]>([]);
    const [hotel, setHotel] = useState("");
    const [pick, setPick] = useState<Pick>(null);
    const [choosing, setChoosing] = useState(false);
    const [hotel2, setHotel2] = useState("");
    const [pick2, setPick2] = useState<Pick>(null);
    const [choosing2, setChoosing2] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [banner, setBanner] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const closeRef = useRef<HTMLButtonElement>(null);
    const ac1 = useRef<google.maps.places.Autocomplete | null>(null);
    const ac2 = useRef<google.maps.places.Autocomplete | null>(null);
    const { isLoaded } = useJsApiLoader({ id: "google-map-script", googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", libraries });

    // 창이 열려 있는 동안 뒤 페이지 스크롤을 막고, Esc 로 닫는다
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", esc);
        return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", esc); };
    }, [onClose]);

    useEffect(() => {
        fetch("/api/pickup").then((r) => r.json()).then((data) => {
            if (!Array.isArray(data)) return;
            setPickups([...data].sort((a: PickupLocation, b: PickupLocation) => {
                if (a.name === "직접") return 1;
                if (b.name === "직접") return -1;
                return (a.time_1 || "").localeCompare(b.time_1 || "");
            }));
        }).catch((e) => console.error("Failed to fetch pickup locations", e));
    }, []);

    // 상품을 고르면 기본값: 거북이·콤보는 1부
    useEffect(() => {
        setSessionId(def?.key === "turtle" ? morningRows[0]?.tour_id ?? null : null);
        setComboTime(def?.key === "combo" ? morningRows[0]?.tour_id ?? null : null);
        setComboOption(null);
        setDate(undefined);
        setDate2(undefined);
        if (def && activeRows(def, tourSettings)[0]?.is_flat_rate) setChild(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tourKey]);

    const fetchAvail = useCallback(async (tourId: string, m: Date) => {
        setLoadingAvail(true);
        try {
            const label = tourSettings.find((t) => t.tour_id === tourId)?.name ?? tourId;
            const res = await fetch(`/api/availability?month=${format(m, "yyyy-MM")}&option=${encodeURIComponent(label)}`);
            const data = await res.json();
            if (data.success) { setAvail(data.availability); setMaxCap(data.maxCapacity); }
        } catch (e) {
            console.error("Failed to fetch availability", e);
        } finally {
            setLoadingAvail(false);
        }
    }, [tourSettings]);

    useEffect(() => {
        setAvail({});
        if (selectedTour) fetchAvail(selectedTour, month);
    }, [selectedTour, month, fetchAvail]);

    // 시간(1부·2부)을 바꾸면 자리가 달라지므로 날짜를 다시 고른다
    useEffect(() => { setDate(undefined); }, [selectedTour]);

    const dayBlocked = (d: Date) => {
        if (d < today0()) return true;
        if (row?.blocked_days?.includes(d.getDay())) return true;
        const ds = ymd(d);
        if (blockedDates.some((b) => b.date === ds && (b.tour_id === "all" || b.tour_id === selectedTour))) return true;
        const day = avail[ds];
        if (day && day.isAvailable === false) return true;
        if (isPrivate) return false;
        return (day ? day.remaining : maxCap) < pax;
    };
    const day2Blocked = (d: Date) => {
        if (d < today0()) return true;
        if (d.getDay() === 0 || d.getDay() === 6) return true;
        const ds = ymd(d);
        if (date && ds === ymd(date)) return true;
        return blockedDates.some((b) => b.date === ds && (b.tour_id === "all" || b.tour_id === "combo_marine"));
    };

    // 인원을 늘려 고른 날짜에 자리가 없어지면 날짜를 비운다
    useEffect(() => {
        if (date && dayBlocked(date)) setDate(undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pax, avail]);
    useEffect(() => {
        if (date2 && date && ymd(date2) === ymd(date)) setDate2(undefined);
    }, [date, date2]);

    // ── 픽업 ──
    const nearest = (lat: number, lng: number): Pick => {
        const r = findClosestPickup(lat, lng, pickups);
        return r ? { location: r.closestLocation, minutes: getWalkingMinutes(r.distanceMeters) } : null;
    };
    const geocode = (address: string, done: (p: Pick) => void) => {
        if (!address || typeof window === "undefined" || !window.google) return;
        new google.maps.Geocoder().geocode({ address }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const loc = results[0].geometry.location;
                done(nearest(loc.lat(), loc.lng()));
            }
        });
    };
    const placeChanged = (ref: React.RefObject<google.maps.places.Autocomplete | null>, setH: (v: string) => void, setP: (p: Pick) => void) => () => {
        const place = ref.current?.getPlace();
        if (!place) return;
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        if (lat && lng) {
            setH(place.name || "");
            setP(nearest(lat, lng));
        } else if (place.name) {
            setH(place.name);
            geocode(place.name, setP);
        }
    };
    const pickupTime = (loc: PickupLocation, tourId: string | null) => {
        if (isPrivate) return "";
        const t = tourId === "morning1" ? loc.time_1 : tourId === "morning2" ? loc.time_2 : tourId === "sunset" ? loc.time_3 : null;
        return t ? ampm(t) : "";
    };
    const pickupName = (loc: PickupLocation) => getPickupDisplayNameByLang(loc.name, lang);

    // ── 금액 ──
    const priceRow = row;
    const needsOption = isCombo && !comboOption;
    const base = priceRow && !needsOption ? basePrice(priceRow, currency, { adultCount: adult, childCount: child }, comboOption ?? undefined) : null;
    const total = base !== null && priceRow ? grossUp(base, currency, resolveExchangeRate(priceRow)) : null;
    const fee = base !== null && total !== null ? total - base : null;
    const unit = (type: "adult" | "child") => {
        if (!priceRow) return 0;
        return basePrice(priceRow, currency, { adultCount: type === "adult" ? 1 : 0, childCount: type === "child" ? 1 : 0 }, comboOption ?? undefined);
    };
    const m = (n: number) => fmtMoney(n, currency);

    // ── 검증 · 결제 ──
    const validate = (): Record<string, string> => {
        const e: Record<string, string> = {};
        if (!def) { e.tour = tr("bookingModal.alert_selectTour"); return e; }
        if (def.key === "turtle" && !sessionId) e.session = s.err.session;
        if (isCombo && !comboOption) e.combo = s.err.combo;
        if (isCombo && !comboTime) e.session = s.err.session;
        if (adult < 1) e.pax = s.err.pax;
        if (!date) e.date = s.err.date;
        if (isCombo && !date2) e.date2 = s.err.date2;
        if (isCombo && !pick2?.location?.id && !hotel2.trim()) e.hotel2 = s.err.pick2;
        if (!pick?.location?.id && !hotel.trim()) e.hotel = s.err.hotel;
        if (!name.trim()) e.name = s.err.name;
        if (!EMAIL_RE.test(email.trim())) e.email = s.err.email;
        if (phone.trim().length < 10) e.phone = s.err.phone;
        return e;
    };

    const pay = async () => {
        setBanner(null);
        const e = validate();
        setErrors(e);
        const first = Object.keys(e)[0];
        if (first) {
            setBanner(e[first]);
            document.getElementById(`bk-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectedTour,
                    pickupLocationId: pick?.location?.id,
                    pickupLocationName: pick?.location?.name || "",
                    secondaryPickupLocationId: pick2?.location?.id,
                    secondaryPickupLocationName: isCombo ? pick2?.location?.name || hotel2 || undefined : undefined,
                    comboTimeOption: isCombo ? comboTime : undefined,
                    tourDate: ymd(date!),
                    adultCount: adult,
                    childCount: child,
                    hotelName: hotel,
                    bookerName: name.trim(),
                    bookerEmail: email.trim(),
                    bookerPhone: phone.trim(),
                    secondaryDate: isCombo && date2 ? ymd(date2) : null,
                    comboOption: isCombo ? comboOption : null,
                    lang,
                    currency,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
                return;
            }
            setBanner(s.err.pay + (data.error || "Unknown error"));
        } catch (err) {
            console.error(err);
            setBanner(s.err.server);
        }
        setSubmitting(false);
    };

    // ── 조각 ──
    const priceOf = (d: TourDef) => {
        const r = activeRows(d, tourSettings)[0];
        if (!r) return "";
        const v = basePrice(r, currency, { adultCount: 1, childCount: 0 }, "1");
        return d.key === "private" ? (lang === "en" ? `From ${m(v)}` : `${m(v)} ~`) : m(v);
    };
    const subOf = (d: TourDef) => {
        const rs = activeRows(d, tourSettings);
        if (d.key === "turtle") return rs.map((r) => `${sessionLabel(r, lang)} ${sessionRange(r)}`).join(lang === "en" ? " / " : " · ");
        if (d.key === "sunset") return lang === "en" ? "Time varies by season" : "시즌별 시간 변동";
        if (d.key === "combo") return lang === "en" ? "Parasail/Jet 9:30-2:00" : "패러/제트 9:30-2:00";
        if (d.key === "private") return lang === "en" ? "2 hours" : "2시간";
        return "";
    };
    const errText = (k: string) => errors[k] ? <p className="err">{errors[k]}</p> : null;
    const paxLabel = isFlat ? s.paxTotal(pax) : lang === "en" ? s.paxVal(adult, child) : child ? `성인 ${adult}명 · 아동 ${child}명` : `성인 ${adult}명`;
    const dateLabel = (d?: Date) => d ? `${format(d, "yyyy-MM-dd")} (${S[lang].dows[d.getDay()]})` : "-";
    const shortDate = (d?: Date) => d ? `${format(d, "MM-dd")} (${S[lang].dows[d.getDay()]})` : "-";
    const sessionText = (id: string | null) => {
        const r = tourSettings.find((t) => t.tour_id === id);
        return r ? `${sessionLabel(r, lang)} ${sessionRange(r)}` : "";
    };
    const timeText = def?.key === "turtle" ? sessionText(sessionId)
        : row?.start_time && !isPrivate ? `${shiftTime(row.start_time, 0)}-${shiftTime(row.end_time, 0)}` : "";

    const hotelBlock = (which: 1 | 2) => {
        const h = which === 1 ? hotel : hotel2;
        const setH = which === 1 ? setHotel : setHotel2;
        const p = which === 1 ? pick : pick2;
        const setP = which === 1 ? setPick : setPick2;
        const ch = which === 1 ? choosing : choosing2;
        const setCh = which === 1 ? setChoosing : setChoosing2;
        const ref = which === 1 ? ac1 : ac2;
        const tourForTime = which === 1 ? (isCombo ? comboTime : selectedTour) : null;
        const input = (
            <input
                id={`bk-hotel${which === 2 ? "2" : ""}`}
                className="in"
                type="text"
                value={h}
                autoComplete="off"
                placeholder={tr("bookingModal.hotel_placeholder")}
                onChange={(e) => setH(e.target.value)}
                onBlur={(e) => geocode(e.target.value, (np) => np && setP(np))}
            />
        );
        return (
            <>
                <div className="f">
                    <label htmlFor={`bk-hotel${which === 2 ? "2" : ""}`}>{tr("bookingModal.hotel_label")}</label>
                    {isLoaded ? <Autocomplete onLoad={(a) => { ref.current = a; }} onPlaceChanged={placeChanged(ref, setH, setP)}>{input}</Autocomplete> : input}
                    <p className="help">{tr("bookingModal.hotel_helper")}</p>
                    {errText(which === 1 ? "hotel" : "hotel2")}
                </div>
                {p && !ch ? (
                    <div className="pick">
                        <Pin size={18} />
                        <span className="pk">
                            <i>{s.pickup}</i>
                            <u>{pickupName(p.location)}{pickupTime(p.location, tourForTime) && ` · ${pickupTime(p.location, tourForTime)}`}</u>
                        </span>
                        <button type="button" onClick={() => setCh(true)}>{s.other}</button>
                    </div>
                ) : (
                    <div className="f">
                        <label htmlFor={`bk-pick${which}`}>{tr("bookingModal.pickup_label")}</label>
                        <select
                            id={`bk-pick${which}`}
                            className="in"
                            value={p?.location?.id || ""}
                            onChange={(e) => {
                                const loc = pickups.find((l) => l.id === e.target.value);
                                if (loc) { setP({ location: loc, minutes: 0 }); setCh(false); }
                            }}
                        >
                            <option value="" disabled>{tr("bookingModal.pickup_placeholder")}</option>
                            {pickups.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {pickupName(l)}{pickupTime(l, tourForTime) ? ` (${pickupTime(l, tourForTime)})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {which === 1 && isPrivate && <p className="help strong">{s.privateNote}</p>}
            </>
        );
    };

    const summaryRows: [string, string][] = !def ? [] : isCombo ? [
        [s.option, comboOption ? `${COMBO_OPTS.find((o) => o.id === comboOption)!.short[lang]} ($${COMBO_OPTS.find((o) => o.id === comboOption)!.usd})` : "-"],
        [s.pax, paxLabel],
        [s.snorkelDate, date ? `${shortDate(date)} ${comboTime ? sessionLabel(tourSettings.find((t) => t.tour_id === comboTime)!, lang) : ""}` : "-"],
        [s.snorkelPick, pick ? pickupName(pick.location) : hotel || "-"],
        [s.paraDate, shortDate(date2)],
        [s.paraPick, pick2 ? pickupName(pick2.location) : hotel2 || "-"],
    ] : [
        [s.date, dateLabel(date)],
        ...(timeText ? [[s.time, timeText] as [string, string]] : []),
        [s.pax, paxLabel],
        [s.pickup, pick ? pickupName(pick.location) : hotel || "-"],
    ];

    const lines: [string, number][] = base === null ? [] : isPrivate ? [[`${s.team} (${s.personLine(pax)})`, base]]
        : isCombo ? [[`${s.personLine(pax)} × ${m(unit("adult"))}`, base]]
        : isFlat ? [[s.team, base]]
        : [
            [`${s.adultLine(adult)} × ${m(unit("adult"))}`, adult * unit("adult")],
            ...(child ? [[`${s.childLine(child)} × ${m(unit("child"))}`, child * unit("child")] as [string, number]] : []),
        ];

    const payBtn = !def
        ? <p className="pay wait" role="status">{s.pickFirst}</p>
        : <button type="button" className="pay" onClick={pay} disabled={submitting}>{submitting ? tr("bookingModal.waiting") : tr("bookingModal.checkout_btn")} {!submitting && <Arrow size={16} />}</button>;
    const curBtns = (
        <div className="cur" role="radiogroup" aria-label={lang === "en" ? "Currency" : "결제 통화"}>
            {(["KRW", "USD"] as Currency[]).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={currency === c} className={currency === c ? "on" : undefined} onClick={() => setCurrency(c)}>{c}</button>
            ))}
        </div>
    );
    const safe = <p className="safe"><Shield /><span>{tr("bookingModal.safe_notice")}</span></p>;
    const bannerEl = banner && <p className="bk-banner" role="alert">{banner}</p>;

    return (
        <div className="bk-root" role="dialog" aria-modal="true" aria-labelledby="bk-title">
            <div className="bk-scrim" onClick={onClose} />
            <div className="bk-modal">
                <div className="m-top">
                    <h1 id="bk-title">{tr("bookingModal.title")}</h1>
                    <button type="button" className="x" ref={closeRef} onClick={onClose} aria-label={s.close}><Close /></button>
                </div>
                <div className="bk-cols">
                    <div className="left">
                        {/* 투어 선택 */}
                        <div className="grp" id="bk-tour">
                            <div className="glab"><b>{tr("bookingModal.step1")}</b>{!def && <i>{s.perAdultHead}</i>}</div>
                            {def ? (
                                <div className="chip">
                                    <img src={def.img} alt="" width={50} height={50} />
                                    <span className="cht">
                                        <b>{def.name[lang]}</b>
                                        <i>{isCombo ? s.twoDays : subOf(def)}</i>
                                    </span>
                                    <button type="button" className="chg" onClick={() => setTourKey(undefined)}>{s.change}</button>
                                </div>
                            ) : (
                                <ul className="tours">
                                    {tours.map((d) => (
                                        <li key={d.key}>
                                            <button type="button" className="t" onClick={() => setTourKey(d.key)}>
                                                <img src={d.img} alt="" width={42} height={42} />
                                                <span className="tt"><b>{d.name[lang]}</b><i>{subOf(d)}</i></span>
                                                <span className="pr"><em className="n">{priceOf(d)}</em><u>{d.key === "private" ? s.teamFare : s.perAdult}</u></span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {errText("tour")}
                        </div>

                        {isCombo && (
                            <div className="grp" id="bk-combo">
                                <div className="glab"><b>{s.comboH}</b></div>
                                <ul className="opts">
                                    {COMBO_OPTS.map((o) => (
                                        <li key={o.id}>
                                            <button type="button" className={`opt${comboOption === o.id ? " on" : ""}`} aria-pressed={comboOption === o.id} onClick={() => setComboOption(o.id)}>
                                                <span>{o[lang]}</span><em>${o.usd}</em>{comboOption === o.id && <Check size={18} />}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {errText("combo")}
                            </div>
                        )}

                        {(def?.key === "turtle" || isCombo) && morningRows.length > 0 && (
                            <div className="grp" id="bk-session">
                                <div className="glab"><b>{s.sessionH}</b><i>{s.pickupIncl}</i></div>
                                <ul className="opts two-up">
                                    {morningRows.map((r) => {
                                        const on = (isCombo ? comboTime : sessionId) === r.tour_id;
                                        return (
                                            <li key={r.tour_id}>
                                                <button type="button" className={`opt${on ? " on" : ""}`} aria-pressed={on} onClick={() => (isCombo ? setComboTime(r.tour_id) : setSessionId(r.tour_id))}>
                                                    <span>{sessionLabel(r, lang)}</span><em>{ampm(shiftTime(r.start_time, -30))}</em>{on && <Check size={18} />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {errText("session")}
                            </div>
                        )}

                        {/* 인원 */}
                        <div className="grp" id="bk-pax">
                            <div className="glab"><b>{tr("bookingModal.step2")}</b><i>{isPrivate ? s.privatePax : s.free}</i></div>
                            <div className={`pax${isFlat ? " one" : ""}`}>
                                <Stepper label={isFlat ? tr("bookingModal.totalPax") : tr("bookingModal.adultPax")} value={adult} min={1}
                                    max={isFlat ? row?.max_capacity || 40 : 99} onChange={setAdult}
                                    sub={isFlat ? tr("bookingModal.maxPax_notice").replace("{max}", String(row?.max_capacity || 40)) : undefined} />
                                {!isFlat && (
                                    <Stepper label={tr("bookingModal.childPax")} value={child} min={0} max={99} onChange={setChild}
                                        sub={def && !isCombo && unit("child") ? `${m(unit("child"))} / ${lang === "en" ? "child" : "1인"}` : undefined} />
                                )}
                            </div>
                            {errText("pax")}
                        </div>

                        {/* 날짜 (+ 콤보는 활동별 날짜·픽업) */}
                        {def && !isCombo && (
                            <div className="grp" id="bk-date">
                                <div className="glab"><b>{tr("bookingModal.step3")}</b></div>
                                <Calendar lang={lang} month={month} setMonth={setMonth} selected={date} onSelect={setDate} blocked={dayBlocked}
                                    loading={loadingAvail} recalc={(n) => s.recalc(isFlat ? s.paxTotal(pax) : paxLabel, month.getMonth() + 1, n)} />
                                {errText("date")}
                            </div>
                        )}

                        {def && !isCombo && (
                            <div className="grp">
                                <div className="glab"><b>{tr("bookingModal.step4")}</b></div>
                                {hotelBlock(1)}
                                {bookerFields()}
                            </div>
                        )}

                        {isCombo && (
                            <>
                                <div className="grp" id="bk-date">
                                    <div className="glab"><b>{s.datesPickup}</b><i>{s.perActivity}</i></div>
                                    <div className="act">
                                        <div className="ahead"><span className="ano">1</span><b>{s.snorkel}</b><i>{sessionText(comboTime)}</i></div>
                                        <div className="abody">
                                            <Calendar lang={lang} month={month} setMonth={setMonth} selected={date} onSelect={setDate} blocked={dayBlocked}
                                                loading={loadingAvail} recalc={(n) => s.recalc(paxLabel, month.getMonth() + 1, n)} />
                                            {errText("date")}
                                            <div className="asub">{hotelBlock(1)}</div>
                                        </div>
                                    </div>
                                    <div className="act" id="bk-date2">
                                        <div className="ahead"><span className="ano">2</span><b>{s.para}</b><i>{s.noWeekend}</i></div>
                                        <div className="abody">
                                            <p className="recalc">{s.clash(date ? (lang === "en" ? format(date, "MMM d") : `${date.getMonth() + 1}월 ${date.getDate()}일`) : "")}</p>
                                            <Calendar lang={lang} month={month2} setMonth={setMonth2} selected={date2} onSelect={setDate2} blocked={day2Blocked}
                                                clash={date} />
                                            {errText("date2")}
                                            <div className="asub">{hotelBlock(2)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grp">
                                    <div className="glab"><b>{s.booker}</b></div>
                                    {bookerFields()}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 요약 레일 (데스크탑) */}
                    <aside className="side">
                        {def ? (
                            <>
                                <div className="s-tour"><img src={def.img} alt="" width={52} height={52} /><b>{def.name[lang]}</b></div>
                                <ul className="s-list">{summaryRows.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}</ul>
                                <div className="s-rule" />
                                <ul className="s-sum">
                                    {lines.map(([k, v]) => <li key={k}><span>{k}</span><b className="n">{m(v)}</b></li>)}
                                    {fee !== null && fee > 0 && <li><span>{s.fee}</span><b className="n">{m(fee)}</b></li>}
                                </ul>
                            </>
                        ) : (
                            <div className="s-empty">{s.emptySide}</div>
                        )}
                        <div className="s-total"><span>{tr("bookingModal.total_payment")}</span><b className="n">{total !== null ? m(total) : "-"}</b></div>
                        {total !== null && <p className="s-note">{s.feeNote}</p>}
                        {curBtns}
                        {bannerEl}
                        {payBtn}
                        {safe}
                    </aside>
                </div>

                {/* 결제 막대 (모바일) */}
                <div className="bar">
                    {bannerEl}
                    <div className="bline"><span>{tr("bookingModal.total_payment")}</span><b className="n">{total !== null ? m(total) : "-"}</b></div>
                    {def && <p className="bsub">{def.name[lang]}{date ? ` · ${dateLabel(date)}` : ""} {paxLabel}</p>}
                    {curBtns}
                    {payBtn}
                    {safe}
                </div>
            </div>
        </div>
    );

    // 컴포넌트가 아니라 함수로 부른다. 컴포넌트로 두면 렌더마다 새 타입이 돼 입력 칸이 포커스를 잃는다.
    function bookerFields() {
        return (
            <>
                <div className="two">
                    <div className="f">
                        <label htmlFor="bk-name">{tr("bookingModal.name_label")}</label>
                        <input id="bk-name" className="in" type="text" autoComplete="name" value={name} placeholder={s.namePh} onChange={(e) => setName(e.target.value)} />
                        {errText("name")}
                    </div>
                    <div className="f">
                        <label htmlFor="bk-email">{tr("bookingModal.email_label")}</label>
                        <input id="bk-email" className="in" type="email" autoComplete="email" value={email} placeholder="example@email.com" onChange={(e) => setEmail(e.target.value)} />
                        {errText("email")}
                    </div>
                </div>
                <div className="f">
                    <label htmlFor="bk-phone">{tr("bookingModal.phone_label")}</label>
                    <input id="bk-phone" className="in" type="text" autoComplete="tel" value={phone} placeholder={s.phonePh} onChange={(e) => setPhone(e.target.value)} />
                    {errText("phone")}
                </div>
            </>
        );
    }
}

function Stepper({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
    return (
        <div className="prow">
            <span className="plab"><b>{label}</b>{sub && <i>{sub}</i>}</span>
            <span className="stepper">
                <button type="button" className={`stp${value <= min ? " off" : ""}`} disabled={value <= min} aria-label={`${label} -1`} onClick={() => onChange(Math.max(min, value - 1))}><Minus /></button>
                <b className="n" aria-live="polite">{value}</b>
                <button type="button" className={`stp${value >= max ? " off" : ""}`} disabled={value >= max} aria-label={`${label} +1`} onClick={() => onChange(Math.min(max, value + 1))}><Plus /></button>
            </span>
        </div>
    );
}

function Calendar({
    lang, month, setMonth, selected, onSelect, blocked, loading, recalc, clash,
}: {
    lang: Lang; month: Date; setMonth: (d: Date) => void; selected?: Date; onSelect: (d: Date) => void;
    blocked: (d: Date) => boolean; loading?: boolean; recalc?: (n: number) => React.ReactNode; clash?: Date;
}) {
    const s = S[lang];
    const first = startOfMonth(month);
    const days = getDaysInMonth(first);
    const now = startOfMonth(new Date());
    const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
    const open = cells.filter((d): d is Date => !!d && !blocked(d)).length;
    const years = [now.getFullYear(), now.getFullYear() + 1];
    const canPrev = !isSameMonth(first, now) && first > now;
    const setYM = (y: number, mo: number) => {
        const d = new Date(y, mo, 1);
        setMonth(d < now ? now : d);
    };
    return (
        <>
            {recalc && !loading && <p className="recalc">{recalc(open)}</p>}
            <div className={`cal${loading ? " loading" : ""}`}>
                <div className="cmon">
                    <span className="sels">
                        <label className="sel">
                            <span className="sr">{lang === "en" ? "Year" : "연도"}</span>
                            <select value={first.getFullYear()} onChange={(e) => setYM(Number(e.target.value), first.getMonth())}>
                                {years.map((y) => <option key={y} value={y}>{s.year(y)}</option>)}
                            </select>
                            <Chevron dir="down" size={14} />
                        </label>
                        <label className="sel">
                            <span className="sr">{lang === "en" ? "Month" : "월"}</span>
                            <select value={first.getMonth()} onChange={(e) => setYM(first.getFullYear(), Number(e.target.value))}>
                                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{s.month(i + 1)}</option>)}
                            </select>
                            <Chevron dir="down" size={14} />
                        </label>
                    </span>
                    <span className="mnav">
                        <button type="button" className="marr" aria-label={s.prev} disabled={!canPrev} onClick={() => setMonth(addMonths(first, -1))}><Chevron dir="left" /></button>
                        <button type="button" className="marr" aria-label={s.next} onClick={() => setMonth(addMonths(first, 1))}><Chevron /></button>
                    </span>
                </div>
                <div className="cgrid" role="grid">
                    {s.dows.map((d) => <span key={d} className="dow">{d}</span>)}
                    {cells.map((d, i) => {
                        if (!d) return <span key={`e${i}`} className="d" />;
                        const isClash = !!clash && ymd(d) === ymd(clash);
                        const no = blocked(d);
                        const on = !!selected && ymd(d) === ymd(selected);
                        const label = lang === "en" ? format(d, "MMMM d") : `${d.getMonth() + 1}월 ${d.getDate()}일`;
                        if (isClash) {
                            return (
                                <span key={i} className="d clash" aria-label={`${label} ✕`}>
                                    <i><svg viewBox="0 0 34 34" aria-hidden><path d="M9 9l16 16M25 9L9 25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></i>
                                    <em>{d.getDate()}</em>
                                </span>
                            );
                        }
                        return (
                            <button key={i} type="button" className={`d${no ? " no" : ""}${on ? " on" : ""}`} disabled={no} aria-pressed={on} aria-label={label} onClick={() => onSelect(d)}>
                                {d.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
