import type { Metadata } from "next";
import { DetailRoute, detailMetadata, detailParams } from "@/components/site/detail/detailRoute";

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = detailParams;

type Props = { params: Promise<{ tour: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return detailMetadata("en", (await params).tour);
}

export default async function TourDetailPage({ params }: Props) {
  return <DetailRoute lang="en" tour={(await params).tour} />;
}
