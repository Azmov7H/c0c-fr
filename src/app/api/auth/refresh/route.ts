import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/services/server-api';
import { SESSION_COOKIE, REFRESH_COOKIE, SESSION_COOKIE_MAX_AGE, authCookieOptions, clearCookieOptions } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const refreshTokenCookie = request.cookies.get(REFRESH_COOKIE);

  // A valid session should exist to refresh. Without a refresh cookie there is
  // nothing we can rotate, so fail idempotently and clear stale cookies.
  if (!refreshTokenCookie?.value && !sessionCookie?.value) {
    return clearAndReturnUnauthorized();
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenCookie?.value }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Invalid/expired refresh token -> clear cookies (idempotent 401).
      return clearAndReturnUnauthorized();
    }

    const { accessToken, refreshToken } = result.data;

    const res = NextResponse.json({
      success: true,
      data: { authenticated: true },
    });

    res.cookies.set(SESSION_COOKIE, accessToken, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));
    if (refreshToken) {
      res.cookies.set(REFRESH_COOKIE, refreshToken, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));
    }

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to refresh session.' } },
      { status: 500 }
    );
  }
}

function clearAndReturnUnauthorized() {
  const res = NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Session is no longer valid.' } },
    { status: 401 }
  );
  res.cookies.set(SESSION_COOKIE, '', clearCookieOptions());
  res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions());
  return res;
}
