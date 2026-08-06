import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('tour_settings').insert([
        {
            tour_id: 'combo_marine',
            name: '거북이 스노클링 + 패러세일링 / 제트스키',
            name_en: 'Turtle Snorkeling + Parasailing / Jet Ski',
            description: '거북이 스노클링과 함께 패러세일링 또는 제트스키를 짜릿하게 즐겨보세요!',
            description_en: 'Enjoy Turtle Snorkeling along with thrilling Parasailing or Jet Ski!',
            adult_price_usd: 210,
            adult_price_krw: 283500, // Roughly 210 * 1350
            child_price_usd: 210,
            child_price_krw: 283500,
            is_active: true,
            is_flat_rate: false,
            max_capacity: 45,
            display_order: 10
        }
    ]);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success:', data);
    }
}

main();
