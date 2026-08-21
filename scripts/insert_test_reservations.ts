import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createReservations() {
  const reservations = [];
  for (let i = 1; i <= 10; i++) {
    const id = i.toString().padStart(2, '0');
    reservations.push({
      order_id: `T00${id}`,
      name: `리뷰 테스트 고객 ${i}`,
      status: '예약확정',
      source: '테스트',
      tour_date: '2026-04-24',
      option: '1부',
      pax: '1명',
      contact: '010-0000-0000'
    });
  }

  const { data, error } = await supabase.from('reservations').insert(reservations);
  if (error) {
    console.error('Error inserting reservations:', error);
  } else {
    console.log('Successfully inserted 10 test reservations.');
    console.log(reservations.map(r => r.order_id).join('\n'));
  }
}

createReservations();
