import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    const { data } = await supabase
        .from('reservations')
        .select('name, order_id, created_at, receipt_date, source')
        .ilike('name', '%주슬기%')
        .order('created_at', { ascending: true });
        
    console.table(data);
}
checkDuplicates();
