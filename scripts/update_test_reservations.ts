import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateReservations() {
  const { data: reservations, error: fetchError } = await supabase
    .from('reservations')
    .select('id, order_id, name')
    .ilike('name', '%리뷰 테스트 고객%');

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }

  console.log(`Found ${reservations.length} test reservations to update.`);

  for (let i = 0; i < reservations.length; i++) {
    const r = reservations[i];
    // Extract the number from '리뷰 테스트 고객 1'
    const match = r.name.match(/\d+/);
    const num = match ? match[0] : (i + 1).toString();
    
    // Generate 5 digit number like T0001, T0002
    const newOrderId = `T00${num.padStart(2, '0')}`; 
    
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ order_id: newOrderId })
      .eq('id', r.id);

    if (updateError) {
      console.error(`Failed to update ${r.id}:`, updateError);
    } else {
      console.log(`Updated ${r.order_id} -> ${newOrderId}`);
    }
  }
}

updateReservations();
