import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';



export async function POST(req: Request) {
  try {
    const { order_id, action } = await req.json();

    if (!order_id || action !== 'mark_completed') {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    // Fetch Order to get current notes
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('notes')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let newNotes = order.notes || '';
    if (newNotes.includes('Manual Refund Required')) {
      newNotes = newNotes.replace('Manual Refund Required', `Manual Refund Completed (on ${new Date().toISOString()})`);
    } else if (!newNotes.includes('Manual Refund Completed')) {
      newNotes += `\nManual Refund Completed (on ${new Date().toISOString()})`;
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ notes: newNotes })
      .eq('id', order_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Refund marked as completed' });
  } catch (error: any) {
    console.error('Finance Refund Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
