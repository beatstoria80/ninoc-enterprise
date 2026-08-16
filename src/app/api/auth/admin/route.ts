import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const correctUsername = process.env.ADMIN_USERNAME || 'superadmin';
    const correctPassword = process.env.ADMIN_SECRET_PASSWORD || 'Hitamputih#100';

    const isAuthorized = username?.toLowerCase() === correctUsername.toLowerCase() && password === correctPassword;

    if (isAuthorized) {
      // Set HttpOnly cookie for legacy checks
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'admin_session',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        secure: req.url.startsWith('https://'),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      // SYNC WITH SUPABASE AUTH (RLS BYPASS FIX)
      // 1. Force the admin@ninoc.store password to be the global secret (guarantees we can log in)
      
      
      const email = 'admin@ninoc.store';
      
      // Find the admin user
      const { data: adminUsers } = await adminClient.auth.admin.listUsers();
      const existingAdmin = adminUsers?.users?.find(u => u.email === email);
      
      if (!existingAdmin) {
        await adminClient.auth.admin.createUser({
          email,
          password: correctPassword,
          email_confirm: true,
        });
      } else {
        await adminClient.auth.admin.updateUserById(existingAdmin.id, {
          password: correctPassword
        });
      }
      
      // 2. Sign in via SSR client so cookies are properly attached to the response
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch (error) {
                // Ignore
              }
            },
          },
        }
      );
      
      await supabase.auth.signInWithPassword({
        email,
        password: correctPassword
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
