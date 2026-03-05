import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) return response

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // IMPORTANT: Use getUser() for better security in middleware
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isAuthPage = pathname === '/login' || pathname === '/signup'
    const isPublicPath = pathname.startsWith('/_next') ||
        pathname.startsWith('/api/public') ||
        pathname.startsWith('/booking') ||
        pathname === '/favicon.ico'

    const isProtectedPath = [
        '/appointments', '/clients', '/analytics', '/finance',
        '/staff', '/attendance', '/history', '/payroll',
        '/services', '/invoices'
    ].some(path => pathname.startsWith(path)) || pathname === '/'

    // 1. Redirect to login if user is NOT authenticated on a protected path
    if (!user && isProtectedPath && !isAuthPage) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Redirect to dashboard if user IS authenticated on an auth page
    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/appointments/book', request.url))
    }

    // 3. ─── TENANT RESOLUTION ───────────────────────────────────
    if (user) {
        let resolvedTenantId = request.headers.get('x-tenant-id') ||
            request.nextUrl.searchParams.get('tenant_id')

        // Domain/Subdomain check for multi-tenant differentiation
        if (!resolvedTenantId) {
            const hostname = request.headers.get('host') || ''
            const parts = hostname.split('.')
            if (parts.length > 2) {
                const subdomain = parts[0]
                if (subdomain !== 'www' && subdomain !== 'localhost') {
                    // Note: We can't easily query DB here without slowing down every request
                    // So we pass the slug as a header for common components to use
                    response.headers.set('x-tenant-slug', subdomain)
                }
            }
        }

        if (resolvedTenantId) {
            response.headers.set('x-tenant-id', resolvedTenantId)
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
