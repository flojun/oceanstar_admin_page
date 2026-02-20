import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // 0. Public routes - no auth required
    if (path.startsWith('/checkin')) {
        return response
    }

    // 1. If trying to access /login but already logged in -> Redirect to /dashboard/home
    if (path === '/login') {
        if (user) {
            return NextResponse.redirect(new URL('/dashboard/home', request.url))
        }
        return response
    }

    // 2. If trying to access /dashboard (or sub-routes) -> Check Auth
    if (path.startsWith('/dashboard')) {
        // 2a. If accessing exactly /dashboard -> Redirect to /dashboard/home
        if (path === '/dashboard') {
            return NextResponse.redirect(new URL('/dashboard/home', request.url))
        }

        // 2b. If not logged in -> Redirect to /login
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/login',
        '/dashboard/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
