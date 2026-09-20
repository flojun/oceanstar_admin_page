import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { sunsetPickupTime, sunsetSetOf } from '@/lib/sunsetPickup';

export const dynamic = 'force-dynamic';

/** 픽업은 출항 30분 전. */
const PICKUP_LEAD_MIN = 30;

// Helper function to add a time offset (in minutes) to a "HH:MM" string
function addMinutesToTimeString(timeStr: string | null, minutesToAdd: number): string | null {
    if (!timeStr) return null;
    const [hoursStr, minutesStr] = timeStr.split(':');
    const totalMinutes = parseInt(hoursStr) * 60 + parseInt(minutesStr) + minutesToAdd;

    // Handle midnight wrapping in case it goes over 24 hours
    const wrappedMinutes = (totalMinutes + 24 * 60) % (24 * 60);

    const h = Math.floor(wrappedMinutes / 60);
    const m = wrappedMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper to convert "HH:MM" to minutes for easier calculation
function timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
}

/** "07:30:00" 처럼 초가 붙어 오는 값을 "07:30" 으로 맞춘다. */
function toHHMM(timeStr: string | null | undefined): string | null {
    if (!timeStr) return null;
    const s = String(timeStr);
    return s.length > 5 ? s.substring(0, 5) : s;
}

export async function GET() {
    try {
        // Fetch pickup locations
        const { data: pickupLocations, error } = await supabaseServer
            .from('pickup_locations')
            .select('*');

        // Fetch tour settings to determine the offset for Tour 3
        const { data: tourSettings } = await supabaseServer
            .from('tour_settings')
            .select('*');

        let locationsToReturn = pickupLocations || [];

        // Fallback data if DB fetch fails or has no values
        if (error || !pickupLocations || pickupLocations.length === 0) {
            console.error('Database fetch error or no data for pickup locations:', error);
            locationsToReturn = [
                { id: '1', name: '프린스', lat: 21.286394930815042, lng: -157.84013103745616, time_1: '07:50', time_2: '10:50' },
                { id: '2', name: 'IHOP', lat: 21.284900771263654, lng: -157.83654774943167, time_1: '07:45', time_2: '10:45' },
                { id: '3', name: '카라이', lat: 21.279812168534036, lng: -157.83228314561782, time_1: '07:45', time_2: '10:45' },
                { id: '5', name: 'HM', lat: 21.278930557010227, lng: -157.8282909823861, time_1: '07:40', time_2: '10:40' },
                { id: '6', name: '녹색천막', lat: 21.276591861646406, lng: -157.8252010425622, time_1: '07:30', time_2: '10:30' },
                { id: '7', name: 'WR', lat: 21.274962417406943, lng: -157.82361860242585, time_1: '07:30', time_2: '10:30' },
                { id: '8', name: 'HP', lat: 21.273767278150714, lng: -157.82144256153722, time_1: '07:20', time_2: '10:20' },
                { id: '9', name: 'HGI', lat: 21.278843149662812, lng: -157.82473424197582, time_1: '07:30', time_2: '10:30' },
                { id: '10', name: '르네상스', lat: 21.29398877312097, lng: -157.84349955741655, time_1: '07:50', time_2: '10:50' },
                { id: '11', name: '알라모아나', lat: 21.290125388256488, lng: -157.8398561235403, time_1: '07:50', time_2: '10:50' },
                { id: '12', name: '리츠칼튼', lat: 21.28305167972542, lng: -157.83014726811294, time_1: '07:45', time_2: '10:45' }
            ];
        }

        const sunset = tourSettings?.find((s: { tour_id?: string }) => s.tour_id === 'sunset');
        const morning1 = tourSettings?.find((s: { tour_id?: string }) => s.tour_id === 'morning1');

        // 선셋은 계절마다 픽업 시각 세트가 통째로 바뀐다. tour_settings.sunset.start_time
        // 이 그 세트의 기준 픽업 시각이라 여기서 세트를 고르면 고객이 받는 바우처 PDF 와
        // 화면 시각이 항상 같아진다.
        const sunsetSet = sunsetSetOf(sunset?.start_time);

        // 표에 없는 장소만을 위한 마지막 수단.
        // 주의: 같은 start_time 컬럼인데 의미가 다르다.
        //   morning1.start_time = 출항 시각(08:00). 기준 픽업은 그 30분 전이다.
        //   sunset.start_time   = 기준 픽업 시각(15:00). 출항은 그 30분 뒤다.
        // 그래서 오전 픽업(time_1)에 더할 오프셋은 (선셋 기준 픽업 - 오전 기준 픽업)이다.
        let tour3OffsetMinutes = 7 * 60 + 30;
        if (morning1?.start_time && sunset?.start_time) {
            const morningPickupBase = timeStringToMinutes(morning1.start_time) - PICKUP_LEAD_MIN;
            tour3OffsetMinutes = timeStringToMinutes(sunset.start_time) - morningPickupBase;
        }

        const finalLocations = locationsToReturn.map((loc: { name?: string; time_1?: string | null; time_3?: string | null }) => ({
            ...loc,
            // 1) 운영자가 관리자 화면에서 직접 넣은 값이 있으면 그 값을 쓴다.
            // 2) 없으면 바우처 PDF 와 같은 선셋 픽업표에서 찾는다.
            // 3) 그래도 없으면 오전 픽업 시각에 오프셋을 더한다.
            time_3:
                toHHMM(loc.time_3) ??
                sunsetPickupTime(loc.name || '', sunsetSet) ??
                addMinutesToTimeString(toHHMM(loc.time_1), tour3OffsetMinutes),
        }));

        return NextResponse.json(finalLocations);
    } catch (error) {
        console.error('Server error fetching pickup locations', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
