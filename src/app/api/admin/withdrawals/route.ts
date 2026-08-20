import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('supplier_withdrawals')
      .select('*, suppliers(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Withdrawals GET] Fetch error:', error);
      return NextResponse.json({ error: 'Gagal mengambil data penarikan' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[api/admin/withdrawals] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'ID dan status (approved/rejected) harus diisi' }, { status: 400 });
    }

    if (status === 'approved') {
      // Execute atomic postgres transaction function
      const { data, error } = await supabaseAdmin.rpc('approve_supplier_withdrawal', {
        p_withdrawal_id: id
      });

      if (error) {
        console.error('[Admin Withdrawals POST] RPC error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan sistem database' }, { status: 500 });
      }

      const result = data as any;
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: result.message });
    } else {
      // Rejection logic: update status directly
      // Lock first to check status is pending
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('supplier_withdrawals')
        .select('status')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !current) {
        return NextResponse.json({ error: 'Pengajuan penarikan tidak ditemukan' }, { status: 404 });
      }

      if (current.status !== 'pending') {
        return NextResponse.json({ error: `Pengajuan sudah diproses sebelumnya (Status: ${current.status})` }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from('supplier_withdrawals')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        console.error('[Admin Withdrawals POST] Update error:', updateError);
        return NextResponse.json({ error: 'Gagal mengubah status penarikan' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Pengajuan penarikan berhasil ditolak' });
    }
  } catch (err) {
    console.error('[api/admin/withdrawals] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
