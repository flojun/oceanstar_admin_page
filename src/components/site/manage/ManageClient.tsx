"use client";

/**
 * 내 예약 관리 (캔버스 Manage · ManageDetail · ManageCancel). 흐름과 API 는 운영 중이던
 * src/components/booking/ManageBookingClient.tsx 그대로다.
 *   1. 조회   POST /api/verify-booking (예약번호 + 이메일)
 *   2. 변경   투어 7일 전(하와이 시각)까지 날짜·픽업 직접 변경 → POST /api/reschedule
 *   3. 취소   규정 확인·동의 → POST /api/cancel (취소 '요청', 관리자 확인 후 처리)
 * 달라진 점: 알림창(alert) 대신 화면 안에 결과를 보이고, 취소 확인 창 두 번을 한 창으로 줄였다(캔버스).
 * 7일 안쪽의 '카카오톡으로 문의' 버튼은 실제 채널로 연결했다(전에는 누를 곳이 없었다).
 */
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { addMonths, format, getDaysInMonth, startOfMonth, subDays } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { findClosestPickup, getWalkingMinutes, type PickupLocation } from "@/lib/utils";
import { getTourNameByLang, type TourSetting } from "@/lib/tourUtils";
import type { BlockedDate } from "@/lib/siteData";
import { getPickupDisplayNameByLang } from "@/constants/pickupLocations";
import { EXTERNAL } from "../links";
import { TOURS, ampm, type Lang } from "../tours";

const libraries: "places"[] = ["places"];
const svg = (p: React.ReactNode, size = 18, sw = 1.8) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{p}</svg>
);
const I_CHECK = svg(<path d="M5 12.5l4.2 4.2L19 7" />, 16, 2.2);
const I_X = svg(<path d="M6 6l12 12M18 6L6 18" />, 18, 2);
const I_LEFT = svg(<path d="M15 5l-7 7 7 7" />, 16, 2);
const I_RIGHT = svg(<path d="M9 5l7 7-7 7" />, 16, 2);
const I_CLOCK = svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.3V12l3.2 1.9" /></>, 18, 1.7);
const I_PIN = svg(<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>, 20, 1.7);
const I_CHAT = svg(<path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z" />);
const I_SWAP = svg(<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />);
const I_ALERT = svg(<><path d="M12 4l9 16H3z" /><path d="M12 10v4.5M12 17.2v.3" /></>);
const I_ARROW = svg(<path d="M7 17L17 7M17 7H9M17 7v8" />, 15, 1.7);
const IC = {
    cal: svg(<><rect x="3.6" y="5.2" width="16.8" height="15" rx="2" /><path d="M3.6 10h16.8M8 3.4v3.6M16 3.4v3.6M8 14h2M14 14h2M8 17h2" /></>, 24, 1.7),
    check: svg(<><circle cx="12" cy="12" r="8.6" /><path d="M8.2 12.3l2.6 2.6 5-5.2" /></>, 24, 1.7),
    guide: svg(<><circle cx="9" cy="7.4" r="3.2" /><path d="M3 20.2a6 6 0 0 1 12 0" /><path d="M17.6 3.6v9.4M17.6 3.6h3.6l-1.2 2.1 1.2 2.1h-3.6" /></>, 24, 1.7),
};

const T = {
    ko: {
        fH: "예약 조회", fP: "예약 정보 보호를 위해 예약 번호와 이메일을 입력해 주세요.",
        resNum: "예약 번호 (영숫자 6자리)", resPh: "예: MA7MY5", email: "이메일 주소", emailPh: "예약 시 입력한 이메일", submit: "예약 조회하기", searching: "조회 중...",
        fHelp: "예약 번호는 예약 확정 후 받으신 바우처(메일 · 카카오톡)에 있어요.", fLost: "예약 번호를 잊으셨나요?", fLostA: "카카오톡으로 문의",
        canH: "여기서 할 수 있는 일",
        can: [["cal", "날짜 · 픽업 장소 변경", "투어 7일 전까지 수수료 없이 직접 바꿀 수 있어요."], ["check", "예약 상태 확인", "예약확정 · 취소요청 같은 진행 상황을 바로 봐요."], ["guide", "예약 취소", "규정을 확인하고 바로 취소를 요청할 수 있어요."]] as const,
        ruleH: "취소 · 환불 규정", ruleNote: "하와이 현지 시각 기준",
        refund: [["여행 7일 전까지", "전액 환불", "ok"], ["여행 6~3일 전", "요금의 50% 공제", "mid"], ["여행 2일 전 ~ 당일", "취소 · 환불 불가", "no"]] as const,
        bkNo: "예약 번호", rowTour: "투어", rowDate: "날짜", rowPax: "인원", rowPick: "픽업", rowName: "예약자",
        daysLeft: (n: number) => n > 0 ? `투어 ${n}일 전` : n === 0 ? "오늘" : "지난 투어", pax: (n: number) => `${n}명`,
        pickTime: (t: string) => `${t} 픽업`,
        actH: "예약 변경 · 취소",
        notice: (d: string) => <><b>{d}까지</b> 날짜와 픽업 장소를 수수료 없이 직접 바꿀 수 있어요.</>,
        noticeS: "그 뒤로는 카카오톡 채널로 문의해 주세요. (하와이 현지 시각 기준)",
        noticeLate: <>투어 7일 안쪽이라 <b>날짜 · 픽업 변경은 카카오톡 채널로</b> 문의해 주세요.</>,
        reschedBtn: "날짜 · 픽업 장소 변경", cancelLink: "예약 취소", kakao: "카카오톡으로 문의",
        within: ["투어 7일 안쪽이면", "변경 버튼 대신 카카오톡 문의 버튼이 보여요."],
        rsH: "날짜 · 픽업 장소 변경", rsP: "바꿀 것만 고르세요. 관리자 확인 후 최종 확정됩니다.",
        dateH: "새로운 투어 날짜", dows: ["일", "월", "화", "수", "목", "금", "토"], month: (d: Date) => format(d, "yyyy년 M월"),
        legend: [["cur", "지금 예약일"], ["sel", "새로 고른 날"], ["off", "예약 불가"]] as const,
        pickH: "픽업 장소", hotelLabel: "머무시는 숙소 (구글 자동완성)", hotelPh: "머무시는 숙소/호텔 주소 입력",
        recTag: "가까운 픽업 장소", walk: (m: number) => `걸어서 약 ${m}분`, pickSel: "픽업 장소 직접 고르기", pickPh: "가까운 장소가 추천되거나 직접 골라주세요",
        sumH: "변경 내용", pickSame: (p: string) => `픽업 장소는 그대로 (${p})`, pickNew: (p: string) => `픽업 장소 → ${p}`,
        back: "돌아가기", submitRs: "변경 신청하기", submitting: "신청 중...",
        cH: "예약 취소", cP: "취소 전에 아래 환불 규정을 꼭 확인해 주세요.", cNow: (n: number) => `지금 취소하면 · 투어 ${n}일 전`,
        cBig: ["전액 환불", "요금의 50% 공제 후 환불", "취소 · 환불 불가"],
        cRule: "여행일은 하와이 현지 시각 기준입니다. 본 상품은 국외여행 표준약관 제6조(특약)에 따라 일반 소비자분쟁해결기준과 다른 취소수수료가 적용됩니다.",
        agree: "위 규정을 확인했고, 취소에 동의합니다.", cGo: "취소 요청하기", cGoing: "요청 중...", cFinal: "취소 요청은 되돌릴 수 없어요. 관리자 확인 후 처리됩니다.", close: "닫기",
        statusMap: { 예약확정: "예약확정", 취소요청: "취소요청" } as Record<string, string>,
        okCancel: "취소 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.",
        okResched: (d: string, l: string) => `변경 신청이 접수되었습니다. (${d} · ${l}) 관리자 확인 후 확정됩니다.`,
        errNotFound: "일치하는 예약 정보가 없습니다. 예약 번호와 이메일을 확인해주세요.", errLookup: "조회 중 오류가 발생했습니다.",
        errNet: "통신 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", errPickDate: "새로운 날짜를 선택해주세요.", errGeneric: "처리 중 문제가 발생했습니다.",
        errName: "예약자명 정보가 누락되었습니다. 새로고침 후 다시 시도해주세요.", other: "다른 예약 조회",
    },
    en: {
        fH: "Find your booking", fP: "Please enter your booking number and email to protect your information.",
        resNum: "Booking Number (6 Alphanumerics)", resPh: "e.g., MA7MY5", email: "Email Address", emailPh: "Email entered during booking", submit: "Search Booking", searching: "Searching...",
        fHelp: "Your booking number is on the voucher we sent after confirmation (email or WhatsApp).", fLost: "Forgot your booking number?", fLostA: "Email us",
        canH: "What you can do here",
        can: [["cal", "Change date or pickup", "Free of charge, up to 7 days before your tour."], ["check", "Check your status", "See whether it is confirmed or a cancellation is pending."], ["guide", "Cancel your booking", "Review the policy and request a cancellation."]] as const,
        ruleH: "Cancellation & refund", ruleNote: "Based on Hawaii time",
        refund: [["7+ days before", "100% refund", "ok"], ["3-6 days before", "50% refund", "mid"], ["2 days or less", "No refund", "no"]] as const,
        bkNo: "Booking number", rowTour: "Tour", rowDate: "Date", rowPax: "Guests", rowPick: "Pickup", rowName: "Booker",
        daysLeft: (n: number) => n > 0 ? `${n} days left` : n === 0 ? "Today" : "Past tour", pax: (n: number) => `${n} guest${n === 1 ? "" : "s"}`,
        pickTime: (t: string) => `${t} pickup`,
        actH: "Change or cancel",
        notice: (d: string) => <>You can change the date and pickup yourself, free of charge, <b>until {d}</b>.</>,
        noticeS: "After that, please contact us via KakaoTalk or WhatsApp. (Hawaii time)",
        noticeLate: <>Your tour is within 7 days. <b>Please contact us</b> to change the date or pickup.</>,
        reschedBtn: "Change date or pickup", cancelLink: "Cancel booking", kakao: "Contact us",
        within: ["Within 7 days of the tour", "a contact button replaces the change button."],
        rsH: "Change date or pickup", rsP: "Pick only what you want to change. It is final after our team confirms.",
        dateH: "New tour date", dows: ["S", "M", "T", "W", "T", "F", "S"], month: (d: Date) => format(d, "MMMM yyyy"),
        legend: [["cur", "Current date"], ["sel", "New date"], ["off", "Unavailable"]] as const,
        pickH: "Pickup location", hotelLabel: "Your hotel (Google autocomplete)", hotelPh: "Please enter your hotel address",
        recTag: "Closest pickup", walk: (m: number) => `About a ${m} minute walk`, pickSel: "Choose a pickup spot", pickPh: "Nearby location will be suggested or pick manually",
        sumH: "Your change", pickSame: (p: string) => `Pickup stays the same (${p})`, pickNew: (p: string) => `New pickup → ${p}`,
        back: "Go back", submitRs: "Request change", submitting: "Submitting...",
        cH: "Cancel booking", cP: "Please review the refund policy below before you cancel.", cNow: (n: number) => `If you cancel now · ${n} days before`,
        cBig: ["Full refund", "50% refund", "No refund"],
        cRule: "Tour dates are based on local Hawaii time.",
        agree: "I have read the policy above and agree to cancel.", cGo: "Request cancellation", cGoing: "Requesting...", cFinal: "A cancellation request can't be undone. Our team will process it after review.", close: "Close",
        statusMap: { 예약확정: "Confirmed", 취소요청: "Cancellation requested" } as Record<string, string>,
        okCancel: "Your cancellation request has been received. Our team will process it after review.",
        okResched: (d: string, l: string) => `Your change request has been received (${d} · ${l}). It is final after our team confirms.`,
        errNotFound: "No matching booking found. Please check your booking number and email.", errLookup: "An error occurred during lookup.",
        errNet: "A network error occurred. Please try again shortly.", errPickDate: "Please pick a new date.", errGeneric: "Something went wrong.",
        errName: "Booker name is missing. Please refresh and try again.", other: "Look up another booking",
    },
};

/** 캔버스처럼 '와이키키 거북이 스노클링 · 1부'. 상품 목록에 없는 옵션은 예전 이름 규칙 그대로 */
function tourLabel(tourId: string, option: string, lang: Lang) {
    const def = TOURS.find((t) => t.tourIds.includes(tourId));
    if (!def) return getTourNameByLang(tourId, option, lang);
    if (def.key !== "turtle") return def.name[lang];
    const n = tourId === "morning2" ? 2 : 1;
    return `${def.name[lang]} · ${lang === "en" ? `Session ${n}` : `${n}부`}`;
}

type Booking = {
    tourId: string; tourDate: Date; tourDateStr: string; tourName: string; guests: number;
    pickupLocation: string; status: string; name: string;
};

/** 하와이 오늘 기준 며칠 남았나 (기존 로직) */
function daysUntil(dateStr: string) {
    const hn = new Date(new Date().toLocaleString("en-US", { timeZone: "Pacific/Honolulu" }));
    const today = new Date(hn.getFullYear(), hn.getMonth(), hn.getDate());
    const d = dateStr.match(/\d+/g);
    if (!d || d.length < 3) return 0;
    return Math.round((new Date(+d[0], +d[1] - 1, +d[2]).getTime() - today.getTime()) / 86400000);
}
/** 하와이 시각으로 투어 당일 0시까지 남은 시간 (기존 로직) */
function hoursUntil(date: Date) {
    const hn = new Date(new Date().toLocaleString("en-US", { timeZone: "Pacific/Honolulu" }));
    const start = new Date(`${format(date, "yyyy-MM-dd")}T00:00:00-10:00`);
    return (start.getTime() - hn.getTime()) / 3600000;
}

export default function ManageClient({ lang, tourSettings, blockedDates }: { lang: Lang; tourSettings: TourSetting[]; blockedDates: BlockedDate[] }) {
    const t = T[lang];
    const [resNumber, setResNumber] = useState("");
    const [email, setEmail] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [bk, setBk] = useState<Booking | null>(null);
    const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
    const [pickups, setPickups] = useState<PickupLocation[]>([]);
    const [rescheduling, setRescheduling] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    useEffect(() => {
        fetch("/api/pickup").then((r) => r.json()).then((d) => Array.isArray(d) && setPickups(d)).catch((e) => console.error("Failed to fetch pickup locations", e));
    }, []);

    const verify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resNumber || !email) return;
        setMsg(null);
        setVerifying(true);
        try {
            const res = await fetch("/api/verify-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id: resNumber.trim().toUpperCase(), booker_email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.reservation) {
                setMsg({ kind: "err", text: data.error || t.errNotFound });
                return;
            }
            const r = data.reservation;
            let guests = 0;
            if (r.pax) guests = (r.pax.match(/\d+/g) ?? []).reduce((a: number, v: string) => a + parseInt(v, 10), 0);
            if (!guests) guests = 1;
            const option: string = r.option || "거북이 스노클링";
            // 기존 매핑에 선셋(3부)을 더했다. 전에는 선셋 예약도 1부 자리로 날짜를 거르던 문제가 있었다.
            const tourId = option.includes("1부") ? "morning1" : option.includes("2부") ? "morning2"
                : option.includes("3부") || option.includes("선셋") ? "sunset" : option.includes("단독") || option.includes("프라이빗") ? "private" : "morning1";
            const [y, m, d] = r.tour_date.split("-").map(Number);
            setBk({
                tourId, tourDate: new Date(y, m - 1, d), tourDateStr: r.tour_date, tourName: tourLabel(tourId, option, lang),
                guests, pickupLocation: r.pickup_location || "", status: r.status, name: r.name,
            });
        } catch (err) {
            console.error(err);
            setMsg({ kind: "err", text: t.errLookup });
        } finally {
            setVerifying(false);
        }
    };

    if (!bk) {
        return (
            <section className="mg-body look-w">
                <form className="card look" onSubmit={verify}>
                    <h2>{t.fH}</h2><p className="card-p">{t.fP}</p>
                    <div className="fld"><label htmlFor="mg-oid">{t.resNum}</label>
                        <input id="mg-oid" className="oid" placeholder={t.resPh} maxLength={6} required value={resNumber} autoComplete="off" onChange={(e) => setResNumber(e.target.value.toUpperCase())} /></div>
                    <div className="fld"><label htmlFor="mg-email">{t.email}</label>
                        <input id="mg-email" type="email" placeholder={t.emailPh} required value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} /></div>
                    {msg && <p className={`mg-msg ${msg.kind}`} role="alert">{msg.text}</p>}
                    <button type="submit" className="book-pill go" disabled={verifying}>{verifying ? t.searching : t.submit}</button>
                    <p className="help">{t.fHelp}</p>
                    <p className="lost">{t.fLost} {lang === "ko"
                        ? <a href={EXTERNAL.kakaoChat} target="_blank" rel="noopener noreferrer">{t.fLostA} {I_ARROW}</a>
                        : <a href="mailto:hioceanstar@gmail.com">{t.fLostA} {I_ARROW}</a>}</p>
                </form>
                <aside className="card side">
                    <h3>{t.canH}</h3>
                    <ul className="cans">{t.can.map(([k, h, s]) => <li key={h}><span className="ic">{IC[k]}</span><div><b>{h}</b><span>{s}</span></div></li>)}</ul>
                    <div className="mini"><div className="mini-h"><b>{t.ruleH}</b><span>{t.ruleNote}</span></div><Refund lang={lang} /></div>
                </aside>
            </section>
        );
    }

    const dLeft = daysUntil(bk.tourDateStr);
    const hLeft = hoursUntil(bk.tourDate);
    const refundTier = hLeft >= 168 ? 0 : hLeft >= 72 ? 1 : 2;
    const canReschedule = hLeft >= 168;
    const lastChange = subDays(bk.tourDate, 7);
    const pickRow = pickups.find((p) => p.name === bk.pickupLocation);
    const pickTime = pickRow ? (bk.tourId === "morning1" ? pickRow.time_1 : bk.tourId === "morning2" ? pickRow.time_2 : bk.tourId === "sunset" ? pickRow.time_3 : null) : null;
    const dateText = lang === "en" ? format(bk.tourDate, "EEE, MMM d, yyyy") : `${format(bk.tourDate, "yyyy년 M월 d일")} (${t.dows[bk.tourDate.getDay()]})`;
    const statusText = t.statusMap[bk.status] ?? bk.status;
    const cancelled = /취소|환불/.test(bk.status);

    return (
        <>
            <section className="mg-body det-w">
                <article className="card sum">
                    <div className="sum-h">
                        <div><span className="mlab">{t.bkNo}</span><b className="bno">{resNumber.trim().toUpperCase()}</b></div>
                        <div className="tags">
                            <span className="st">{!cancelled && I_CHECK}{statusText}</span>
                            <span className="dday">{dLeft > 0 ? `D-${dLeft}` : dLeft === 0 ? "D-DAY" : `D+${-dLeft}`}</span>
                        </div>
                    </div>
                    <dl className="rows">
                        <div><dt>{t.rowTour}</dt><dd>{bk.tourName}</dd></div>
                        <div><dt>{t.rowDate}</dt><dd>{dateText} <span className="mg-mt">{t.daysLeft(dLeft)}</span></dd></div>
                        <div><dt>{t.rowPax}</dt><dd>{t.pax(bk.guests)}</dd></div>
                        <div><dt>{t.rowPick}</dt><dd>{getPickupDisplayNameByLang(bk.pickupLocation, lang) || "-"}{pickTime && <span className="mg-mt">{t.pickTime(ampm(pickTime))}</span>}</dd></div>
                        <div><dt>{t.rowName}</dt><dd>{bk.name}</dd></div>
                    </dl>
                </article>
                <aside className="card mact">
                    <h3>{t.actH}</h3>
                    {msg && <p className={`mg-msg ${msg.kind}`} role="status">{msg.text}</p>}
                    <p className="note">{I_CLOCK}<span>
                        {canReschedule ? t.notice(lang === "en" ? format(lastChange, "EEE, MMM d") : `${format(lastChange, "M월 d일")}(${t.dows[lastChange.getDay()]})`) : t.noticeLate}
                        <small>{t.noticeS}</small>
                    </span></p>
                    {!cancelled && (canReschedule ? (
                        <button type="button" className={`book-pill rs${rescheduling ? " on" : ""}`} onClick={() => { setMsg(null); setRescheduling(true); }}>{I_SWAP}{t.reschedBtn}</button>
                    ) : (
                        <a className="book-pill rs" href={EXTERNAL.kakaoChat} target="_blank" rel="noopener noreferrer">{I_CHAT}{t.kakao}</a>
                    ))}
                    {!cancelled && <button type="button" className="cx" onClick={() => setCancelOpen(true)}>{t.cancelLink}</button>}
                    <button type="button" className="cx" onClick={() => { setBk(null); setMsg(null); setRescheduling(false); }}>{t.other}</button>
                </aside>
            </section>
            {rescheduling && canReschedule && (
                <div className="mg-body">
                    <Reschedule lang={lang} bk={bk} resNumber={resNumber} email={email} pickups={pickups} tourSettings={tourSettings} blockedDates={blockedDates}
                        onBack={() => setRescheduling(false)}
                        onDone={(text) => { setRescheduling(false); setMsg({ kind: "ok", text }); }} />
                </div>
            )}
            {cancelOpen && (
                <CancelModal lang={lang} tier={refundTier} daysLeft={dLeft} bk={bk} resNumber={resNumber}
                    onClose={() => setCancelOpen(false)}
                    onDone={(ok, text) => { setCancelOpen(false); setMsg({ kind: ok ? "ok" : "err", text }); if (ok) setBk({ ...bk, status: "취소요청" }); }} />
            )}
        </>
    );
}

function Refund({ lang, now }: { lang: Lang; now?: number }) {
    return (
        <div className="refund">
            {T[lang].refund.map(([w, v, c], i) => <div key={c} className={`rf-c ${c}${now === i ? " here" : ""}`}><span>{w}</span><b>{v}</b></div>)}
        </div>
    );
}

function Reschedule({ lang, bk, resNumber, email, pickups, tourSettings, blockedDates, onBack, onDone }: {
    lang: Lang; bk: Booking; resNumber: string; email: string; pickups: PickupLocation[]; tourSettings: TourSetting[]; blockedDates: BlockedDate[];
    onBack: () => void; onDone: (text: string) => void;
}) {
    const t = T[lang];
    const [month, setMonth] = useState(() => startOfMonth(bk.tourDate));
    const [sel, setSel] = useState<Date | undefined>();
    const [avail, setAvail] = useState<Record<string, { remaining: number; isAvailable: boolean }>>({});
    const [maxCap, setMaxCap] = useState(45);
    const [loading, setLoading] = useState(false);
    const [hotel, setHotel] = useState(bk.pickupLocation);
    const [pick, setPick] = useState<{ location: PickupLocation; minutes: number } | null>(() => {
        const m = pickups.find((p) => p.name === bk.pickupLocation);
        return m ? { location: m, minutes: 0 } : null;
    });
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const acRef = useRef<google.maps.places.Autocomplete | null>(null);
    const { isLoaded } = useJsApiLoader({ id: "google-map-script", googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", libraries });

    const fetchAvail = useCallback(async (m: Date) => {
        setLoading(true);
        try {
            const label = tourSettings.find((s) => s.tour_id === bk.tourId)?.name ?? bk.tourId;
            const res = await fetch(`/api/availability?month=${format(m, "yyyy-MM")}&option=${encodeURIComponent(label)}`);
            const data = await res.json();
            if (data.success) { setAvail(data.availability); setMaxCap(data.maxCapacity); }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [tourSettings, bk.tourId]);
    useEffect(() => { fetchAvail(month); }, [month, fetchAvail]);

    const blocked = (d: Date) => {
        if (d < new Date(new Date().setHours(0, 0, 0, 0))) return true;
        const setting = tourSettings.find((s) => s.tour_id === bk.tourId);
        if (setting?.blocked_days?.includes(d.getDay())) return true;
        const ds = format(d, "yyyy-MM-dd");
        if (blockedDates.some((b) => b.date === ds && (b.tour_id === "all" || b.tour_id === bk.tourId))) return true;
        const day = avail[ds];
        if (day && day.isAvailable === false) return true;
        return (day ? day.remaining : maxCap) < bk.guests;
    };

    const placeChanged = () => {
        const place = acRef.current?.getPlace();
        const lat = place?.geometry?.location?.lat();
        const lng = place?.geometry?.location?.lng();
        if (place && lat && lng) {
            setHotel(place.name || "");
            const r = findClosestPickup(lat, lng, pickups);
            if (r) setPick({ location: r.closestLocation, minutes: getWalkingMinutes(r.distanceMeters) });
        }
    };

    const first = startOfMonth(month);
    const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: getDaysInMonth(first) }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
    const same = (a?: Date, b?: Date) => !!a && !!b && format(a, "yyyy-MM-dd") === format(b, "yyyy-MM-dd");
    const pickTime = (l: PickupLocation) => { const x = bk.tourId === "morning1" ? l.time_1 : bk.tourId === "morning2" ? l.time_2 : null; return x ? ampm(x) : ""; };
    const newPickName = pick?.location?.name || hotel;
    const pickChanged = !!newPickName && newPickName !== bk.pickupLocation;
    const fmt = (d: Date) => lang === "en" ? format(d, "EEE, MMM d") : `${format(d, "M월 d일")} (${t.dows[d.getDay()]})`;

    const submit = async () => {
        setErr(null);
        const dateStr = sel ? format(sel, "yyyy-MM-dd") : "";
        if (!dateStr) { setErr(t.errPickDate); return; }
        // 기존과 같이: 고른 픽업 장소 → 입력한 숙소 → 원래 픽업 순
        let loc = pick?.location?.name || "";
        if (!loc && hotel) loc = hotel;
        if (!loc) loc = bk.pickupLocation;
        setBusy(true);
        try {
            const res = await fetch("/api/reschedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id: resNumber, booker_email: email, new_date: dateStr, new_pickup: loc }),
            });
            const data = await res.json();
            if (!res.ok) setErr(`${t.errGeneric} ${data.error ?? ""}`);
            else onDone(t.okResched(dateStr, loc));
        } catch {
            setErr(t.errNet);
        } finally {
            setBusy(false);
        }
    };

    const input = <input id="mg-hotel" value={hotel} placeholder={t.hotelPh} onChange={(e) => setHotel(e.target.value)} />;
    return (
        <section className="card rsp">
            <div className="rsp-h"><h2>{t.rsH}</h2><p className="card-p">{t.rsP}</p></div>
            <div className="rsp-g">
                <div>
                    <h3 className="sub-h">{I_CLOCK}{t.dateH}</h3>
                    <div className="cal" style={loading ? { opacity: .5 } : undefined}>
                        <div className="cal-h"><b>{t.month(first)}</b>
                            <span className="cal-n">
                                <button type="button" aria-label="prev" disabled={first <= startOfMonth(new Date())} onClick={() => setMonth(addMonths(first, -1))}>{I_LEFT}</button>
                                <button type="button" aria-label="next" onClick={() => setMonth(addMonths(first, 1))}>{I_RIGHT}</button>
                            </span></div>
                        <div className="cal-g" role="grid">
                            {t.dows.map((d, i) => <span key={i} className="dow">{d}</span>)}
                            {cells.map((d, i) => !d ? <span key={`b${i}`} className="blank" /> : (
                                <button key={i} type="button" disabled={blocked(d) && !same(d, bk.tourDate)}
                                    className={`d${same(d, bk.tourDate) ? " cur" : ""}${same(d, sel) ? " sel" : ""}${blocked(d) && !same(d, bk.tourDate) ? " off" : ""}`}
                                    onClick={() => !same(d, bk.tourDate) && setSel(d)}>{d.getDate()}</button>
                            ))}
                        </div>
                        <div className="legend">{t.legend.map(([k, v]) => <span key={k} className={`lg ${k}`}><i />{v}</span>)}</div>
                    </div>
                </div>
                <div>
                    <h3 className="sub-h">{I_PIN}{t.pickH}</h3>
                    <div className="fld"><label htmlFor="mg-hotel">{t.hotelLabel}</label>
                        {isLoaded ? <Autocomplete onLoad={(a) => { acRef.current = a; }} onPlaceChanged={placeChanged}>{input}</Autocomplete> : input}</div>
                    {pick && pick.minutes > 0 && (
                        <div className="rec"><span className="tag">{t.recTag}</span><b>{I_PIN}{getPickupDisplayNameByLang(pick.location.name, lang)}</b>
                            <span>{t.walk(pick.minutes)}{pickTime(pick.location) && ` · ${pickTime(pick.location)}`}</span></div>
                    )}
                    <div className="fld"><label htmlFor="mg-pick">{t.pickSel}</label>
                        <select id="mg-pick" className="mg-select" value={pick?.location?.id || ""} onChange={(e) => { const l = pickups.find((p) => p.id === e.target.value); if (l) setPick({ location: l, minutes: 0 }); }}>
                            <option value="" disabled>{t.pickPh}</option>
                            {pickups.map((l) => <option key={l.id} value={l.id}>{getPickupDisplayNameByLang(l.name, lang)}{pickTime(l) ? ` (${pickTime(l)})` : ""}</option>)}
                        </select></div>
                    {sel && (
                        <div className="chg"><span className="chg-h">{t.sumH}</span>
                            <div className="chg-r"><s>{fmt(bk.tourDate)}</s>{I_RIGHT}<b>{fmt(sel)}</b></div>
                            <span className="chg-s">{pickChanged ? t.pickNew(getPickupDisplayNameByLang(newPickName, lang)) : t.pickSame(getPickupDisplayNameByLang(bk.pickupLocation, lang))}</span></div>
                    )}
                    {err && <p className="mg-msg err" role="alert">{err}</p>}
                    <div className="btns">
                        <button type="button" className="line-pill" onClick={onBack}>{t.back}</button>
                        <button type="button" className="book-pill" disabled={busy} onClick={submit}>{busy ? t.submitting : t.submitRs}</button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CancelModal({ lang, tier, daysLeft, bk, resNumber, onClose, onDone }: {
    lang: Lang; tier: number; daysLeft: number; bk: Booking; resNumber: string; onClose: () => void; onDone: (ok: boolean, text: string) => void;
}) {
    const t = T[lang];
    const [agree, setAgree] = useState(false);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", esc);
        return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", esc); };
    }, [onClose]);

    const go = async () => {
        if (!bk.name) { onDone(false, t.errName); return; }
        setBusy(true);
        try {
            const res = await fetch("/api/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id: resNumber, booker_name: bk.name, reason: "고객 홈페이지 직접 취소 접수" }),
            });
            const data = await res.json();
            if (!res.ok) onDone(false, `${t.errGeneric} ${data.error ?? ""}`);
            else onDone(true, t.okCancel);
        } catch {
            onDone(false, t.errNet);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mg-root" role="dialog" aria-modal="true" aria-labelledby="mg-c-h">
            <div className="dim" onClick={onClose} />
            <div className="modal sheet">
                <span className="grab m-only" />
                <div className="m-h"><h2 id="mg-c-h">{t.cH}</h2><button type="button" className="m-x" aria-label={t.close} onClick={onClose}>{I_X}</button></div>
                <div className="m-b">
                    <p className="card-p">{t.cP}</p>
                    <div className="now"><span>{t.cNow(Math.max(daysLeft, 0))}</span><b>{t.cBig[tier]}</b></div>
                    <Refund lang={lang} now={tier} />
                    <p className="rf-note">{t.cRule}</p>
                    <label className="agree">
                        <input type="checkbox" className="sr" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                        <span className={`box${agree ? " on" : ""}`} aria-hidden>{I_CHECK}</span>{t.agree}
                    </label>
                    <div className="m-btns">
                        <button type="button" className="line-pill" onClick={onClose}>{t.back}</button>
                        <button type="button" className="danger" disabled={!agree || busy} onClick={go}>{busy ? t.cGoing : t.cGo}</button>
                    </div>
                    <p className="final">{I_ALERT}{t.cFinal}</p>
                </div>
            </div>
        </div>
    );
}
