import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';

const API_URL = config.apiUrl;

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

    // Forward register request to external backend
    const response = await fetch(`${API_URL}/auth/register`, {
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

    const { user, accessToken } = result.data;

    const res = NextResponse.json({
      success: true,
      data: { user },
    });

    // Set httpOnly cookie
    res.cookies.set('auth_session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set user info cookie (non-sensitive, client-readable)
    res.cookies.set('user_info', JSON.stringify({ id: user.id, email: user.email }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process registration.' } },
      { status: 500 }
    );
  }
}
