// Run this script to add the is_admin_checked column to the reservations table
// Usage: node scripts/add_admin_checked_column.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// We can't run raw SQL via the anon key, so we'll test if the column exists
// by doing a select. If it fails, we'll inform the user to add it via Supabase dashboard.
async function main() {
    // Test if column already exists
    const { data, error } = await supabase
        .from('reservations')
        .select('is_admin_checked')
        .limit(1);

    if (error) {
        console.log('❌ Column "is_admin_checked" does not exist yet.');
        console.log('');
        console.log('Please run this SQL in Supabase Dashboard > SQL Editor:');
        console.log('');
        console.log('  ALTER TABLE reservations ADD COLUMN is_admin_checked boolean DEFAULT false;');
        console.log('  UPDATE reservations SET is_admin_checked = true;  -- mark all existing as checked');
        console.log('');
    } else {
        console.log('✅ Column "is_admin_checked" already exists!');
    }
}

main();
