import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimes() {
    const { data } = await supabase
        .from('reservations')
        .select('name, created_at, receipt_date, tour_date')
        .eq('receipt_date', '2026-08-07')
        .order('created_at', { ascending: true });
        
    console.table(data);
}
checkTimes();
