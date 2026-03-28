import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
    try {
        // 1. Fetch tour settings
        const { data: tourSettings, error: tourError } = await supabaseServer
            .from('tour_settings')
            .select('*');

        if (tourError) throw tourError;

        // 2. Fetch future blocked dates
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: blockedDates, error: blockedError } = await supabaseServer
            .from('blocked_dates')
            .select('*')
            .gte('date', todayStr);

        if (blockedError) throw blockedError;

        return NextResponse.json({
            success: true,
            tourSettings,
            blockedDates: blockedDates,
        });
    } catch (error: any) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
