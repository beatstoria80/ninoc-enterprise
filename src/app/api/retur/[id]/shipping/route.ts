import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';



export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Retur ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { return_awb, return_courier, order_id } = body;

    if (!return_awb || !return_courier || !order_id) {
      return NextResponse.json({ error: 'AWB, Courier, and Order ID are required' }, { status: 400 });
    }

    // Periksa status saat ini dan validasi kepemilikan via order_id
    const { data: current, error: fetchErr } = await adminClient
      .from('retur_requests')
      .select('status, order_id')
      .eq('id', id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Retur not found' }, { status: 404 });
    }

    if (current.order_id !== order_id) {
      return NextResponse.json({ error: 'Unauthorized: Order ID mismatch' }, { status: 403 });
    }

    if (current.status !== 'approved') {
      return NextResponse.json({ error: 'Hanya retur yang berstatus Disetujui yang dapat diinput resi pengembaliannya.' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('retur_requests')
      .update({
        return_awb,
        return_courier,
        return_shipped_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, retur_request: data });
  } catch (error) {
    console.error('[PATCH /api/retur/[id]/shipping]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
