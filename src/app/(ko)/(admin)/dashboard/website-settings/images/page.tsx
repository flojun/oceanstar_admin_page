import { Metadata } from "next";
import WebsiteImagesTable from "@/components/website-settings/WebsiteImagesTable";

export const metadata: Metadata = {
    title: "사진 및 배너 관리 | OCEANSTAR",
    description: "고객용 웹사이트의 메인 사진 및 투어 옵션별 배너 사진을 관리합니다.",
};

export default function WebsiteImagesPage() {
    return (
        <div className="flex flex-col space-y-6 max-w-7xl mx-auto h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">사진 및 배너 관리</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        고객용 웹사이트(홈페이지 및 예약 모달창)에 노출되는 사진들을 교체합니다.
                    </p>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <h4 className="font-bold flex items-center gap-2 mb-1">💡 이용 가이드</h4>
                <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>업로드하는 즉시 브라우저에서 <strong>자동으로 가벼운 용량(최대 2MB, JPG)으로 최적화 및 변환</strong>되어 업로드됩니다.</li>
                    <li>가장 예쁘고 넓게 보이려면 지정된 <strong>권장 해상도 비율(16:9)</strong>의 사진을 업로드해 주세요.</li>
                    <li>고객 웹사이트에 즉시 반영되도록 내부 버전 시스템(Vercel Edge 캐시 회피)이 연동되어 있습니다.</li>
                </ul>
            </div>

            <div className="flex-1 pb-10">
                <WebsiteImagesTable />
            </div>
        </div>
    );
}
