const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Inserting combo_marine...');
    const { data, error } = await supabase.from('tour_settings').upsert([
        {
            tour_id: 'combo_marine',
            name: '거북이 스노클링 + 패러세일링 / 제트스키',
            description: '거북이 스노클링과 함께 패러세일링 또는 제트스키를 짜릿하게 즐겨보세요!',
            adult_price_usd: 210,
            adult_price_krw: 283500,
            child_price_usd: 210,
            child_price_krw: 283500,
            is_active: true,
            is_flat_rate: false,
            max_capacity: 45,
            display_order: 5 // Private is 4 or 5 usually. We'll check the list.
        }
    ]);
    console.log('Insert Error:', error);
    
    const { data: fetch, error: fetchErr } = await supabase.from('tour_settings').select('tour_id, display_order').order('display_order');
    console.log('Current Tours:', fetch);
}
main();
