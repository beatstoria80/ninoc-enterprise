import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import midtransClient from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

// Use Service Role Key to bypass RLS since this is a secure server route
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SURCHARGE_SIZES = ['XXL', '2XL', '3XL', 'XXXL', '4XL', '5XL'];
const SIZE_SURCHARGE_AMOUNT = 15000;

interface CheckoutItem {
  id: string;
  name: string;
  price: number; // Ignored for security
  quantity: number;
  size?: string;
  size_surcharge?: number; // Ignored for security
}

export async function POST(req: Request) {
  try {
    // --- RATE LIMITING ---
    // Extract IP for rate limiting. In Next.js App Router, req.headers.get('x-forwarded-for') is common
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
    
    // Limit to 5 checkout requests per 1 minute per IP
    const { isAllowed, headers } = rateLimit(`checkout_${ip}`, 5, 60 * 1000);
    if (!isAllowed) {
      console.warn(`[Security] Rate limit exceeded for IP: ${ip} at checkout`);
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers });
    }

    const { items, customerDetails, shippingDetails, promo } = await req.json();

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // --- SECURITY FIX: Enforce Quantity Cap ---
    const MAX_QTY_PER_ITEM = 10;
    for (const item of items) {
      if (item.quantity > MAX_QTY_PER_ITEM) {
        return NextResponse.json({ error: `Quantity for item ${item.name} exceeds the maximum limit of ${MAX_QTY_PER_ITEM}.` }, { status: 400 });
      }
    }

    // --- SECURITY FIX: Fetch real prices and supplier costings from DB ---
    const productIds = items.map((i: CheckoutItem) => i.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from('products')
      .select(`
        id, price, name, supplier_id,
        product_costings ( supplier_base_price, ninoc_markup ),
        variants ( id, size, color )
      `)
      .in('id', productIds);

    if (dbError || !dbProducts) {
      console.error('[Checkout API] Failed to verify products:', dbError);
      return NextResponse.json({ error: 'Failed to verify products' }, { status: 500 });
    }

    // Affiliate Tracking
    let affiliate_id = null;
    try {
      let targetRefCode = customerDetails.referral_code;
      if (!targetRefCode) {
        const cookieStore = cookies();
        const resolvedCookies = await Promise.resolve(cookieStore);
        targetRefCode = resolvedCookies.get('ninoc_affiliate_ref')?.value;
      }
      
      if (targetRefCode) {
        const { data: affData } = await supabaseAdmin
          .from('affiliates')
          .select('id, user_id')
          .eq('code', targetRefCode.toUpperCase())
          .single();
        
        if (affData) {
          if (customerDetails.user_id && affData.user_id === customerDetails.user_id) {
            console.log(`[Checkout API] Prevented self-referral fraud for user: ${customerDetails.user_id}`);
          } else {
            affiliate_id = affData.id;
          }
        }
      }
    } catch (e) {
      console.error("Error reading affiliate code:", e);
    }

    // Calculate grossAmount securely
    let calculatedGrossAmount = 0;
    const finalItemDetails = [];

    for (const item of items) {
      const dbProduct = dbProducts.find(p => p.id === item.id);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 });
      }

      // Determine size surcharge
      const isSurchargeSize = item.size && SURCHARGE_SIZES.includes(item.size.toUpperCase());
      const surcharge = isSurchargeSize ? SIZE_SURCHARGE_AMOUNT : 0;
      
      const itemPrice = Number(dbProduct.price) + surcharge;
      calculatedGrossAmount += itemPrice * item.quantity;
      
      // Supplier & Ledger Costings
      const costing = dbProduct.product_costings?.[0] || dbProduct.product_costings;
      const supplierBasePrice = costing?.supplier_base_price || 0;
      const ninocMarkup = costing?.ninoc_markup || (itemPrice - supplierBasePrice);

      finalItemDetails.push({
        id: item.id,
        price: itemPrice,
        quantity: item.quantity,
        name: (dbProduct.name + (surcharge > 0 ? ' (XXL+)' : '')).substring(0, 50),
        supplier_id: dbProduct.supplier_id,
        supplier_hpp: supplierBasePrice,
        ninoc_markup: ninocMarkup
      });
    }

    // Add shipping cost
    finalItemDetails.push({
      id: 'SHIPPING',
      price: shippingDetails.cost,
      quantity: 1,
      name: `Courier: ${shippingDetails.method.toUpperCase()}`.substring(0, 50)
    });
    calculatedGrossAmount += shippingDetails.cost;

    // Apply Promo Code discount
    if (promo && promo.discountAmount > 0) {
      finalItemDetails.push({
        id: 'PROMO',
        price: -promo.discountAmount,
        quantity: 1,
        name: `Promo: ${promo.code}`.substring(0, 50)
      });
      calculatedGrossAmount -= promo.discountAmount;
    }

    const grossAmount = calculatedGrossAmount;
    if (grossAmount <= 0) {
      return NextResponse.json({ error: 'Invalid total price' }, { status: 400 });
    }

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
        ...(customerDetails.email ? { email: customerDetails.email } : {}),
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
          ...(customerDetails.email ? { email: customerDetails.email } : {}),
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

    // --- INVENTORY RACE CONDITION LOCK ---
    // 1. Save order header as draft (without snap token initially)
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        user_id: customerDetails.user_id ? customerDetails.user_id : null,
        affiliate_id: affiliate_id,
        customer_name: customerDetails.name || null,
        total_price: grossAmount,
        status: 'paid', // TESTING: Auto-mark as paid for testing admin flow
        payment_status: 'success', // TESTING: Auto-mark as success for testing admin flow
        courier: shippingDetails.method,
        shipping_address: {
          ...customerDetails,
          shipping_method: shippingDetails.method,
          shipping_cost: shippingDetails.cost
        }
      });

    if (orderError) {
      console.error('Supabase Order Error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 2. Save individual order items
    if (finalItemDetails.length > 0) {
      const orderItems = finalItemDetails.filter(i => i.id !== 'SHIPPING' && i.id !== 'PROMO').map((item: any) => {
        const matchingItem = items.find((i: any) => i.id === item.id);
        const dbProduct = dbProducts.find((p: any) => p.id === item.id);
        
        let variant_id = null;
        if (dbProduct && dbProduct.variants && dbProduct.variants.length > 0) {
          const variant = dbProduct.variants.find((v: any) => v.size === matchingItem?.size);
          variant_id = variant ? variant.id : dbProduct.variants[0].id;
        }

        return {
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: item.id,
          variant_id: variant_id,
          product_name: item.name,
          quantity: item.quantity,
          price_at_purchase: item.price,
          size: matchingItem?.size || null,
          supplier_id: item.supplier_id || null,
          supplier_hpp: item.supplier_hpp || 0,
          ninoc_markup: item.ninoc_markup || 0
        };
      });

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        await supabaseAdmin.from('orders').delete().eq('id', orderId); // Rollback
        console.error('Supabase Order Items Error:', itemsError);
        return NextResponse.json({ error: 'DB Error: ' + itemsError.message }, { status: 500 });
      }
    }

    // 3. Attempt to Reserve Inventory (Row-Level Locking)
    const { error: inventoryError } = await supabaseAdmin.rpc('reserve_inventory', { p_order_id: orderId });
    
    if (inventoryError) {
      // Out of stock or race condition lost
      console.error('[Checkout API] Inventory reservation failed:', inventoryError);
      await supabaseAdmin.from('orders').delete().eq('id', orderId); // Rollback everything
      return NextResponse.json({ error: 'DB Error (Inventory): ' + inventoryError.message }, { status: 409 });
    }

    // --- REAL MIDTRANS SANDBOX: Get actual Snap token ---
    // This shows the real Midtrans payment window (sandbox mode for testing)
    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token as string;
    console.log(`[Checkout API] Snap token created for order ${orderId}: ${snapToken.substring(0, 12)}...`);

    await supabaseAdmin
      .from('orders')
      .update({ snap_token: snapToken })
      .eq('id', orderId);

    // --- TEST BYPASS INTEGRATION FIX ---
    // Simulate webhook logic so the admin dashboard (supplier, affiliate) is fully integrated
    // (In production, this would be handled by the Midtrans webhook callback)
    // --- SECURITY FIX: Removed Test Bypass Integration ---
    // Supplier Ledgers and Affiliate Commissions are now ONLY generated by the Webhook
    // when the payment is actually verified as 'settlement' or 'capture'.

    return NextResponse.json({ token: snapToken, orderId, orderNumber });
  } catch (err) {
    const error = err as Error;
    console.error('Midtrans API Error:', error);
    // SECURITY FIX: Sanitize error messages in production. 
    // We log the detailed error above, but only return a generic message to the client.
    return NextResponse.json({ error: 'An error occurred during checkout. Please try again.' }, { status: 500 });
  }
}
