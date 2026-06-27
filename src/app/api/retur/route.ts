import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Auth check
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    let query = adminClient
      .from('retur_requests')
      .select('*, user:user_id(id, email, raw_user_meta_data)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user) {
      // Check if admin
      const { data: roleData } = await adminClient
        .from('admin_roles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const isAdmin = roleData && ['super_admin', 'outbound_logistics', 'admin'].includes(roleData.role);
      
      // If NOT admin, force query to only show their own returns
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      } else {
        // If admin, they can explicitly filter by a specific user_id if they want
        const requestedUserId = searchParams.get('user_id');
        if (requestedUserId) {
          query = query.eq('user_id', requestedUserId);
        }
      }
    } else {
      // Unauthenticated users see nothing
      return NextResponse.json({ retur_requests: [], total: 0 });
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (orderId) {
      query = query.ilike('order_id', `%${orderId}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let returRequests = data || [];

    // Fetch related orders manually since order_id is a TEXT field without FK
    if (returRequests.length > 0) {
      const orderIds = returRequests.map((r: any) => r.order_id);
      const { data: orders } = await adminClient
        .from('orders')
        .select('id, total_price, status, order_items(id, product_name, quantity, price_at_purchase)')
        .in('id', orderIds);
      
      if (orders) {
        const orderMap = orders.reduce((acc: any, order: any) => {
          acc[order.id] = order;
          return acc;
        }, {});
        
        returRequests = returRequests.map((r: any) => ({
          ...r,
          order: orderMap[r.order_id] || null,
        }));
      }
    }

    return NextResponse.json({ retur_requests: returRequests, total: count });
  } catch (err) {
    console.error('[GET /api/retur]', err);
    return NextResponse.json({ error: 'Failed to fetch retur requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      reason,
      reason_label,
      description,
      video_url,
      video_duration_seconds,
      video_filename,
      ticket_id,
      user_id: body_user_id,
      guest_email,
      return_type,
    } = body;

    if (!order_id || !reason || !reason_label) {
      return NextResponse.json({ error: 'order_id, reason, and reason_label are required' }, { status: 400 });
    }

    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    if (!video_url && isProduction) {
      return NextResponse.json({ error: 'Bukti video WAJIB — upload video sebelum submit retur' }, { status: 400 });
    }

    // Get current user (guest or authenticated) via server-side cookie session
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    const uid = user?.id || body_user_id || null;

    // If no user_id, guest_email is required
    if (!uid && !guest_email?.includes('@')) {
      return NextResponse.json({ error: 'Email wajib diisi untuk guest (contoh: nama@email.com)' }, { status: 400 });
    }

    // Duplicate check: check by user_id OR by order_id + guest_email
    if (uid) {
      const { data: existing } = await adminClient
        .from('retur_requests')
        .select('id, status')
        .eq('order_id', order_id)
        .eq('user_id', uid)
        .in('status', ['pending', 'reviewed'])
        .maybeSingle();
      if (existing) {
        return NextResponse.json({
          error: `Pengajuan retur untuk order ini sudah ada (status: ${existing.status}). Gunakan tiket yang sudah ada.`
        }, { status: 409 });
      }
    } else if (guest_email) {
      const { data: existing } = await adminClient
        .from('retur_requests')
        .select('id, status')
        .eq('order_id', order_id)
        .eq('guest_email', guest_email)
        .in('status', ['pending', 'reviewed'])
        .maybeSingle();
      if (existing) {
        return NextResponse.json({
          error: `Pengajuan retur untuk order ini sudah ada (status: ${existing.status}). Gunakan tiket yang sudah ada.`
        }, { status: 409 });
      }
    }

    // Fraud detection: flag if video duration < 30 seconds
    const fraudSuspected = video_duration_seconds && video_duration_seconds < 30;
    const fraudReasons: string[] = [];
    if (fraudSuspected) fraudReasons.push('Durasi video kurang dari 30 detik — kurang dari minimum yang diizinkan (1-shot, 30 detik)');

    const { data, error } = await adminClient
      .from('retur_requests')
      .insert({
        user_id: uid,
        guest_email: uid ? null : guest_email,
        order_id,
        reason,
        reason_label,
        description,
        video_url,
        video_duration_seconds,
        video_filename,
        ticket_id,
        status: 'pending',
        fraud_suspected: fraudSuspected,
        fraud_reasons: fraudReasons,
        return_type: return_type || 'refund',
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (uid) {
      await adminClient.from('customer_activity_log').insert({
        user_id: uid,
        activity_type: 'retur_submitted',
        description: `Retur diajukan untuk order ${order_id}`,
        metadata: { retur_id: data.id, order_id, reason },
      });
    }

    return NextResponse.json({ retur_request: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/retur]', err);
    return NextResponse.json({ error: 'Failed to create retur request' }, { status: 500 });
  }
}