import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { sendEmailReturConfirmation } from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withErrorHandler, apiSuccess, apiBadRequest, apiNotFound, apiForbidden, apiConflict, apiInternalError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// ============================================================================
// NINOC ENTERPRISE — RETUR & REFUND REQUESTS ENDPOINT (PRODUCTION-GRADE)
// ============================================================================
// Features:
// 1. Singleton Database Pool: Uses @/lib/supabaseAdmin to prevent memory bloat
// 2. Standardized Responses: All handlers wrapped in withErrorHandler
// 3. Deduplicated Relational Queries: O(1) deduplication of order IDs in GET
// 4. Environment-Aware Security Guards: Enforces strict unboxing video and 48h
//    claim windows in production while permitting sandbox testing
// ============================================================================

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  // 1. Auth & Role Verification
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: roleData } = await supabaseAdmin
      .from('admin_roles')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();
    
    isAdmin = !!roleData && ['super_admin', 'outbound_logistics', 'admin'].includes(roleData.role);
  }

  // Fallback for cookie-based admin session
  const cookieStore = await cookies();
  if (cookieStore.get('admin_session')?.value === 'authenticated') {
    isAdmin = true;
  }

  if (!isAdmin && !user) {
    return apiSuccess({ retur_requests: [], total: 0 });
  }

  // 2. Build Query
  let query = supabaseAdmin
    .from('retur_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!isAdmin && user) {
    query = query.eq('user_id', user.id);
  } else if (isAdmin) {
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
  if (error) {
    return apiInternalError('Database query error while fetching retur requests', error.message);
  }

  let returRequests = data || [];

  // 3. Deduplicated Relational Join for Orders
  if (returRequests.length > 0) {
    const uniqueOrderIds = Array.from(new Set(returRequests.map((r: any) => r.order_id).filter(Boolean)));
    
    if (uniqueOrderIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, total_price, status, customer_name, customer_email, customer_phone, shipping_address, refund_bank_details, order_items(id, product_id, variant_id, product_name, size, color, quantity, price_at_purchase)')
        .in('id', uniqueOrderIds);
      
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
  }

  return apiSuccess({
    retur_requests: returRequests,
    total: count || returRequests.length,
    limit,
    offset,
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
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
    return apiBadRequest('order_id, reason, and reason_label are required fields.');
  }

  const isProd = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

  // 1. Production Security Guard: Require Video Unboxing in Production
  if (isProd && (!video_url || video_url.trim() === '')) {
    return apiBadRequest('Bukti video WAJIB — upload video unboxing sebelum mengajukan klaim retur atau refund.');
  }

  // 2. Identify Submitter
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  const uid = user?.id || body_user_id || null;

  if (!uid && !guest_email?.includes('@')) {
    return apiBadRequest('Email wajib diisi untuk pelanggan guest (contoh: nama@email.com).');
  }

  // 3. Verify Order Existence & Status
  const sanitizedOrderId = String(order_id).trim().toUpperCase();
  const { data: orderData, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, wa_delivered_sent_at, shipping_address, order_number, order_items(id, product_id, product_name)')
    .eq('id', sanitizedOrderId)
    .maybeSingle();

  if (orderError || !orderData) {
    return apiNotFound(`Order '${sanitizedOrderId}' tidak valid atau tidak ditemukan di sistem.`);
  }

  // 4. Production Status & Time Window Validation
  if (isProd) {
    const allowedStatuses = ['shipped', 'delivered', 'completed'];
    if (!allowedStatuses.includes(orderData.status.toLowerCase())) {
      return apiBadRequest(`Pesanan belum dapat diretur karena status saat ini adalah '${orderData.status}'.`);
    }

    if (orderData.wa_delivered_sent_at) {
      const deliveredTime = new Date(orderData.wa_delivered_sent_at).getTime();
      const diffHours = (Date.now() - deliveredTime) / (1000 * 60 * 60);
      if (diffHours > 48) {
        return apiBadRequest('Batas waktu klaim retur telah kedaluwarsa. Maksimal pengajuan adalah 2x24 jam sejak paket dinyatakan Diterima.');
      }
    }
  }

  // 5. Ownership Verification
  if (uid && orderData.user_id && orderData.user_id !== uid) {
    return apiForbidden('Order ini tidak terdaftar pada akun Anda.');
  }

  // 6. Duplicate Submission Prevention
  if (isProd || uid || guest_email) {
    const duplicateQuery = supabaseAdmin
      .from('retur_requests')
      .select('id, status')
      .eq('order_id', sanitizedOrderId)
      .in('status', ['pending', 'reviewed']);

    if (uid) {
      duplicateQuery.eq('user_id', uid);
    } else if (guest_email) {
      duplicateQuery.eq('guest_email', guest_email);
    }

    const { data: existing } = await duplicateQuery.maybeSingle();
    if (existing) {
      return apiConflict(`Pengajuan retur untuk order ini sudah ada (status: ${existing.status}). Gunakan tiket yang sudah terdaftar.`);
    }
  }

  // 7. Fraud Analysis
  const fraudSuspected = typeof video_duration_seconds === 'number' && video_duration_seconds < 30;
  const fraudReasons: string[] = [];
  if (fraudSuspected) {
    fraudReasons.push('Durasi video kurang dari 30 detik (minimum standar 1-shot unboxing adalah 30 detik)');
  }

  // 8. Insert Request
  const { data, error } = await supabaseAdmin
    .from('retur_requests')
    .insert({
      user_id: uid,
      guest_email: uid ? null : guest_email,
      order_id: sanitizedOrderId,
      reason,
      reason_label,
      description: description || null,
      video_url: video_url || null,
      video_duration_seconds: video_duration_seconds || null,
      video_filename: video_filename || null,
      ticket_id: ticket_id || `RET-${Date.now()}`,
      status: 'pending',
      fraud_suspected: fraudSuspected,
      fraud_reasons: fraudReasons,
      return_type: return_type || 'refund',
    })
    .select()
    .single();

  if (error) {
    return apiInternalError('Failed to record retur request in database', error.message);
  }

  // 9. Asynchronous Activity Logging & Notification
  if (uid) {
    void (async () => {
      try {
        await supabaseAdmin.from('customer_activity_log').insert({
          user_id: uid,
          activity_type: 'retur_submitted',
          description: `Retur diajukan untuk order ${sanitizedOrderId}`,
          metadata: { retur_id: data.id, order_id: sanitizedOrderId, reason },
        });
      } catch (err) {
        console.error('[ActivityLog Error]', err);
      }
    })();
  }

  let targetEmail = guest_email;
  if (uid && !targetEmail) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (userData?.user?.email) {
      targetEmail = userData.user.email;
    }
  }

  if (targetEmail) {
    sendEmailReturConfirmation(data, orderData, targetEmail).catch(err => {
      console.error('[Retur Email Error]', err);
    });
  }

  return apiSuccess({
    message: 'Retur request successfully created.',
    retur_request: data,
  }, 201);
});