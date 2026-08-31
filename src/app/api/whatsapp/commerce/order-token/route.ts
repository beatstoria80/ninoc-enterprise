/**
 * NINOC WhatsApp Commerce — Order Token API
 *
 * Generates secure order tokens for Web→WhatsApp handoff.
 * Called by the frontend when user clicks "Lanjut via WhatsApp"
 * on the checkout page.
 *
 * POST /api/whatsapp/commerce/order-token
 * Body: { cart: CartSnapshot }
 * Response: { token, deepLink } or { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOrderSession } from '@/lib/order-token';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { CartSnapshot } from '@/lib/whatsapp/commerce/types';

export async function POST(req: NextRequest) {
  // Check feature flag
  if (!isFeatureEnabled('WA_COMMERCE_ENABLED')) {
    return NextResponse.json(
      { error: 'WhatsApp Commerce is not enabled' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const cart: CartSnapshot = body.cart;

    // Validate cart
    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty or invalid' },
        { status: 400 }
      );
    }

    if (!cart.subtotal || cart.subtotal <= 0) {
      return NextResponse.json(
        { error: 'Invalid cart subtotal' },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of cart.items) {
      if (!item.product_id || !item.product_name || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: 'Each cart item must have product_id, product_name, quantity, and price' },
          { status: 400 }
        );
      }
    }

    // Determine sandbox mode
    const isSandbox = isFeatureEnabled('WA_COMMERCE_SANDBOX');

    // Create order session & generate deep link
    const result = await createOrderSession(cart, isSandbox);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        token: result.token,
        deepLink: result.deepLink,
        isSandbox,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[WA-Commerce-OrderToken] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate order token' },
      { status: 500 }
    );
  }
}
