import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const adminClient = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const BANK_RULES: Record<string, { len: number[]; name: string }> = {
  'BCA': { len: [10], name: 'PT Bank Central Asia Tbk' },
  'MANDIRI': { len: [13], name: 'PT Bank Mandiri (Persero) Tbk' },
  'BNI': { len: [10], name: 'PT Bank Negara Indonesia (Persero) Tbk' },
  'BRI': { len: [15], name: 'PT Bank Rakyat Indonesia (Persero) Tbk' },
  'BSI': { len: [10], name: 'PT Bank Syariah Indonesia Tbk' },
  'CIMB': { len: [13], name: 'PT Bank CIMB Niaga Tbk' },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      shipping_receipt_url,
      customer_bank_code,
      customer_bank_account,
      customer_bank_account_name,
      reimburse_amount,
    } = body;

    if (!shipping_receipt_url || !customer_bank_code || !customer_bank_account || !customer_bank_account_name || !reimburse_amount) {
      return NextResponse.json({ error: 'Data reimburse tidak lengkap. Pastikan nama pemilik rekening dicantumkan.' }, { status: 400 });
    }

    // Verify retur request exists
    const { data: returReq, error: fetchErr } = await adminClient
      .from('retur_requests')
      .select('id, user_id, order_id, status, guest_email, order:orders(shipping_address, customer_name)')
      .eq('id', id)
      .single();

    if (fetchErr || !returReq) {
      return NextResponse.json({ error: 'Retur tidak ditemukan' }, { status: 404 });
    }

    if (returReq.status !== 'approved') {
      return NextResponse.json({ error: 'Status retur belum disetujui, tidak dapat mengajukan reimburse' }, { status: 400 });
    }

    // Auth check (ensure the user submitting is the owner, or allow guest if no user_id)
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (returReq.user_id && (!user || user.id !== returReq.user_id)) {
      return NextResponse.json({ error: 'Unauthorized. Ini bukan pengajuan Anda.' }, { status: 403 });
    }

    // STRICT SECURITY: Remove mock validation.
    // Instead, rely on customer input and force manual verification status.
    const rule = BANK_RULES[customer_bank_code.toUpperCase()];
    if (rule && !rule.len.includes(customer_bank_account.length)) {
      return NextResponse.json({ error: `Format nomor rekening ${customer_bank_code} tidak valid (harus ${rule.len.join(' atau ')} digit)` }, { status: 400 });
    }

    // Update the retur request
    const { data: updatedData, error: updateErr } = await adminClient
      .from('retur_requests')
      .update({
        shipping_receipt_url,
        customer_bank_code,
        customer_bank_account,
        customer_bank_account_name: String(customer_bank_account_name).trim().toUpperCase(),
        reimburse_amount: parseInt(reimburse_amount) || 0,
        reimburse_status: 'pending_manual_validation'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log Activity
    await adminClient.from('customer_activity_log').insert({
      user_id: returReq.user_id,
      activity_type: 'reimburse_submitted',
      description: `Klaim reimburse ongkir diajukan sebesar IDR ${reimburse_amount}`,
      metadata: { retur_id: id, bank: customer_bank_code },
    });

    return NextResponse.json({ success: true, reimburse_status: 'pending_manual_validation', data: updatedData }, { status: 200 });

  } catch (err: any) {
    console.error('[POST /api/retur/[id]/reimburse]', err);
    return NextResponse.json({ error: err.message || 'Failed to submit reimburse' }, { status: 500 });
  }
}
