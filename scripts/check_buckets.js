require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBuckets() {
    let { data, error } = await supabase.storage.listBuckets();
    if (error) console.error('Error listing buckets:', error);
    console.log('Buckets:', data?.map(b => b.name));

    if (!data?.find(b => b.name === 'website-assets')) {
        console.log('Creating website-assets bucket...');
        const { data: createData, error: createError } = await supabase.storage.createBucket('website-assets', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        if (createError) console.error('Error creating bucket:', createError);
        else console.log('Bucket created:', createData);
    } else {
        console.log('website-assets bucket already exists. Ensuring it is public...');
        await supabase.storage.updateBucket('website-assets', { public: true });
    }
}
checkBuckets();
