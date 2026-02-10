const { createClient } = require('@supabase/supabase-js');

const url = 'https://fubwwgywtejxybzrnhjg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Ynd3Z3l3dGVqeHlienJuaGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NzM0MzgsImV4cCI6MjA4NTM0OTQzOH0.KL0KGsy4rwXeOdcO7vVp3h1ZAoGEeznrq8yiPMu1TE4';
const supabase = createClient(url, key);

async function main() {
    console.log('Fetching limit check...');
    // Request 3000 rows, see how many we get
    const { data, error, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .range(0, 2999);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Requested 3000 rows.');
        console.log('Received:', data.length);
        console.log('Total Count in DB:', count);
    }
}

main();
