import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

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

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
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

    // 4. Revert Stock (+1 for each item)
    if (order.order_items && order.order_items.length > 0) {
      for (const item of order.order_items) {
        if (!item.product_id) continue;
        
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
          
        if (product && typeof product.stock === 'number') {
          await supabaseAdmin
            .from('products')
            .update({ stock: product.stock + (item.quantity || 1) })
            .eq('id', item.product_id);
        }
      }
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
