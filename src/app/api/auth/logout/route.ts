import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/services/server-api';
import { SESSION_COOKIE, REFRESH_COOKIE, clearCookieOptions } from '@/lib/auth-cookies';

const REVOCATION_TIMEOUT_MS = 2000;

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  // Best-effort revocation of the backend refresh family. Always clear local
  // cookies regardless of the outcome (idempotent; safe with backend down).
  if (sessionCookie?.value) {
    try {
      await Promise.race([
        fetch(`${SERVER_API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionCookie.value}` },
        }),
        new Promise((resolve) => setTimeout(resolve, REVOCATION_TIMEOUT_MS)),
      ]);
    } catch {
      // Ignore network errors — local session must still be cleared.
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', clearCookieOptions());
  res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions());
  return res;
}
