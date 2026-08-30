import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/services/server-api';
import { SESSION_COOKIE, REFRESH_COOKIE, SESSION_COOKIE_MAX_AGE, authCookieOptions, clearCookieOptions } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const refreshCookie = request.cookies.get(REFRESH_COOKIE);

  if (!sessionCookie?.value && !refreshCookie?.value) {
    return NextResponse.json({ success: true, data: { authenticated: false } });
  }

  // 1) Try the access token.
  if (sessionCookie?.value) {
    const me = await callMe(sessionCookie.value);
    if (me.ok) {
      return NextResponse.json({
        success: true,
        data: { authenticated: true, user: me.data },
      });
    }
    // Access token expired/invalid -> fall through to refresh (AUTH-04).
  }

  // 2) Access token missing/expired: attempt refresh with the refresh cookie.
  if (refreshCookie?.value) {
    const refreshed = await tryRefresh(refreshCookie.value);
    if (refreshed.token) {
      const me = await callMe(refreshed.token);
      if (me.ok) {
        const res = NextResponse.json({
          success: true,
          data: { authenticated: true, user: me.data },
        });
        res.cookies.set(SESSION_COOKIE, refreshed.token, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));
        if (refreshed.refreshToken) {
          res.cookies.set(REFRESH_COOKIE, refreshed.refreshToken, authCookieOptions({ maxAge: SESSION_COOKIE_MAX_AGE }));
        }
        return res;
      }
    }
  }

  // 3) Nothing valid -> clear cookies, report unauthenticated.
  return clearAndReturnNotAuthenticated();
}

async function callMe(accessToken: string) {
  try {
    const response = await fetch(`${SERVER_API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { ok: false } as const;
    const result = await response.json();
    return { ok: true, data: result.data } as const;
  } catch {
    return { ok: false } as const;
  }
}

async function tryRefresh(refreshToken: string) {
  try {
    const response = await fetch(`${SERVER_API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return { token: null } as const;
    const result = await response.json();
    return {
      token: result.data?.accessToken as string | undefined,
      refreshToken: result.data?.refreshToken as string | undefined,
    };
  } catch {
    return { token: null } as const;
  }
}

function clearAndReturnNotAuthenticated() {
  const res = NextResponse.json({
    success: true,
    data: { authenticated: false },
  });
  res.cookies.set(SESSION_COOKIE, '', clearCookieOptions());
  res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions());
  return res;
}
