import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { data, error } = await supabaseServer
            .from('invoice_prices')
            .select('*')
            .order('source', { ascending: true });

        if (error) {
            console.error('Fetch invoice_prices error', error);
            return NextResponse.json([]);
        }

        return NextResponse.json(data);
    } catch (e: any) {
        console.error('Invoice Prices API Error:', e);
        return NextResponse.json({ error: 'Failed to fetch invoice prices.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { getAll: () => cookieStore.getAll() }
            }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const validPayload = body
            .filter((item: any) => item.source && item.source.trim() !== '')
            .map((item: any) => ({
                source: item.source.trim(),
                price_regular_adult: item.price_regular_adult !== "" && item.price_regular_adult != null ? Number(item.price_regular_adult) : null,
                price_regular_child: item.price_regular_child !== "" && item.price_regular_child != null ? Number(item.price_regular_child) : null,
                price_sunset_adult: item.price_sunset_adult !== "" && item.price_sunset_adult != null ? Number(item.price_sunset_adult) : null,
                price_sunset_child: item.price_sunset_child !== "" && item.price_sunset_child != null ? Number(item.price_sunset_child) : null,
            }));

        // 1. Find existing sources
        const { data: existing } = await supabaseServer.from('invoice_prices').select('source');
        const existingSources = (existing || []).map(e => e.source);
        const incomingSources = validPayload.map(p => p.source);

        // 2. Identify sources to delete (in DB but not in frontend)
        // Also always delete empty sources just in case they were stuck in the DB
        const sourcesToDelete = existingSources.filter(s => !incomingSources.includes(s) || s.trim() === '');
        
        if (sourcesToDelete.length > 0) {
            await supabaseServer.from('invoice_prices').delete().in('source', sourcesToDelete);
        }

        // 3. Upsert the valid payload
        if (validPayload.length > 0) {
            const { error } = await supabaseServer
                .from('invoice_prices')
                .upsert(validPayload, { onConflict: 'source' });

            if (error) {
                console.error('Upsert invoice_prices error', error);
                return NextResponse.json({ error: 'Upsert failed.' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Invoice Prices POST Error:', e);
        return NextResponse.json({ error: 'System error.' }, { status: 500 });
    }
}
