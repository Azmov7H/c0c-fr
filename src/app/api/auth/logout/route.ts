import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';

const API_URL = config.apiUrl;

export async function POST(request: NextRequest) {
  try {
    // Try to notify backend of logout (non-blocking, fire-and-forget)
    const sessionCookie = request.cookies.get('auth_session');
    if (sessionCookie?.value) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionCookie.value}` },
      }).catch(() => {});
    }
  } catch {
    // Ignore errors — always clear cookies regardless
  }

  const res = NextResponse.json({ success: true });

  // Clear auth cookies
  res.cookies.set('auth_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('user_info', '', { httpOnly: false, path: '/', maxAge: 0 });

  return res;
}
