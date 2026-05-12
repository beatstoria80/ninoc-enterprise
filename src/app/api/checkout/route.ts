import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { supabase } from '@/lib/supabase';

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

export async function POST(req: Request) {
  try {
    const { items, customerDetails, shippingDetails, totalPrice } = await req.json();

    // Debug: Log env vars (remove in production)
    console.log('[Checkout] MIDTRANS_SERVER_KEY present:', !!process.env.MIDTRANS_SERVER_KEY);
    console.log('[Checkout] MIDTRANS_IS_PRODUCTION:', process.env.MIDTRANS_IS_PRODUCTION);

    // Initialize Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

    const orderId = `NINOC-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalPrice
      },
      customer_details: {
        first_name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        billing_address: {
          address: customerDetails.address,
          city: customerDetails.city,
          postal_code: customerDetails.postal_code
        },
        shipping_address: {
          first_name: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone,
          address: customerDetails.address,
          city: customerDetails.city,
          postal_code: customerDetails.postal_code
        }
      },
      item_details: [
        ...items.map((item: CheckoutItem) => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
          name: item.name
        })),
        {
          id: 'SHIPPING',
          price: shippingDetails.cost,
          quantity: 1,
          name: `Courier: ${shippingDetails.method.toUpperCase()}`
        }
      ],
      credit_card: {
        secure: true
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // 1. Save order header to Supabase
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: customerDetails.user_id || null,
        customer_name: customerDetails.name || null,
        total_price: totalPrice,
        status: 'pending',
        snap_token: transaction.token,
        courier: shippingDetails.method,
        shipping_address: {
          ...customerDetails,
          shipping_method: shippingDetails.method,
          shipping_cost: shippingDetails.cost
        }
      });

    if (orderError) {
      console.error('Supabase Order Error:', orderError);
      // Don't block transaction if DB save fails, but log it
    }

    // 2. Save individual order items
    if (items.length > 0) {
      const orderItems = items.map((item: CheckoutItem) => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        size: item.size || null,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Supabase Order Items Error:', itemsError);
      }
    }

    return NextResponse.json({ token: transaction.token, orderId });
  } catch (err) {
    const error = err as Error;
    console.error('Midtrans API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
