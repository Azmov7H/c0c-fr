import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/services/server-api';
import { SESSION_COOKIE, REFRESH_COOKIE, SESSION_COOKIE_MAX_AGE, authCookieOptions } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'All fields are required.' } },
        { status: 400 }
      );
    }

    const response = await fetch(`${SERVER_API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || { code: 'REGISTER_FAILED', message: 'Failed to create account.' } },
        { status: response.status }
      );
    }

    const { user, accessToken, refreshToken } = result.data;

    const res = NextResponse.json({
      success: true,
      data: { user },
    });

    res.cookies.set(SESSION_COOKIE, accessToken, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));

    if (refreshToken) {
      res.cookies.set(REFRESH_COOKIE, refreshToken, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));
    }

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process registration.' } },
      { status: 500 }
    );
  }
}
