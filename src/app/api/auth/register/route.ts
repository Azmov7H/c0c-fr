import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/services/server-api';
import { SESSION_COOKIE, REFRESH_COOKIE, SESSION_COOKIE_MAX_AGE, authCookieOptions } from '@/lib/auth-cookies';
import { registerSchema } from '@/lib/auth-schemas';
import { enforceAuthBodyLimit, methodNotAllowed, readValidatedJson } from '@/lib/route-guards';

export function GET() {
  return methodNotAllowed(['POST']);
}

export async function POST(request: NextRequest) {
  const tooLarge = enforceAuthBodyLimit(request);
  if (tooLarge) return tooLarge;

  const parsed = await readValidatedJson(request, registerSchema);
  if (!parsed.ok) return parsed.response;
  const { email, password, firstName, lastName } = parsed.data;

  try {
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
