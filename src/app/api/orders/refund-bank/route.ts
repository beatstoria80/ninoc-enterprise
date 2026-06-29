import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, email_or_phone, bank_name, account_number, account_name, user_id } = body;

    if (!order_id || !bank_name || !account_number || !account_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the order securely
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, shipping_address')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security Verification
    let isAuthorized = false;
    if (user_id && order.user_id === user_id) {
      // Authorized via authenticated user session
      isAuthorized = true;
    } else if (email_or_phone) {
      // Authorized via guest details verification (matching TrackClient logic)
      const phoneMatch = order.shipping_address?.phone === email_or_phone;
      const cleanInput = email_or_phone.replace(/\D/g, '');
      const cleanPhone = (order.shipping_address?.phone || '').replace(/\D/g, '');
      const fuzzyPhoneMatch = cleanInput && cleanPhone && cleanPhone.includes(cleanInput);
      
      // We don't have email directly in orders without joining users, but usually guest track uses phone.
      if (phoneMatch || fuzzyPhoneMatch) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const refundDetails = {
      bank_name,
      account_number,
      account_name,
      submitted_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ refund_bank_details: refundDetails })
      .eq('id', order_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Refund Bank Submit Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit' }, { status: 500 });
  }
}
