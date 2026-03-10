import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function GET() {
    try {
        // Fetch pickup locations
        const { data: pickupLocations, error } = await supabase
            .from('pickup_locations')
            .select('*');

        // Fetch tour settings to determine the offset for Tour 3
        const { data: tourSettings } = await supabase
            .from('tour_settings')
            .select('*');

        let locationsToReturn = pickupLocations || [];

        // Fallback data if DB fetch fails or has no values
        if (error || !pickupLocations || pickupLocations.length === 0) {
            console.error('Database fetch error or no data for pickup locations:', error);
            locationsToReturn = [
                { id: '1', name: '프린스', lat: 21.286394930815042, lng: -157.84013103745616, time_1: '07:50', time_2: '10:50' },
                { id: '2', name: '아이홉', lat: 21.284900771263654, lng: -157.83654774943167, time_1: '07:45', time_2: '10:45' },
                { id: '3', name: '카라이', lat: 21.279812168534036, lng: -157.83228314561782, time_1: '07:45', time_2: '10:45' },
                { id: '4', name: 'HIE', lat: 21.284147785475607, lng: -157.83108674397712, time_1: '07:40', time_2: '10:40' },
                { id: '5', name: 'HM', lat: 21.278930557010227, lng: -157.8282909823861, time_1: '07:40', time_2: '10:40' },
                { id: '6', name: '녹색천막', lat: 21.276591861646406, lng: -157.8252010425622, time_1: '07:30', time_2: '10:30' },
                { id: '7', name: 'WR', lat: 21.274962417406943, lng: -157.82361860242585, time_1: '07:30', time_2: '10:30' },
                { id: '8', name: 'HP', lat: 21.273767278150714, lng: -157.82144256153722, time_1: '07:20', time_2: '10:20' },
                { id: '9', name: 'HGI', lat: 21.278843149662812, lng: -157.82473424197582, time_1: '07:30', time_2: '10:30' },
                { id: '10', name: '르네상스', lat: 21.29398877312097, lng: -157.84349955741655, time_1: '07:50', time_2: '10:50' },
                { id: '11', name: '알라모아나', lat: 21.290125388256488, lng: -157.8398561235403, time_1: '07:50', time_2: '10:50' }
            ];
        }

        // Determine offset for Tour 3
        let tour3OffsetMinutes = 7 * 60; // Default +7 hours
        if (tourSettings) {
            const tour1 = tourSettings.find((s: any) => s.tour_id === 'morning1');
            const tour3 = tourSettings.find((s: any) => s.tour_id === 'sunset');

            if (tour1?.start_time && tour3?.start_time) {
                const tour1Min = timeStringToMinutes(tour1.start_time);
                const tour3Min = timeStringToMinutes(tour3.start_time);
                tour3OffsetMinutes = tour3Min - tour1Min;
            }
        }

        // Dynamically compute time_3 if it doesn't exist or override it 
        // using the start_time offset from tourSettings
        const finalLocations = locationsToReturn.map(loc => {
            // Take the base time_1 string (format: HH:MM or HH:MM:SS)
            let baseTimeStr = loc.time_1;

            // Just normalise if the db provides seconds e.g "07:30:00"
            if (baseTimeStr && baseTimeStr.length > 5) {
                baseTimeStr = baseTimeStr.substring(0, 5);
            }

            return {
                ...loc,
                time_3: addMinutesToTimeString(baseTimeStr, tour3OffsetMinutes)
            };
        });

        return NextResponse.json(finalLocations);
    } catch (error) {
        console.error('Server error fetching pickup locations', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
