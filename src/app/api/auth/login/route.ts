import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/services/server-api';
import { SESSION_COOKIE, REFRESH_COOKIE, SESSION_COOKIE_MAX_AGE, authCookieOptions } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' } },
        { status: 400 }
      );
    }

    const response = await fetch(`${SERVER_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || { code: 'LOGIN_FAILED', message: 'Invalid credentials.' } },
        { status: response.status }
      );
    }

    const { user, accessToken, refreshToken } = result.data;

    const res = NextResponse.json({
      success: true,
      data: { user },
    });

    // Session cookie (access token) tracks the refresh lifetime (AUTH-03).
    res.cookies.set(SESSION_COOKIE, accessToken, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));

    // Refresh cookie is owned server-side by the BFF (AUTH-04).
    if (refreshToken) {
      res.cookies.set(REFRESH_COOKIE, refreshToken, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));
    }

    // No user_info (PII) cookie (AUTH-02.2); user data via GET /api/auth/session.

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process login request.' } },
      { status: 500 }
    );
  }
}
