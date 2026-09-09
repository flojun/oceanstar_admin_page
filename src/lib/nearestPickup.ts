import { supabaseServer } from '@/lib/supabaseServer';
import { findClosestPickup, type PickupLocation } from '@/lib/utils';

/**
 * OTA 메일에는 픽업 장소가 아니라 호텔 이름/주소만 오는 경우가 많다.
 * ("Hyatt Regency Waikiki Beach Resort And Spa")
 * 그 문자열을 지오코딩해서 pickup_locations 중 가장 가까운 곳으로 바꿔 준다.
 */

/** 이보다 멀면 와이키키 밖(코올리나 등)이라 보고 추천하지 않는다. */
// ponytail: 직선거리 고정 임계값. 픽업 권역이 넓어지면 장소별 반경으로 바꿀 것.
const MAX_PICKUP_METERS = 2000;

export async function getPickupLocations(): Promise<PickupLocation[]> {
    const { data } = await supabaseServer.from('pickup_locations').select('id, name, lat, lng');
    return (data as PickupLocation[]) || [];
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return null;

    // 하와이 밖의 동명 호텔로 튀지 않게 지역을 붙인다.
    const query = /honolulu|hawaii|\bhi\b/i.test(address) ? address : `${address}, Honolulu, HI`;

    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`,
        );
        const json = await res.json();
        if (json.status !== 'OK') {
            console.warn(`[Pickup] 지오코딩 실패(${json.status}): ${address}`);
            return null;
        }

        // "My hotel is not yet booked:" / "호텔 근처 픽업 장소" 같은 값도 구글은 OK 를 준다.
        // 다만 결과 타입이 locality,political(=호놀룰루 시 중심) 로만 나오므로 그걸로 걸러낸다.
        const result = json.results[0];
        const usable = (result?.types ?? []).some((t: string) =>
            /^(establishment|lodging|point_of_interest|premise|subpremise|street_address)$/.test(t),
        );
        if (!usable) {
            console.warn(`[Pickup] 주소로 해석되지 않는 값: ${address}`);
            return null;
        }

        return result.geometry?.location ?? null;
    } catch (error) {
        console.error('[Pickup] 지오코딩 오류:', error);
        return null;
    }
}

/**
 * @returns 가장 가까운 픽업 장소명. 이미 픽업 장소명이거나 판단이 안 서면 raw 를 그대로 돌려준다.
 *          (원문을 잃지 않게 호출부에서 note 에 주소를 남길 것)
 */
export async function resolveNearestPickup(
    raw: string,
    locations: PickupLocation[],
): Promise<string> {
    const value = (raw || '').trim();
    if (!value || locations.length === 0) return value;

    // 이미 우리 픽업 장소명이면 그대로 둔다.
    const known = locations.find(
        (l) => value === l.name || value.toUpperCase().startsWith(l.name.toUpperCase()),
    );
    if (known) return known.name;

    const point = await geocode(value);
    if (!point) return value;

    const closest = findClosestPickup(point.lat, point.lng, locations);
    if (!closest || closest.distanceMeters > MAX_PICKUP_METERS) {
        console.warn(`[Pickup] 픽업 권역 밖으로 판단: ${value}`);
        return value;
    }

    return closest.closestLocation.name;
}
