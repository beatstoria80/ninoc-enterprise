import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Initialize a supabase client with the service role key to bypass RLS and access auth.users


export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists in auth.users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('[check-email] Error fetching users:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const isRegistered = users.some((user) => user.email === email);

    return NextResponse.json({ isRegistered });
  } catch (err) {
    console.error('[check-email] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
