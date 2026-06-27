import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Retur ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { return_awb, return_courier } = body;

    if (!return_awb || !return_courier) {
      return NextResponse.json({ error: 'AWB and Courier are required' }, { status: 400 });
    }

    // Periksa status saat ini
    const { data: current, error: fetchErr } = await adminClient
      .from('retur_requests')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Retur not found' }, { status: 404 });
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
