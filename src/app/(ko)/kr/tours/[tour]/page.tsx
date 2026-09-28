import type { Metadata } from "next";
import { DetailRoute, detailMetadata, detailParams } from "@/components/site/detail/detailRoute";

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = detailParams;

type Props = { params: Promise<{ tour: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return detailMetadata("ko", (await params).tour);
}

export default async function TourDetailPage({ params }: Props) {
  return <DetailRoute lang="ko" tour={(await params).tour} />;
}
