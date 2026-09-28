"use client";

import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

/** 분류 칩. 스크롤하는 동안 지금 보고 있는 분류를 켠다(캔버스는 첫 칩만 켜 둔 정지 화면). */
export function FoodChips({ aria, chips }: { aria: string; chips: { key: string; icon: React.ReactNode; title: string; n: number }[] }) {
    const [active, setActive] = useState(chips[0]?.key);

    useEffect(() => {
        const els = chips.map((c) => document.getElementById(c.key)).filter(Boolean) as HTMLElement[];
        const io = new IntersectionObserver((entries) => {
            const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (vis) setActive(vis.target.id);
        }, { rootMargin: "-20% 0px -70% 0px" });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [chips]);

    return (
        <nav className="chips" aria-label={aria}>
            {chips.map((c) => (
                <a key={c.key} href={`#${c.key}`} className={c.key === active ? "on" : undefined} aria-current={c.key === active ? "true" : undefined}>
                    {c.icon}{c.title}<span className="n">{c.n}</span>
                </a>
            ))}
        </nav>
    );
}

/** 맺음 칸 오른쪽의 이 페이지 주소 QR. 예전 페이지의 'QR 코드 다운로드'를 살려 두려고 같은 QR 을 큰 PNG 로도 받게 한다. */
export function FoodQr({ url, alt, h, p, download }: { url: string; alt: string; h: string; p: string; download: string }) {
    const big = useRef<HTMLCanvasElement>(null);
    const save = () => {
        const c = big.current;
        if (!c) return;
        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = "oceanstar-restaurants-qr.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };
    return (
        <div className="e-r">
            <QRCodeSVG value={url} size={132} marginSize={2} level="M" fgColor="#101418" bgColor="#ffffff" className="qr" role="img" aria-label={alt} />
            {/* 받기용 큰 캔버스 — 화면에는 안 보인다 */}
            <QRCodeCanvas ref={big} value={url} size={500} marginSize={2} level="M" fgColor="#101418" bgColor="#ffffff" style={{ display: "none" }} aria-hidden />
            <div>
                <b>{h}</b>
                <span>{p}</span>
                <button type="button" className="qr-dl" onClick={save}>{download}</button>
            </div>
        </div>
    );
}
