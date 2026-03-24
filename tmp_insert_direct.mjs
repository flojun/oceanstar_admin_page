import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('pickup_locations').insert([
    {
      name: '직접',
      lat: 21.2917,
      lng: -157.8541,
      time_1: '07:50',
      time_2: '10:50',
      time_3: '14:50'
    }
  ]);
  if (error) {
    if (error.code === '23505') { // Unique violation, maybe it exists
        console.log('Record might already exist:', error.message);
    } else {
        console.error('Error inserting:', error);
    }
  } else {
    console.log('Successfully inserted "직접" pickup location.');
  }
}
run();
