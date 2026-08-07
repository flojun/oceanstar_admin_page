import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLola() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('source', 'LOLA')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching reservations:', error);
  } else {
    console.log('LOLA Reservations:', JSON.stringify(data, null, 2));
  }
}

checkLola();
