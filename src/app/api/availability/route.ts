import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePax } from '@/lib/utils'; // Uses our existing helper
import { resolveOptionToTourSetting } from '@/lib/tourUtils';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month'); // e.g. "2026-03"
        const option = searchParams.get('option');

        if (!month || !option) {
            return NextResponse.json({ error: 'Missing required parameters (month, option)' }, { status: 400 });
        }

        // 1. Fetch all tour settings for resolution
        const { data: tourSettings } = await supabase.from('tour_settings').select('*');
        if (!tourSettings) {
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        // 2. Resolve requested option to get capacity, vessel, group
        const targetResolved = resolveOptionToTourSetting(option, tourSettings);
        if (!targetResolved.tourSetting) {
            return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
        }

        const maxCapacity = targetResolved.capacity;
        const targetGroup = targetResolved.group;
        const targetVessel = targetResolved.vessel;
        const isFlatRate = targetResolved.tourSetting.is_flat_rate;

        // Parse dates
        const [year, m] = month.split('-');
        const startDate = `${month}-01`;
        const nextMonth = Number(m) === 12 ? '01' : String(Number(m) + 1).padStart(2, '0');
        const nextYear = Number(m) === 12 ? Number(year) + 1 : year;
        const endDate = `${nextYear}-${nextMonth}-01`;

        // 3. Fetch all non-cancelled reservations for the month
        const { data: reservations, error } = await supabase
            .from('reservations')
            .select('tour_date, pax, adult_count, child_count, status, option')
            .neq('status', '취소')
            .gte('tour_date', startDate)
            .lt('tour_date', endDate);

        if (error) {
            console.error('Available capacity DB Error:', error);
            return NextResponse.json({ error: 'Database error fetching capacity' }, { status: 500 });
        }

        // 4. Aggregate participants by date
        const dailyBooked: Record<string, number> = {};
        if (reservations) {
            reservations.forEach(res => {
                const resResolved = resolveOptionToTourSetting(res.option || '', tourSettings);

                // Compete for capacity if same group AND vessel
                if (resResolved.group === targetGroup && resResolved.vessel === targetVessel) {
                    const date = res.tour_date;
                    let paxCount = 0;

                    if (resResolved.tourSetting?.is_flat_rate) {
                        // A flat rate booking takes up the entire boat capacity
                        paxCount = maxCapacity;
                    } else if (res.adult_count || res.child_count) {
                        paxCount = (res.adult_count || 0) + (res.child_count || 0);
                    } else if (res.pax) {
                        paxCount = parsePax(res.pax);
                    }

                    if (!dailyBooked[date]) dailyBooked[date] = 0;
                    dailyBooked[date] += paxCount;
                }
            });
        }

        // 5. Convert to availability map
        const availability: Record<string, { booked: number, remaining: number, isAvailable: boolean }> = {};
        for (const [date, booked] of Object.entries(dailyBooked)) {
            let remaining = maxCapacity - booked;
            let isAvailable = remaining > 0;

            // If the requested target is flat rate, it requires the ENTIRE vessel to be empty.
            if (isFlatRate) {
                if (booked > 0) {
                    remaining = 0;
                    isAvailable = false;
                }
            }

            availability[date] = {
                booked,
                remaining,
                isAvailable
            };
        }

        return NextResponse.json({
            success: true,
            maxCapacity,
            availability
        });

    } catch (error) {
        console.error('Availability API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
