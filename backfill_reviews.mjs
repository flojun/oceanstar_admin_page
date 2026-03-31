import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const deeplKey = process.env.DEEPL_API_KEY;

if (!supabaseUrl || !supabaseKey || !deeplKey) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching reviews from Supabase...");
    const { data: reviews, error } = await supabase.from('reviews').select('*');
    if (error) {
        console.error("Error fetching reviews (Did you run the SQL migration?):", error.message);
        return;
    }
    
    console.log(`Found ${reviews.length} total reviews.`);
    let translatedCount = 0;
    
    for (const review of reviews) {
        // If content_en doesn't exist or is empty, we translate it
        if (!review.content_en) {
            console.log(`Translating review ID: ${review.id}`);
            try {
                const deeplUrl = deeplKey.endsWith(':fx') 
                    ? 'https://api-free.deepl.com/v2/translate' 
                    : 'https://api.deepl.com/v2/translate';
                    
                const response = await fetch(deeplUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `DeepL-Auth-Key ${deeplKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: [review.content],
                        target_lang: 'EN-US'
                    })
                });
                
                if (response.ok) {
                    const dlData = await response.json();
                    if (dlData.translations && dlData.translations.length > 0) {
                        const content_en = dlData.translations[0].text;
                        const { error: updateError } = await supabase
                            .from('reviews')
                            .update({ content_en })
                            .eq('id', review.id);
                            
                        if (updateError) {
                            console.error(`Failed to update review ID ${review.id} in DB:`, updateError.message);
                        } else {
                            console.log(`Successfully translated and updated review ID: ${review.id}`);
                            translatedCount++;
                        }
                    }
                } else {
                    console.error(`DeepL translation failed for ID ${review.id}: HTTP ${response.status}`);
                    console.error(await response.text());
                }
            } catch(e) {
                console.error(`Fatal DeepL Error on review ID ${review.id}:`, e);
            }
        }
    }
    console.log(`\nDone. Translated ${translatedCount} reviews missing English content.`);
}

run();
