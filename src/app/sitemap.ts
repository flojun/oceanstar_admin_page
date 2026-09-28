import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { TOURS } from '@/components/site/tours';

/**
 * 한 페이지를 한/영 한 쌍으로 싣고 서로를 hreflang 으로 가리킨다.
 * 서핑은 아직 tour_settings 에 없어 상세가 404 라 뺐다. 판매를 시작하면 filter 를 지운다.
 */
const PAGES: { path: string; freq: 'daily' | 'weekly'; priority: number }[] = [
  { path: '', freq: 'daily', priority: 1 },
  ...TOURS.filter((t) => t.key !== 'surf').map((t) => ({ path: `/tours/${t.key}`, freq: 'weekly' as const, priority: 0.9 })),
  { path: '/reviews', freq: 'weekly', priority: 0.7 },
  { path: '/faq', freq: 'weekly', priority: 0.7 },
  { path: '/restaurants', freq: 'weekly', priority: 0.6 },
  { path: '/manage-booking', freq: 'weekly', priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.flatMap(({ path, freq, priority }) => {
    const en = `${SITE_URL}${path || '/'}`;
    const ko = `${SITE_URL}/kr${path}`;
    const alternates = { languages: { 'en-US': en, 'ko-KR': ko, 'x-default': en } };
    return [
      { url: en, lastModified: now, changeFrequency: freq, priority, alternates },
      { url: ko, lastModified: now, changeFrequency: freq, priority, alternates },
    ];
  });
}
