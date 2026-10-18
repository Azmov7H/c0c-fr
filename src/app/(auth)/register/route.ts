import { NextRequest, NextResponse } from 'next/server';

/**
 * `/signup` is the canonical signup route (T12). `/register` remains a 301 so
 * existing bookmarks, shared links and any external references keep working —
 * and so search engines consolidate on one URL.
 *
 * This file replaces the old register page; a page and a route handler cannot
 * coexist in one segment, which is exactly the point: there is one signup
 * form, at /signup.
 */
function redirectToSignup(request: NextRequest): NextResponse {
    return NextResponse.redirect(new URL('/signup', request.url), 301);
}

export function GET(request: NextRequest): NextResponse {
    return redirectToSignup(request);
}

export function HEAD(request: NextRequest): NextResponse {
    return redirectToSignup(request);
}
