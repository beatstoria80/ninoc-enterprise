import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import midtransClient from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Use Service Role Key to bypass RLS since this is a secure server route
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  size_surcharge?: number;
}

export async function POST(req: Request) {
  try {
    // Affiliate Tracking
    let affiliate_id = null;
    try {
      const cookieStore = cookies();
      // next@15+ requires await cookies(), but handling dynamically:
      const resolvedCookies = await Promise.resolve(cookieStore);
      const affiliateRef = resolvedCookies.get('ninoc_affiliate_ref')?.value;
      
      if (affiliateRef) {
        const { data: affData } = await supabaseAdmin
          .from('affiliates')
          .select('id')
          .eq('code', affiliateRef)
          .single();
        
        if (affData) {
          affiliate_id = affData.id;
        }
      }
    } catch (e) {
      console.error("Error reading affiliate cookie:", e);
    }

    const { items, customerDetails, shippingDetails, fees = { tax: 0, platformFee: 0 }, totalPrice } = await req.json();

    // Calculate grossAmount exactly from item_details to satisfy Midtrans validation
    let calculatedGrossAmount = 0;

    const finalItemDetails = [
      ...items.map((item: CheckoutItem) => {
        const itemPrice = item.price + (item.size_surcharge || 0);
        calculatedGrossAmount += itemPrice * item.quantity;
        return {
          id: item.id,
          price: itemPrice,
          quantity: item.quantity,
          name: (item.name + ((item.size_surcharge || 0) > 0 ? ' (XXL+)' : '')).substring(0, 50)
        };
      }),
      {
        id: 'SHIPPING',
        price: shippingDetails.cost,
        quantity: 1,
        name: `Courier: ${shippingDetails.method.toUpperCase()}`.substring(0, 50)
      }
    ];
    calculatedGrossAmount += shippingDetails.cost;

    if (fees.platformFee > 0) {
      finalItemDetails.push({ id: 'FEE', price: fees.platformFee, quantity: 1, name: 'Platform Fee' });
      calculatedGrossAmount += fees.platformFee;
    }

    const grossAmount = calculatedGrossAmount;
    if (grossAmount <= 0) {
      return NextResponse.json({ error: 'Invalid total price' }, { status: 400 });
    }

    // Extract first_name / last_name from customerDetails
    const firstName = customerDetails.first_name || '';
    const lastName = customerDetails.last_name || '';

    // Initialize Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `NC-${datePart}-${randPart}`;
    const orderId = `NINOC-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        email: customerDetails.email || '',
        phone: customerDetails.phone || '',
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address: customerDetails.address || '',
          city: customerDetails.city || '',
          postal_code: customerDetails.postal_code || ''
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          email: customerDetails.email || '',
          phone: customerDetails.phone || '',
          address: customerDetails.address || '',
          city: customerDetails.city || '',
          postal_code: customerDetails.postal_code || ''
        }
      },
      item_details: finalItemDetails,
      credit_card: {
        secure: true
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // 1. Save order header to Supabase
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        user_id: customerDetails.user_id ? customerDetails.user_id : null,
        affiliate_id: affiliate_id,
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
        price_at_purchase: item.price + (item.size_surcharge || 0)
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Supabase Order Items Error:', itemsError);
        // Throw to prevent returning a token for an order with no line items
        throw new Error('Failed to save order items. Please try again.');
      }
    }

    return NextResponse.json({ token: transaction.token, orderId, orderNumber });
  } catch (err) {
    const error = err as Error;
    console.error('Midtrans API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
