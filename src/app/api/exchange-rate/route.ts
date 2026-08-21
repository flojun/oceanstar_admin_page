import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD', {
            // 캐시를 방지하고 항상 최신 환율을 가져오도록 설정
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }
        
        const data = await response.json();
        const rate = data.rates?.KRW;
        
        if (!rate) {
            throw new Error('KRW rate not found');
        }
        
        return NextResponse.json({ rate });
    } catch (error: any) {
        console.error('Exchange rate fetch error:', error);
        return NextResponse.json({ error: error.message, rate: 1350 }, { status: 500 });
    }
}
