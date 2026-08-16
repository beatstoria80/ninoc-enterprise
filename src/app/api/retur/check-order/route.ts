import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';



export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get('order_id');
    const guest_email = searchParams.get('guest_email');

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    // Get current user (guest or authenticated) via server-side cookie session
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    const uid = user?.id || null;

    if (!uid && (!guest_email || !guest_email.includes('@'))) {
      return NextResponse.json({ error: 'Email wajib diisi untuk guest (contoh: nama@email.com)' }, { status: 400 });
    }

    // VALIDASI KEAMANAN: Pastikan order ID benar-benar ada di database dan statusnya valid
    const sanitizedOrderId = order_id.trim().toUpperCase();
    const { data: orderData, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, status, wa_delivered_sent_at, shipping_address, order_number, customer_name, total_price, order_items(*)')
      .eq('id', sanitizedOrderId)
      .maybeSingle();

    if (orderError || !orderData) {
      return NextResponse.json({ error: `Order '${sanitizedOrderId}' tidak valid atau tidak ditemukan di sistem.` }, { status: 404 });
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
        .eq('order_id', sanitizedOrderId)
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
        .eq('order_id', sanitizedOrderId)
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

    return NextResponse.json({ 
      order: {
        ...orderData,
        customer_email: orderData.shipping_address?.email || null,
        customer_phone: orderData.shipping_address?.phone || null
      }
    }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/retur/check-order]', err);
    return NextResponse.json({ error: 'Failed to check order data' }, { status: 500 });
  }
}
