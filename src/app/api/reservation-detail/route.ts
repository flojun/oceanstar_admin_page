import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
        return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    try {
        const { data: reservation, error } = await supabaseServer
            .from('reservations')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (error || !reservation) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        let pickupData = null;
        if (reservation.pickup_location && reservation.pickup_location !== 'DIRECT' && reservation.pickup_location !== '직접') {
            const { data } = await supabaseServer
                .from('pickup_locations')
                .select('*')
                .eq('name', reservation.pickup_location)
                .single();
            pickupData = data;
        }

        return NextResponse.json({ reservation, pickupData });
    } catch (error) {
        console.error('Reservation detail error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
