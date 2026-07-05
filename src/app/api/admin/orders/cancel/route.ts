import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
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
      if (biteshipToken) {
        try {
          const bRes = await fetch(`https://api.biteship.com/v1/orders/${order.tracking_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${biteshipToken}`,
              'Content-Type': 'application/json'
            }
          });
          const bData = await bRes.json();
          console.log('Biteship Cancel Response:', bData);
        } catch (err) {
          console.error('Failed to cancel Biteship order:', err);
          // Continue cancellation process even if Biteship fails
        }
      }
    }

    // 3. Midtrans Refund (if paid)
    let refundStatus = 'Not Applicable';
    if (order.status === 'paid' || order.status === 'shipped') {
      const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      const baseUrl = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      if (serverKey) {
        const authString = Buffer.from(serverKey + ':').toString('base64');
        try {
          const mRes = await fetch(`${baseUrl}/v2/${order.id}/refund`, {
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
          console.log('Midtrans Refund Response:', mData);
          if (mData.status_code === '200') {
            refundStatus = 'Refunded via Midtrans';
          } else {
            refundStatus = `Manual Refund Required (${mData.status_message || 'Unsupported Method'})`;
          }
        } catch (err) {
          console.error('Failed to refund via Midtrans:', err);
          refundStatus = 'Manual Refund Required (API Error)';
        }
      }
    } else if (order.status === 'pending') {
      // If just pending, try to cancel it in Midtrans instead of refund
      const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      const baseUrl = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      if (serverKey) {
        const authString = Buffer.from(serverKey + ':').toString('base64');
        fetch(`${baseUrl}/v2/${order.id}/cancel`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` }
        }).catch(e => console.error(e));
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

    // 5. Revert Stock (Call Supabase RPC and manual variant stock backup)
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('restock_inventory', { p_order_id: order.id });
      if (rpcError) {
        console.warn('RPC restock_inventory failed or not found, falling back to manual variant stock update:', rpcError);
        if (order.order_items && order.order_items.length > 0) {
          for (const item of order.order_items) {
            const qty = item.quantity || 1;
            if (item.variant_id) {
              const { data: variant } = await supabaseAdmin
                .from('variants')
                .select('stock_quantity')
                .eq('id', item.variant_id)
                .single();
              if (variant && typeof variant.stock_quantity === 'number') {
                await supabaseAdmin
                  .from('variants')
                  .update({ stock_quantity: variant.stock_quantity + qty })
                  .eq('id', item.variant_id);
              }
            } else if (item.product_id) {
              const { data: variants } = await supabaseAdmin
                .from('variants')
                .select('id, stock_quantity')
                .eq('product_id', item.product_id)
                .limit(1);
              if (variants && variants.length > 0 && typeof variants[0].stock_quantity === 'number') {
                await supabaseAdmin
                  .from('variants')
                  .update({ stock_quantity: variants[0].stock_quantity + qty })
                  .eq('id', variants[0].id);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during stock reversion:', err);
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
