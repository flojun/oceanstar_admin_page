import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stripeClient } from "@/lib/stripeBooking";
import { fromMinor } from "@/lib/money";
import CustomBookingForm from "./CustomBookingForm";

/**
 * 맞춤 결제 링크의 손님 화면.
 *
 * 관리자는 상품명과 금액만 정해두고, 예약 정보는 손님이 여기서 채운다.
 * 제출하면 /api/pay/[id] 가 결제창을 만들어 Stripe 로 넘긴다.
 *
 * Stripe 가 호스팅하는 결제 페이지는 공유 미리보기 제목이 "Stripe Checkout"
 * 으로 고정이고 계정 이름이나 브랜딩 설정으로 바뀌지 않는다. 카카오톡·문자로
 * 보냈을 때 오션스타 이름이 뜨게 하려면 우리 페이지를 거쳐야 한다.
 */

type Props = { params: Promise<{ id: string }> };

const TITLE = "Oceanstar Custom Checkout";
const DESCRIPTION = {
    ko: "오션스타 하와이 예약 결제 페이지입니다. 예약 정보를 입력해 주세요.",
    en: "Ocean Star Hawaii booking payment. Please fill in your details.",
} as const;

async function loadPrice(id: string) {
    if (!stripeClient || !id.startsWith("price_")) return null;
    const price = await stripeClient.prices.retrieve(id).catch(() => null);
    // 우리가 만든 맞춤 링크만 연다.
    if (!price || price.metadata?.kind !== "custom_link") return null;
    return price;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const price = await loadPrice(id);
    const lang = price?.metadata?.lang === "en" ? "en" : "ko";

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
    const price = await loadPrice(id);
    if (!price) notFound();

    const lang = price.metadata?.lang === "en" ? "en" : "ko";
    const feeMinor = Number(price.metadata?.fee_minor ?? 0);

    return (
        <CustomBookingForm
            priceId={price.id}
            lang={lang}
            active={price.active}
            productName={price.metadata?.product_name ?? ""}
            currency={price.currency.toUpperCase() === "KRW" ? "KRW" : "USD"}
            base={fromMinor(price.unit_amount ?? 0, price.currency)}
            fee={fromMinor(feeMinor, price.currency)}
        />
    );
}
