import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Verifies the caller holds a valid Supabase admin session.
 *
 * Server Actions and route handlers must call this themselves: middleware
 * only guards page navigations to /dashboard/*, and a Server Action can be
 * invoked by POSTing its action id to any route, including public ones.
 */
export async function getAdminUser() {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll() }
        }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    return user;
}
