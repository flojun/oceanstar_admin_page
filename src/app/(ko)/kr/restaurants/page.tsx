import FoodPage from "@/components/site/food/FoodPage";
import SiteShell from "@/components/site/SiteShell";
import { getTourData } from "@/lib/siteData";

// 메타데이터는 같은 폴더의 layout.tsx 에 그대로 둔다
export const revalidate = 300;

export default async function Page() {
  const { tourSettings, blockedDates } = await getTourData();
  return (
    <SiteShell lang="ko" tourSettings={tourSettings} blockedDates={blockedDates}>
      <FoodPage lang="ko" tourSettings={tourSettings} />
    </SiteShell>
  );
}
