import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';



export async function POST(req: NextRequest) {
  try {
    // Basic auth check
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ success: false, message: 'Invalid data format' }, { status: 400 });
    }

    // Upsert all updates
    for (const update of updates) {
      const { error } = await adminClient
        .from('product_costings')
        .upsert(update, { onConflict: 'product_id' });
        
      if (error) {
        throw new Error(error.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving costings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
