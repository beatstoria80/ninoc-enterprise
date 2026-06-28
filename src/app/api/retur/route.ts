import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { sendEmailReturConfirmation } from '@/lib/email';
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
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    let isAdmin = false;

    if (user) {
      // Check if admin
      const { data: roleData } = await adminClient
        .from('admin_roles')
        .select('role')
        .eq('email', user.email)
        .single();
      
      isAdmin = !!roleData && ['super_admin', 'outbound_logistics', 'admin'].includes(roleData.role);
    }

    // Fallback for custom admin login that bypasses Supabase Auth
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value === 'authenticated') {
      isAdmin = true;
    }

    if (!isAdmin && !user) {
      // Unauthenticated users see nothing
      return NextResponse.json({ retur_requests: [], total: 0 });
    }

    if (!isAdmin && user) {
      // If NOT admin, force query to only show their own returns
      query = query.eq('user_id', user.id);
    } else if (isAdmin) {
      // If admin, they can explicitly filter by a specific user_id if they want
      const requestedUserId = searchParams.get('user_id');
      if (requestedUserId) {
        query = query.eq('user_id', requestedUserId);
      }
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
        .select('id, total_price, status, customer_email, customer_phone, shipping_address, order_items(id, product_id, variant_id, product_name, size, color, quantity, price_at_purchase)')
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

    if (!video_url || video_url.trim() === '') {
      return NextResponse.json({ error: 'Bukti video WAJIB — upload video unboxing sebelum submit retur' }, { status: 400 });
    }

    // Get current user (guest or authenticated) via server-side cookie session
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    const uid = user?.id || body_user_id || null;

    // If no user_id, guest_email is required
    if (!uid && !guest_email?.includes('@')) {
      return NextResponse.json({ error: 'Email wajib diisi untuk guest (contoh: nama@email.com)' }, { status: 400 });
    }

    // VALIDASI KEAMANAN: Pastikan order ID benar-benar ada di database dan statusnya valid
    const sanitizedOrderId = order_id.trim().toUpperCase();
    const { data: orderData, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, status, wa_delivered_sent_at, shipping_address, order_number')
      .eq('id', sanitizedOrderId)
      .maybeSingle();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order tidak valid atau tidak ditemukan di sistem.' }, { status: 404 });
    }

    // Hanya pesanan yang sudah dikirim atau selesai yang boleh diretur
    const allowedStatuses = ['shipped', 'delivered', 'completed'];
    if (!allowedStatuses.includes(orderData.status.toLowerCase())) {
      return NextResponse.json({ error: `Pesanan belum dapat diretur (Status: ${orderData.status}).` }, { status: 400 });
    }

    // Validasi 2x24 jam sejak paket diterima (jika ada data delivered)
    if (orderData.wa_delivered_sent_at) {
      const deliveredTime = new Date(orderData.wa_delivered_sent_at).getTime();
      const nowTime = Date.now();
      const diffHours = (nowTime - deliveredTime) / (1000 * 60 * 60);
      
      if (diffHours > 48) {
        return NextResponse.json({ 
          error: 'Batas waktu klaim retur telah kedaluwarsa. Maksimal pengajuan adalah 2x24 jam sejak pesanan diterima dari kurir.' 
        }, { status: 400 });
      }
    }

    // Validasi kepemilikan order (jika user login)
    if (uid && orderData.user_id && orderData.user_id !== uid) {
      return NextResponse.json({ error: 'Order ini tidak terdaftar pada akun Anda.' }, { status: 403 });
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
          error: `Pengajuan retur untuk order ini sudah ada (status: ${existing.status}). Gunakan tiket yang sudah ada.`,
          code: 'ALREADY_EXISTS'
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
          error: `Pengajuan retur untuk order ini sudah ada (status: ${existing.status}). Gunakan tiket yang sudah ada.`,
          code: 'ALREADY_EXISTS'
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
        order_id: sanitizedOrderId,
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

    // Send Email Confirmation
    let targetEmail = guest_email;
    if (uid && !targetEmail) {
      const { data: userData } = await adminClient.auth.admin.getUserById(uid);
      if (userData?.user?.email) {
        targetEmail = userData.user.email;
      }
    }

    if (targetEmail) {
      // Intentionally not awaiting so it doesn't block the API response
      sendEmailReturConfirmation(data, orderData, targetEmail).catch(console.error);
    }

    return NextResponse.json({ retur_request: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/retur]', err);
    return NextResponse.json({ error: 'Failed to create retur request' }, { status: 500 });
  }
}