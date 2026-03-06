import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAgencySession } from '@/actions/agency';

// Maps agency login_id -> legacy source field values used in the reservations table.
// Add entries here whenever a new agency has existing reservations entered under a different source name.
const SOURCE_MAP: Record<string, string[]> = {
    ktb: ['KTB'],
    royal: ['로얄'],
    hello: ['헬로', '핼로'],
    korea: ['한국'],
    pam: ['팜', '팜 '],   // 팜투어
};

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const session = await getAgencySession();

        if (!session.id || !session.name) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve agency login_id so we can look it up in SOURCE_MAP
        const { data: agencyRow } = await supabase
            .from('agencies')
            .select('login_id')
            .eq('id', session.id)
            .single();

        const loginId = agencyRow?.login_id ?? '';
        const sourceAliases = SOURCE_MAP[loginId] ?? [];

        // Build OR filter: agency_id match (new bookings) + all legacy source aliases
        const orParts: string[] = [`agency_id.eq.${session.id}`];
        for (const src of sourceAliases) {
            orParts.push(`source.eq.${src}`);
        }

        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .or(orParts.join(','))
            .order('tour_date', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('Agency reservations fetch error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
