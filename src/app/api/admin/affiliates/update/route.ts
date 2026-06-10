import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { id, customer_discount_type, customer_discount_value, auto_approve_withdrawals } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Affiliate ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('affiliates')
      .update({
        customer_discount_type,
        customer_discount_value: Number(customer_discount_value) || 0,
        auto_approve_withdrawals: Boolean(auto_approve_withdrawals)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Affiliate configuration updated successfully', data });
  } catch (error) {
    console.error('Admin Affiliate Update Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
