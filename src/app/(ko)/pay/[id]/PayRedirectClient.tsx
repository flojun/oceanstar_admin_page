"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * 브라우저에서만 Stripe 로 넘긴다. 미리보기 크롤러는 자바스크립트를 돌리지
 * 않으므로 이 페이지의 메타데이터를 그대로 가져간다.
 */
export default function PayRedirectClient({ url }: { url: string | null }) {
    useEffect(() => {
        if (url) window.location.replace(url);
    }, [url]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
            <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight mb-6">
                O C E A N S T A R
            </h1>

            {url ? (
                <>
                    <p className="flex items-center gap-2 text-slate-600 font-medium">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        결제 페이지로 이동 중입니다…
                    </p>
                    {/* 자바스크립트가 막혀 있어도 넘어갈 수 있게 */}
                    <a
                        href={url}
                        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
                    >
                        열리지 않으면 여기를 눌러주세요
                    </a>
                </>
            ) : (
                <>
                    <p className="text-slate-700 font-bold text-lg">
                        이미 결제가 완료된 링크입니다.
                    </p>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        결제가 되지 않았다면 오션스타로 문의해 주세요.
                    </p>
                </>
            )}
        </main>
    );
}
