import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for insert just in case
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('pickup_locations').insert([
    {
      name: '직접',
      lat: 21.2917,
      lng: -157.8541,
      time_1: '07:50',
      time_2: '10:50'
    }
  ]);
  console.log('Result:', error || 'Success');
}
run();
