import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/services/server-api';
import { SESSION_COOKIE } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/v1/auth/ws-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionCookie.value}` },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || { code: 'UNAUTHORIZED', message: 'Could not obtain socket token.' } },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to obtain socket token.' } },
      { status: 500 }
    );
  }
}
