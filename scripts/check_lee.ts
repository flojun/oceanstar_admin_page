import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .ilike('name', '%이태진%');
        
    console.log('Error:', error);
    console.log('Data for 이태진:', JSON.stringify(data, null, 2));

    const { data: data2 } = await supabase
        .from('reservations')
        .select('*')
        .eq('receipt_date', '2026-08-07');
    console.log('Total on 8/7:', data2?.length);
    console.log('Names on 8/7:', data2?.map(r => r.name).join(', '));
}
checkDb();
