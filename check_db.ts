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
        .in('order_id', ['EXP-20260807-00007717', 'EXP-20260807-00013745']);
        
    console.log('Error:', error);
    console.log('Data:', JSON.stringify(data, null, 2));
}
checkDb();
