import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Fetch tour settings
        const { data: tourSettings, error: tourError } = await supabase
            .from('tour_settings')
            .select('*');

        if (tourError) throw tourError;

        // 2. Fetch future blocked dates
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: blockedDates, error: blockedError } = await supabase
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
