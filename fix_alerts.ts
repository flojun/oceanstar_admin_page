import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { error } = await supabase.from('reservations').update({ is_admin_checked: true }).eq('is_admin_checked', false);
  if (error) {
    console.error(error);
  } else {
    console.log("Successfully marked all old reservations as admin checked.");
  }
}
run();
