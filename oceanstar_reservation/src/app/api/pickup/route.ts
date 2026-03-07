import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: pickupLocations, error } = await supabase
            .from('pickup_locations')
            .select('*');

        if (error) {
            console.error('Error fetching pickup locations:', error);
            // Fallback data if table doesn't exist yet for testing without user running SQL
            return NextResponse.json([
                { id: '1', name: 'Ilikai Hotel Flagpole', lat: 21.2840, lng: -157.8384, time_1: '07:30', time_2: '10:30', time_3: '14:30' },
                { id: '2', name: 'Ross Dress for Less Waikiki', lat: 21.2801, lng: -157.8282, time_1: '07:45', time_2: '10:45', time_3: '14:45' },
                { id: '3', name: 'Hyatt Regency Waikiki (Koa Ave)', lat: 21.2758, lng: -157.8242, time_1: '07:55', time_2: '10:55', time_3: '14:55' }
            ]);
        }

        return NextResponse.json(pickupLocations);
    } catch (error) {
        console.error('Server error fetching pickup locations', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
