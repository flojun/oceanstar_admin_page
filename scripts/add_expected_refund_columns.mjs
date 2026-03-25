// Run this script to add expected_refund and currency columns to reservations table
// Usage: node scripts/add_expected_refund_columns.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    // We cannot run raw SQL ALTER TABLE from anon key directly using supabase-js client via RPC 
    // unless an RPC function allows it. 
    // We will attempt to select the columns. If they fail, we report instructions.
    
    const { error: refundError } = await supabase
        .from('reservations')
        .select('expected_refund, currency')
        .limit(1);

    if (refundError) {
        console.log('❌ Columns "expected_refund" or "currency" do not exist yet.');
        console.log('');
        console.log('Please run this SQL in Supabase Dashboard > SQL Editor:');
        console.log('');
        console.log('  ALTER TABLE reservations');
        console.log('    ADD COLUMN expected_refund numeric(10,2) DEFAULT NULL,');
        console.log('    ADD COLUMN currency varchar(3) DEFAULT \'KRW\';');
        console.log('');
    } else {
        console.log('✅ Columns "expected_refund" and "currency" already exist!');
    }
}

main();
