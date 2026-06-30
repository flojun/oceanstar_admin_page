import { supabase } from './src/lib/supabase';

async function check() {
  const { data } = await supabase.from('tour_settings').select('*').order('display_order');
  console.log("Tour Settings:");
  console.log(data?.map(ts => ts.name));
}

check();
