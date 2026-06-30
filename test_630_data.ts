import { supabase } from './src/lib/supabase';

async function check() {
  const { data: res } = await supabase.from('reservations').select('*').eq('tour_date', '2026-06-30');
  const { data: status } = await supabase.from('daily_vehicle_status').select('*').eq('date', '2026-06-30');
  
  console.log("Reservations for 6/30:", res?.length);
  const byOption = {};
  res?.forEach(r => {
    byOption[r.option] = (byOption[r.option] || 0) + 1;
    if (r.vehicle_id) {
       console.log("Assigned res:", r.option, r.vehicle_id);
    }
  });
  console.log("By option:", byOption);
  console.log("Daily vehicle status:", status);
}

check();
