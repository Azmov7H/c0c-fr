import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';

const API_URL = config.apiUrl;

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

    // Forward login request to external backend
    const response = await fetch(`${API_URL}/auth/login`, {
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

    const { user, accessToken } = result.data;

    // Create the response with user data
    const res = NextResponse.json({
      success: true,
      data: { user },
    });

    // Set httpOnly cookie for the access token (secure, not accessible to JS)
    res.cookies.set('auth_session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set a separate cookie with user info for middleware checks (non-sensitive)
    res.cookies.set('user_info', JSON.stringify({ id: user.id, email: user.email }), {
      httpOnly: false, // Readable by client for display purposes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process login request.' } },
      { status: 500 }
    );
  }
}
