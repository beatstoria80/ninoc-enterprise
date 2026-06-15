import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const correctPassword = process.env.ADMIN_SECRET_PASSWORD || 'adminninoc123';

    // Allow new custom access (username: adm, password: 111) OR fallback to the default global admin password
    const isAuthorized = (username === 'adm' && password === '111') || (password === correctPassword);

    if (isAuthorized) {
      // Set HttpOnly cookie
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'admin_session',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !req.url.includes('localhost'),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
