"use client";

import imageCompression from "browser-image-compression";
import { useEffect, useRef, useState } from "react";
import { maskName } from "@/lib/utils";
import type { SiteReview } from "@/lib/siteData";
import type { Lang } from "../tours";

const svg = (p: React.ReactNode, size = 18, sw = 2, fill = "none") => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{p}</svg>
);
export const I_STAR_F = svg(<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />, 16, 0, "currentColor");
const I_SHIELD = svg(<><path d="M12 3l7 3v5.5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5V6z" /><path d="M8.8 12.2l2.2 2.2 4.4-4.6" /></>, 16, 1.8);
const I_PEN = svg(<><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13.5 8.5l2 2" /></>, 18, 1.8);
const I_CAM = svg(<><path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3v10H4z" /><circle cx="12" cy="13.2" r="3.3" /></>, 22, 1.6);
const I_X = svg(<path d="M6 6l12 12M18 6L6 18" />);
const I_LEFT = svg(<path d="M15 5l-7 7 7 7" />);
const I_RIGHT = svg(<path d="M9 5l7 7-7 7" />);
const I_ARROW = svg(<path d="M7 17L17 7M17 7H9M17 7v8" />, 15, 1.7);

export const Stars = ({ n = 5, label }: { n?: number; label: string }) => (
    <span className="rstars" role="img" aria-label={label}>{Array.from({ length: n }, (_, i) => <span key={i}>{I_STAR_F}</span>)}</span>
);

const T = {
    ko: {
        star: (n: number) => `별점 ${n}점`, photoAlt: (n: string) => `${n} 님이 올린 투어 사진`, more: "더보기", less: "접기", verified: "예약 확인 후기",
        prev: (w: string) => `이전 ${w}`, next: (w: string) => `다음 ${w}`, endB: (n: number) => `후기 ${n}개 더 보기`, endS: "전체 후기를 최신순으로 볼 수 있어요",
        write: "후기 작성하기", oidLabel: "예약 번호 (영숫자 6자리)", oidPh: "예: A4X9T2", oidHelp: "예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다.",
        nameLabel: "이름 (초성 또는 닉네임 가능)", namePh: "김오션", rating: "별점", pts: (n: number) => `${n}점`,
        contentLabel: "후기 내용", contentPh: "다녀오신 투어의 소중한 경험을 들려주세요!",
        photoLabel: <>사진 첨부 <span>(선택, 최대 5장)</span></>, addPhoto: "사진 추가", photoHelp: "JPG · PNG · WEBP, 장당 1.5MB까지",
        rule1: "예약 1건당 후기는 1개만 남길 수 있어요.", rule2: "취소 · 환불되었거나 결제 대기 중인 예약은 후기를 남길 수 없어요.",
        submit: "리뷰 등록하기", submitting: "등록 중...", mH: "솔직한 후기를 남겨주세요", close: "닫기", remove: "사진 빼기",
        ok: "후기가 등록되었습니다. 소중한 후기 감사합니다!", errSubmit: "리뷰 등록 중 오류가 발생했습니다.", errNet: "서버와 통신 중 오류가 발생했습니다.",
        errFields: "예약 번호, 이름, 후기 내용을 모두 입력해주세요.", errMax: "사진은 최대 5장까지만 올릴 수 있어요.",
    },
    en: {
        star: (n: number) => `Rated ${n} out of 5`, photoAlt: (n: string) => `Tour photo from ${n}`, more: "Read more", less: "Show less", verified: "Verified booking",
        prev: (w: string) => `Previous ${w}`, next: (w: string) => `Next ${w}`, endB: (n: number) => `${n} more reviews`, endS: "See every review, newest first",
        write: "Write a Review", oidLabel: "Booking number (6 letters and digits)", oidPh: "e.g. A4X9T2", oidHelp: "You can find this on the voucher sent after booking confirmation and payment.",
        nameLabel: "Name (initials or nickname)", namePh: "John D.", rating: "Rating", pts: (n: number) => `${n} / 5`,
        contentLabel: "Your review", contentPh: "Please share your experience from the tour!",
        photoLabel: <>Photos <span>(optional, up to 5)</span></>, addPhoto: "Add photos", photoHelp: "JPG · PNG · WEBP, up to 1.5MB each",
        rule1: "One review per booking.", rule2: "Cancelled, refunded or unpaid bookings can’t be reviewed.",
        submit: "Submit Review", submitting: "Submitting...", mH: "Share your honest review", close: "Close", remove: "Remove photo",
        ok: "Thank you! Your review has been posted.", errSubmit: "An error occurred while submitting.", errNet: "Communication error with server.",
        errFields: "Please fill in the booking number, name and review.", errMax: "You can add up to 5 photos.",
    },
};

/** 옆으로 넘기는 줄 + 좌우 버튼 (데스크탑) */
export function Carousel({ cls, what, lang, children }: { cls: string; what: string; lang: Lang; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const t = T[lang];
    const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
    return (
        <div className="car rise">
            <button type="button" className="car-b l d-only" aria-label={t.prev(what)} onClick={() => go(-1)}>{I_LEFT}</button>
            <div className={cls} ref={ref}>{children}</div>
            <button type="button" className="car-b r d-only" aria-label={t.next(what)} onClick={() => go(1)}>{I_RIGHT}</button>
        </div>
    );
}

function SiteCard({ r, lang, onPhoto }: { r: SiteReview; lang: Lang; onPhoto: (src: string) => void }) {
    const t = T[lang];
    const [open, setOpen] = useState(false);
    const [over, setOver] = useState(false);
    const pRef = useRef<HTMLParagraphElement>(null);
    const photos = r.image_urls ?? [];
    const lines = photos.length ? 6 : 12;
    const body = lang === "en" && r.content_en ? r.content_en : r.content;
    const name = maskName(lang === "en" && r.author_name_en ? r.author_name_en : r.author_name);
    useEffect(() => {
        const p = pRef.current;
        if (p) setOver(p.scrollHeight > p.clientHeight + 2);
    }, []);
    return (
        <article className={`rc${photos.length ? "" : " tx"}`} style={open ? { height: "auto" } : undefined}>
            <div className="rc-b">
                <div className="rc-top"><Stars n={r.rating} label={t.star(r.rating)} /><span className="ok">{I_SHIELD}{t.verified}</span></div>
                <div className="rc-m">
                    <p ref={pRef} className={`rc-t${open ? "" : " clamp"}`} style={{ WebkitLineClamp: open ? "unset" : lines, whiteSpace: "pre-line" }}>{body}</p>
                    {(over || open) && <button type="button" className="rc-more" onClick={() => setOpen((v) => !v)}>{open ? t.less : t.more}</button>}
                </div>
                {photos.length > 0 && (
                    <figure className="rc-ph">
                        <button type="button" onClick={() => onPhoto(photos[0])} aria-label={t.photoAlt(name)}>
                            <img src={photos[0]} alt={t.photoAlt(name)} loading="lazy" data-image-slot="reviews.card" />
                        </button>
                        {photos.length > 1 && <span className="ph-n">+{photos.length - 1}</span>}
                    </figure>
                )}
                <div className="rc-by"><b>{name}</b><span className="n">{r.created_at.slice(0, 10).replace(/-/g, ".")}</span></div>
            </div>
        </article>
    );
}

/** 홈페이지 후기 줄. 앞 9건 + '더 보기' 칸, 누르면 나머지를 이어 붙인다. */
export function SiteReviews({ reviews, lang, what }: { reviews: SiteReview[]; lang: Lang; what: string }) {
    const t = T[lang];
    const [all, setAll] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const shown = all ? reviews : reviews.slice(0, 9);
    const rest = reviews.length - shown.length;
    return (
        <>
            <Carousel cls="rrow" what={what} lang={lang}>
                {shown.map((r) => <SiteCard key={r.id} r={r} lang={lang} onPhoto={setPhoto} />)}
                {rest > 0 && (
                    <button type="button" className="rc-end" onClick={() => setAll(true)}>
                        <b>{t.endB(rest)}</b><span>{t.endS}</span>{I_ARROW}
                    </button>
                )}
            </Carousel>
            {photo && (
                <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setPhoto(null)}>
                    <img src={photo} alt="" />
                </div>
            )}
        </>
    );
}

/** 후기 작성 버튼 + 창. 규칙 확인은 서버(/api/reviews POST)가 한다. */
export function WriteReview({ lang }: { lang: Lang }) {
    const t = T[lang];
    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("write") === null) return;
        const id = setTimeout(() => setOpen(true), 0);
        return () => clearTimeout(id);
    }, []);
    return (
        <>
            <div className="rv-act"><button type="button" className="book-pill write" onClick={() => setOpen(true)}>{I_PEN}{t.write}</button></div>
            {done && <p className="rw-ok" role="status">{t.ok}</p>}
            {open && <WriteModal lang={lang} onClose={() => setOpen(false)} onDone={() => { setOpen(false); setDone(true); window.location.reload(); }} />}
        </>
    );
}

function WriteModal({ lang, onClose, onDone }: { lang: Lang; onClose: () => void; onDone: () => void }) {
    const t = T[lang];
    const [oid, setOid] = useState("");
    const [name, setName] = useState("");
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [urls, setUrls] = useState<string[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const u = files.map((f) => URL.createObjectURL(f));
        setUrls(u);
        return () => u.forEach((x) => URL.revokeObjectURL(x));
    }, [files]);
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", esc);
        return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", esc); };
    }, [onClose]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        if (!oid.trim() || !name.trim() || !content.trim()) { setErr(t.errFields); return; }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("order_id", oid.trim());
            fd.append("author_name", name.trim());
            fd.append("rating", String(rating));
            fd.append("content", content);
            // 기존 후기 창과 같이 올리기 전에 줄인다 (서버 한도 1.5MB)
            for (const f of files) {
                try {
                    fd.append("images", await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: f.type }));
                } catch {
                    fd.append("images", f);
                }
            }
            const res = await fetch("/api/reviews", { method: "POST", body: fd });
            const data = await res.json();
            if (data.success) onDone();
            else setErr(data.error || t.errSubmit);
        } catch {
            setErr(t.errNet);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rw-root" role="dialog" aria-modal="true" aria-labelledby="rw-h">
            <div className="dim" onClick={onClose} />
            <div className="modal sheet">
                <span className="grab m-only" />
                <div className="m-h"><h2 id="rw-h">{t.mH}</h2><button type="button" className="m-x" aria-label={t.close} onClick={onClose}>{I_X}</button></div>
                <form className="m-b" onSubmit={submit}>
                    <div className="fld">
                        <label htmlFor="rw-oid">{t.oidLabel}</label>
                        <div className="oid"><input id="rw-oid" value={oid} maxLength={6} placeholder={t.oidPh} autoComplete="off" onChange={(e) => setOid(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} /></div>
                        <p className="help">{t.oidHelp}</p>
                    </div>
                    <div className="fld"><label htmlFor="rw-name">{t.nameLabel}</label>
                        <input id="rw-name" value={name} placeholder={t.namePh} onChange={(e) => setName(e.target.value)} /></div>
                    <div className="fld"><label>{t.rating}</label>
                        <div className="rate" role="radiogroup" aria-label={t.rating}>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={t.pts(n)} className={n <= rating ? "on" : undefined} onClick={() => setRating(n)}>{I_STAR_F}</button>
                            ))}
                            <b>{t.pts(rating)}</b>
                        </div></div>
                    <div className="fld"><label htmlFor="rw-content">{t.contentLabel}</label>
                        <textarea id="rw-content" rows={5} value={content} placeholder={t.contentPh} onChange={(e) => setContent(e.target.value)} /></div>
                    <div className="fld"><label>{t.photoLabel}</label>
                        <div className="thumbs">
                            {urls.map((u, i) => (
                                <figure key={u}><img src={u} alt="" /><button type="button" aria-label={t.remove} onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}>{I_X}</button></figure>
                            ))}
                            {files.length < 5 && (
                                <button type="button" className="drop" onClick={() => fileRef.current?.click()}>{I_CAM}<span>{t.addPhoto}</span></button>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
                            onChange={(e) => {
                                const picked = Array.from(e.target.files ?? []);
                                e.target.value = "";
                                setFiles((f) => { const n = [...f, ...picked]; if (n.length > 5) setErr(t.errMax); return n.slice(0, 5); });
                            }} />
                        <p className="help">{t.photoHelp}</p></div>
                    <ul className="rules-s"><li>{t.rule1}</li><li>{t.rule2}</li></ul>
                    {err && <p className="rw-err" role="alert">{err}</p>}
                    <div className="sub-w"><button type="submit" className="submit" disabled={busy} style={{ width: "100%" }}>{busy ? t.submitting : t.submit}</button></div>
                </form>
            </div>
        </div>
    );
}
