import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazily instantiated so route modules can be statically imported during
// Next.js build-time page-data collection without env vars being present -
// createClient() only actually runs on first real use at request time.
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
    if (!client) {
        client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }
    return client
}

export const supabaseServer = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        return Reflect.get(getClient(), prop, receiver)
    },
})
