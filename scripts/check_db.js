require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    let res = await supabase.from('site_settings').select('*');
    console.log('site_settings:', res);
    
    res = await supabase.from('tour_settings').select('*').limit(1);
    console.log('tour_settings:', res.data ? Object.keys(res.data[0]) : res);
}
check();
