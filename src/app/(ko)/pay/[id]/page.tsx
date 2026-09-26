import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stripeClient } from "@/lib/stripeBooking";
import PayRedirectClient from "./PayRedirectClient";

/**
 * 맞춤 결제 링크를 우리 도메인에서 내보낸다.
 *
 * Stripe 가 호스팅하는 book.stripe.com 페이지는 공유 미리보기 제목이
 * "Stripe Checkout" 으로 고정이고 계정 이름이나 브랜딩 설정으로 바뀌지 않는다.
 * 카카오톡·문자로 보냈을 때 오션스타 이름이 뜨게 하려면 우리 페이지를 거쳐야
 * 한다.
 *
 * 그래서 서버 리다이렉트를 쓰지 않는다. 서버에서 302 로 넘기면 미리보기를
 * 만드는 크롤러가 Stripe 페이지까지 따라가서 결국 Stripe 제목을 가져간다.
 * 이 페이지를 HTML 로 내려주고 브라우저에서만 넘긴다.
 *
 * 손님 언어는 링크를 만들 때 정해 metadata 에 넣어둔다.
 */

type Props = { params: Promise<{ id: string }> };

const TITLE = "Oceanstar Custom Checkout";
const DESCRIPTION = {
    ko: "오션스타 하와이 결제 페이지입니다. 안전하게 결제를 진행해 주세요.",
    en: "Secure payment page for Ocean Star Hawaii.",
} as const;

async function loadLink(id: string) {
    if (!stripeClient || !id.startsWith("plink_")) return null;
    try {
        return await stripeClient.paymentLinks.retrieve(id);
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const link = await loadLink(id);
    const lang = link?.metadata?.lang === "en" ? "en" : "ko";

    return {
        title: TITLE,
        description: DESCRIPTION[lang],
        // 결제 링크가 검색에 잡힐 이유가 없다.
        robots: { index: false, follow: false },
        openGraph: {
            title: TITLE,
            description: DESCRIPTION[lang],
            type: "website",
            locale: lang === "en" ? "en_US" : "ko_KR",
            images: ["/og-image.jpg"],
        },
    };
}

export default async function PayPage({ params }: Props) {
    const { id } = await params;
    const link = await loadLink(id);
    if (!link) notFound();

    const lang = link.metadata?.lang === "en" ? "en" : "ko";
    return <PayRedirectClient url={link.active ? link.url : null} lang={lang} />;
}
