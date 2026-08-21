import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        // 인증 확인 (단, CRON_SECRET이 환경 변수에 설정된 경우에만 필수 검사)
        if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. 최신 환율 가져오기
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) {
            throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
        }
        
        const data = await response.json();
        const exchangeRate = data.rates?.KRW;
        
        if (!exchangeRate) {
            throw new Error('Exchange rate for KRW not found in response');
        }

        // 2. 투어 상품 설정 가져오기
        const { data: tourSettings, error: fetchError } = await supabaseServer
            .from('tour_settings')
            .select('*');

        if (fetchError) {
            throw fetchError;
        }

        if (!tourSettings || tourSettings.length === 0) {
            return NextResponse.json({ message: 'No tour settings found to update', exchangeRate });
        }

        // 3. 각 상품의 KRW 가격 업데이트
        let updatedCount = 0;
        for (const setting of tourSettings) {
            const newAdultKrw = Math.round(((setting.adult_price_usd || 0) * exchangeRate) / 10) * 10;
            const newChildKrw = Math.round(((setting.child_price_usd || 0) * exchangeRate) / 10) * 10;

            // 값이 변경되었을 때만 업데이트
            if (setting.adult_price_krw !== newAdultKrw || setting.child_price_krw !== newChildKrw) {
                const { error: updateError } = await supabaseServer
                    .from('tour_settings')
                    .update({
                        adult_price_krw: newAdultKrw,
                        child_price_krw: newChildKrw,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('tour_id', setting.tour_id);
                
                if (updateError) {
                    console.error(`Failed to update ${setting.tour_id}:`, updateError);
                } else {
                    updatedCount++;
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            exchangeRate, 
            updatedCount, 
            totalTours: tourSettings.length 
        });

    } catch (error: any) {
        console.error('Exchange rate update failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
