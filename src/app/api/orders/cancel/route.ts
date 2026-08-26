import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { notifyAllChannels } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, phone } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !phone) {
      return NextResponse.json({ error: 'Unauthorized or missing phone number' }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Orders Cancel] Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch Order from Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate Ownership
    if (user) {
      if (order.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (phone) {
      const orderPhone = order.shipping_address?.phone?.replace(/\D/g, '') || '';
      const inputPhone = phone.replace(/\D/g, '');
      if (orderPhone !== inputPhone && !orderPhone.endsWith(inputPhone) && !inputPhone.endsWith(orderPhone)) {
        return NextResponse.json({ error: 'Phone number does not match order' }, { status: 403 });
      }
    }

    if (order.status !== 'pending' || order.payment_status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be cancelled by user' }, { status: 400 });
    }

    // 2. Try cancelling in Midtrans
    let refundStatus = 'Cancelled before payment';
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProd = serverKey?.startsWith('SB-') ? false : (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true');
    const baseUrl = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    
    if (serverKey) {
      const authString = Buffer.from(serverKey + ':').toString('base64');
      try {
        await fetch(`${baseUrl}/v2/${order.id}/cancel`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` }
        });
      } catch (err) {
        console.error('Failed to cancel in Midtrans:', err);
      }
    }

    // 3. Update Order Status in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'cancelled',
        notes: (order.notes ? order.notes + '\n' : '') + `Cancelled by customer on ${new Date().toISOString()}.`
      })
      .eq('id', order.id);

    if (updateError) {
      throw updateError;
    }

    // 4. Revert Stock via Atomic RPC
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('restock_inventory', { p_order_id: order.id });
      if (rpcError) {
        console.error('[Customer Cancel API] RPC restock_inventory failed:', rpcError);
      } else {
        console.log(`[Customer Cancel API] Restocked inventory for cancelled Order ${order.id}`);
      }
    } catch (err) {
      console.error('[Customer Cancel API] Error during stock reversion:', err);
    }

    // 5. Notify customer
    if (order.user_id) {
      await notifyAllChannels({
        userId: order.user_id,
        title: 'Pesanan Dibatalkan',
        message: `Pesanan #${order.order_number || order.id} berhasil dibatalkan. Stok telah dikembalikan.`,
        actionLink: `/profile/orders/${order.id}`,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order cancelled successfully'
    });

  } catch (error: any) {
    console.error('Cancel Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel order' }, { status: 500 });
  }
}
