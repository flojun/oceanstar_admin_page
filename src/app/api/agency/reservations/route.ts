import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    try {
        const c = await cookies();
        const agencyId = c.get('agency_session')?.value;

        if (!agencyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('agency_id', agencyId)
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
