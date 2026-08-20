import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { notifyAllChannels } from '@/lib/notifications';
import { sendEmailOrderCancelled } from '@/lib/email';
import { sendCancelledWA, formatPhoneNumber } from '@/lib/whatsapp';
import { createClient } from '@/utils/supabase/server';

const supabaseAdmin = getSupabaseAdmin();

export async function POST(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access. Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, reason = 'Cancelled by Admin' } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch Order from Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }

    // 2. Biteship Cancel Pickup (if shipped)
    if (order.status === 'shipped' && order.tracking_id) {
      const biteshipToken = process.env.BITESHIP_API_KEY;
      const isMockWaybill = order.tracking_id.startsWith('NNC-') || !biteshipToken || biteshipToken === 'your_biteship_api_key_here';

      if (!isMockWaybill && biteshipToken) {
        try {
          // NOTE: Biteship API v1 expects raw API key in Authorization header WITHOUT 'Bearer ' prefix
          const bRes = await fetch(`https://api.biteship.com/v1/orders/${order.tracking_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': biteshipToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cancellation_reason: reason })
          });
          const bData = await bRes.json();
          console.log('[Admin Cancel API] Biteship Cancel Response:', bData);
        } catch (err) {
          console.error('[Admin Cancel API] Failed to cancel Biteship order:', err);
          // Continue cancellation process even if logistics partner API encounters latency/error
        }
      } else {
        console.log(`[Admin Cancel API] Skipped external Biteship API call for mock/sandbox waybill: ${order.tracking_id}`);
      }
    }

    // 3. Midtrans Refund (if paid or shipped)
    let refundStatus = 'Not Applicable';
    if (order.status === 'paid' || order.status === 'shipped') {
      const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      const baseUrl = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const targetTxId = order.midtrans_id || order.id;

      // Only attempt gateway refund if Midtrans key exists and order wasn't paid 100% via points (REDEEM) or manual COD
      if (serverKey && (order.payment_status === 'success' || order.midtrans_id || order.snap_token)) {
        const authString = Buffer.from(serverKey + ':').toString('base64');
        try {
          const mRes = await fetch(`${baseUrl}/v2/${targetTxId}/refund`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Basic ${authString}`
            },
            body: JSON.stringify({
              refund_key: `refund-${order.id}-${Date.now()}`,
              amount: order.total_price,
              reason: reason
            })
          });
          const mData = await mRes.json();
          console.log('[Admin Cancel API] Midtrans Refund Response:', mData);
          if (mData.status_code === '200') {
            refundStatus = 'Refunded via Midtrans';
          } else {
            refundStatus = `Manual Refund Required (${mData.status_message || 'Unsupported Method'})`;
          }
        } catch (err) {
          console.error('[Admin Cancel API] Failed to refund via Midtrans:', err);
          refundStatus = 'Manual Refund Required (Gateway API Error)';
        }
      } else {
        refundStatus = 'Manual Refund Required (Non-Gateway or Points Payment)';
      }
    } else if (order.status === 'pending') {
      // If pending, cancel transaction in Midtrans gateway
      const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      const baseUrl = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const targetTxId = order.midtrans_id || order.id;
      if (serverKey) {
        const authString = Buffer.from(serverKey + ':').toString('base64');
        try {
          const cRes = await fetch(`${baseUrl}/v2/${targetTxId}/cancel`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` }
          });
          const cData = await cRes.json();
          console.log('[Admin Cancel API] Midtrans Cancel Response:', cData);
        } catch (e) {
          console.error('[Admin Cancel API] Midtrans Pending Cancel Error:', e);
        }
      }
      refundStatus = 'Cancelled before payment';
    }

    // 4. Update Order Status in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'cancelled',
        notes: (order.notes ? order.notes + '\n' : '') + `Cancelled on ${new Date().toISOString()}: ${reason}. Refund Status: ${refundStatus}`
      })
      .eq('id', order.id);

    if (updateError) {
      throw updateError;
    }

    // 5. Revert Stock via Atomic RPC
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('restock_inventory', { p_order_id: order.id });
      if (rpcError) {
        console.error('[Admin Cancel API] RPC restock_inventory failed:', rpcError);
      } else {
        console.log(`[Admin Cancel API] Restocked inventory for cancelled Order ${order.id}`);
      }
    } catch (err) {
      console.error('[Admin Cancel API] Error during stock reversion:', err);
    }

    // 6. Multi-Channel Customer & Admin Feedback Engine (Critical Safety & Refund Feedback)
    try {
      const shippingAddr = order.shipping_address as Record<string, any> | null;
      const customerEmail = order.customer_email || shippingAddr?.email;
      const rawPhone = shippingAddr?.phone || '';
      const customerName = order.customer_name || shippingAddr?.name || 'Pelanggan';
      const orderNum = order.order_number || order.id.toUpperCase();

      // 6a. Send In-App & Web Push Notification
      if (order.user_id) {
        await notifyAllChannels({
          userId: order.user_id,
          title: 'Pesanan Dibatalkan Admin',
          message: `Pesanan #${orderNum} telah dibatalkan oleh Admin NINOC karena: ${reason}. Status Refund: ${refundStatus}.`,
          actionLink: `/profile/orders/${order.id}`,
        });
      }

      // 6b. Send Professional Email Notice
      if (customerEmail) {
        await sendEmailOrderCancelled(order, customerEmail, reason, refundStatus);
      }

      // 6c. Send WhatsApp Notice
      const formattedPhone = formatPhoneNumber(rawPhone);
      if (formattedPhone) {
        await sendCancelledWA({
          phone: formattedPhone,
          customer_name: customerName,
          order_id: orderNum,
          reason: reason,
          refund_status: refundStatus,
        }).catch(err => console.error('[Admin Cancel API] WA Send Error:', err));
      }
    } catch (notifyErr) {
      console.error('[Admin Cancel API] Failed to execute feedback notifications:', notifyErr);
      // Don't fail the cancellation response if notifications encounter network issues
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      refund_status: refundStatus
    });

  } catch (error: any) {
    console.error('Cancel Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel order' }, { status: 500 });
  }
}
