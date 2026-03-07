import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePax } from '@/lib/utils'; // Uses our existing helper

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month'); // e.g. "2026-03"
        const option = searchParams.get('option'); // e.g. "1부", "2부", "3부"

        if (!month || !option) {
            return NextResponse.json({ error: 'Missing required parameters (month, option)' }, { status: 400 });
        }

        // Determine max capacity based on tour option
        let maxCapacity = 45; // Default for 1부, 2부
        if (option === '3부') {
            maxCapacity = 38; // 3부(선셋) is 38
        }

        // Parse start and end of month for better querying on DATE columns
        const [year, m] = month.split('-');
        const startDate = `${month}-01`;
        const nextMonth = Number(m) === 12 ? '01' : String(Number(m) + 1).padStart(2, '0');
        const nextYear = Number(m) === 12 ? Number(year) + 1 : year;
        const endDate = `${nextYear}-${nextMonth}-01`;

        // 1. Fetch all non-cancelled reservations for the given month and option
        const { data: reservations, error } = await supabase
            .from('reservations')
            .select('tour_date, pax, adult_count, child_count, status')
            .eq('option', option)
            .neq('status', '취소') // Exclude cancelled
            .gte('tour_date', startDate)
            .lt('tour_date', endDate);

        if (error) {
            console.error('Available capacity DB Error:', error);
            return NextResponse.json({ error: 'Database error fetching capacity' }, { status: 500 });
        }

        // 2. Aggregate participants by date
        const dailyBooked: Record<string, number> = {};
        if (reservations) {
            reservations.forEach(res => {
                const date = res.tour_date;
                let paxCount = 0;

                // Prioritize adult_count + child_count for new web reservations
                if (res.adult_count || res.child_count) {
                    paxCount = (res.adult_count || 0) + (res.child_count || 0);
                } else if (res.pax) {
                    // Fallback to legacy string parsing (e.g. "4명")
                    paxCount = parsePax(res.pax);
                }

                if (!dailyBooked[date]) dailyBooked[date] = 0;
                dailyBooked[date] += paxCount;
            });
        }

        // 3. Convert to remaining availability map
        const availability: Record<string, { booked: number, remaining: number, isAvailable: boolean }> = {};
        // We only populate dates that have bookings. The frontend will assume maxCapacity if not found.
        for (const [date, booked] of Object.entries(dailyBooked)) {
            availability[date] = {
                booked,
                remaining: maxCapacity - booked,
                isAvailable: (maxCapacity - booked) > 0
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
