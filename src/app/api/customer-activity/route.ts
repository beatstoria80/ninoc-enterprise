import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      guest_session_id,
      activity_type,
      description,
      metadata,
    } = body;

    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 });
    }

    // Get user if authenticated
    let actualUserId = user_id;
    let actualGuestSession = guest_session_id;

    if (!actualUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      actualUserId = user?.id || undefined;
      actualGuestSession = user ? undefined : (guest_session_id || `guest-${Date.now()}`);
    }

    const { data, error } = await supabase
      .from('customer_activity_log')
      .insert({
        user_id: actualUserId || null,
        guest_session_id: actualGuestSession || null,
        activity_type,
        description: description || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ activity: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/customer-activity]', err);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('customer_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ activities: data });
  } catch (err) {
    console.error('[GET /api/customer-activity]', err);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
