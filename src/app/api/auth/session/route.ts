import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';

const API_URL = config.apiUrl;

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth_session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'No session found.' } },
        { status: 401 }
      );
    }

    // Fetch user profile from backend using the token
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionCookie.value}` },
    });

    if (!response.ok) {
      // Token expired or invalid — clear cookies
      const res = NextResponse.json(
        { success: false, error: { code: 'INVALID_SESSION', message: 'Session expired.' } },
        { status: 401 }
      );
      res.cookies.set('auth_session', '', { httpOnly: true, path: '/', maxAge: 0 });
      res.cookies.set('user_info', '', { httpOnly: false, path: '/', maxAge: 0 });
      return res;
    }

    const result = await response.json();
    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch session.' } },
      { status: 500 }
    );
  }
}
