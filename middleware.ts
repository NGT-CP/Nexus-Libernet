import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin');

    // =======================================================================
    // RULE 1: THE UN-AUTHENTICATED CHECK
    // =======================================================================
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        const redirectResponse = NextResponse.redirect(url);

        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, {
                domain: cookie.domain, expires: cookie.expires, httpOnly: cookie.httpOnly,
                maxAge: cookie.maxAge, path: cookie.path, sameSite: cookie.sameSite, secure: cookie.secure,
            });
        });
        return redirectResponse;
    }

    // =======================================================================
    // RULE 2: THE ALREADY LOGGED IN CHECK (Routing from root)
    // =======================================================================
    if (path === '/' && user) {
        const url = request.nextUrl.clone();
        url.pathname = user.user_metadata?.role === 'admin' ? '/admin' : '/dashboard';
        const redirectResponse = NextResponse.redirect(url);

        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, {
                domain: cookie.domain, expires: cookie.expires, httpOnly: cookie.httpOnly,
                maxAge: cookie.maxAge, path: cookie.path, sameSite: cookie.sameSite, secure: cookie.secure,
            });
        });
        return redirectResponse;
    }

    // =======================================================================
    // RULE 3: STRICT BOUNDARY ENFORCEMENT (The Fix)
    // Prevent Admins from typing /dashboard and Students from typing /admin
    // =======================================================================
    if (user) {
        const userRole = user.user_metadata?.role;

        // A. If an Admin tries to manually navigate to the Student Dashboard
        if (path.startsWith('/dashboard') && userRole === 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/admin'; // Force them back to the admin portal
            const redirectResponse = NextResponse.redirect(url);

            supabaseResponse.cookies.getAll().forEach((cookie) => {
                redirectResponse.cookies.set(cookie.name, cookie.value, {
                    domain: cookie.domain, expires: cookie.expires, httpOnly: cookie.httpOnly,
                    maxAge: cookie.maxAge, path: cookie.path, sameSite: cookie.sameSite, secure: cookie.secure,
                });
            });
            return redirectResponse;
        }

        // B. If a Student tries to manually navigate to the Admin Portal
        if (path.startsWith('/admin') && userRole !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard'; // Force them back to the student dashboard
            const redirectResponse = NextResponse.redirect(url);

            supabaseResponse.cookies.getAll().forEach((cookie) => {
                redirectResponse.cookies.set(cookie.name, cookie.value, {
                    domain: cookie.domain, expires: cookie.expires, httpOnly: cookie.httpOnly,
                    maxAge: cookie.maxAge, path: cookie.path, sameSite: cookie.sameSite, secure: cookie.secure,
                });
            });
            return redirectResponse;
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/mikrotik|api/attendance|portal).*)',
    ],
};