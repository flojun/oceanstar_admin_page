/** 캔버스(docs/design-canvas/v3)에서 쓰는 선 아이콘. 24 격자, 선 1.7, currentColor. */
type P = { size?: number; className?: string };

const base = (size: number) => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
});

export const Arrow = ({ size = 15, className }: P) => (
    <svg {...base(size)} className={className}><path d="M7 17L17 7M17 7H9M17 7v8" /></svg>
);
export const Plus = ({ size = 15, className }: P) => (
    <svg {...base(size)} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const Minus = ({ size = 15, className }: P) => (
    <svg {...base(size)} className={className}><path d="M5 12h14" /></svg>
);
export const Check = ({ size = 22, className }: P) => (
    <svg {...base(size)} className={className} strokeWidth={2}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
export const Star = ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}>
        <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="none" />
    </svg>
);
export const Stars = ({ size = 18 }: { size?: number }) => (
    <span className="stars" role="img" aria-label="5/5">
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={size} />)}
    </span>
);
export const Play = ({ size = 30, className }: P) => (
    <svg {...base(size)} className={className}><path d="M9.5 7.5l7.5 4.5-7.5 4.5z" fill="currentColor" /></svg>
);
export const Sparkle = ({ size = 14, className }: P) => (
    <svg {...base(size)} className={className}><path d="M12 4v4M12 16v4M4 12h4M16 12h4M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2" /></svg>
);
export const Instagram = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
            <linearGradient id="os-ig" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#F9CE34" />
                <stop offset=".5" stopColor="#EE2A7B" />
                <stop offset="1" stopColor="#6228D7" />
            </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#os-ig)" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="url(#os-ig)" strokeWidth="2" />
        <circle cx="17.3" cy="6.7" r="1.2" fill="url(#os-ig)" />
    </svg>
);
export const Kakao = ({ size = 20, className }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
        <path fill="currentColor" d="M12 4.2c-4.4 0-8 2.9-8 6.5 0 2.3 1.5 4.3 3.7 5.5l-.9 3.3 3.7-2c.5.1 1 .1 1.5.1 4.4 0 8-2.9 8-6.5s-3.6-6.9-8-6.9z" />
    </svg>
);
export const KakaoLine = ({ size = 16, className }: P) => (
    <svg {...base(size)} className={className} strokeWidth={1.8}>
        <path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z" />
    </svg>
);
export const Fork = ({ size = 20, className }: P) => (
    <svg {...base(size)} className={className}>
        <path d="M6 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3" /><path d="M8 12v9" />
        <path d="M17 3c-1.4 1.6-2 3.4-2 5.5 0 1.6.7 2.5 2 2.5v10" />
    </svg>
);
export const Clock = ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.3 2" /></svg>
);
export const Pin = ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}>
        <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
    </svg>
);
export const Burger = ({ size = 22, className }: P) => (
    <svg {...base(size)} className={className} strokeWidth={2}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const Close = ({ size = 20, className }: P) => (
    <svg {...base(size)} className={className} strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const Chevron = ({ size = 16, className, dir = "right" }: P & { dir?: "right" | "left" | "down" | "up" }) => {
    const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
    return (
        <svg {...base(size)} className={className} strokeWidth={2} style={rot ? { transform: `rotate(${rot}deg)` } : undefined}>
            <path d="M9 5l7 7-7 7" />
        </svg>
    );
};
export const Ticket = ({ size = 22, className }: P) => (
    <svg {...base(size)} className={className}>
        <path d="M4 7.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z" />
        <path d="M14 6.5v11" strokeDasharray="1.6 2" />
    </svg>
);
export const Shield = ({ size = 15, className }: P) => (
    <svg {...base(size)} className={className}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
