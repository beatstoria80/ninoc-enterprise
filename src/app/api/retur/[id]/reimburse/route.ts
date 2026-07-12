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
    
    // 1. Sanitasi & Type Casting Awal
    const shipping_receipt_url = String(body.shipping_receipt_url || '').trim();
    const customer_bank_code = String(body.customer_bank_code || '').trim().toUpperCase();
    const raw_bank_account = String(body.customer_bank_account || '').trim();
    const customer_bank_account_name = String(body.customer_bank_account_name || '').trim().toUpperCase();
    const reimburse_amount = parseInt(String(body.reimburse_amount), 10) || 0;

    // 2. Bersihkan karakter non-digit (menghilangkan spasi/strip hasil copy-paste)
    const clean_bank_account = raw_bank_account.replace(/\D/g, '');

    if (!shipping_receipt_url || !customer_bank_code || !clean_bank_account || !customer_bank_account_name) {
      return NextResponse.json({ error: 'Data reimburse tidak lengkap. Pastikan form diisi dengan benar.' }, { status: 400 });
    }

    if (reimburse_amount <= 0) {
      return NextResponse.json({ error: 'Nominal reimburse tidak valid.' }, { status: 400 });
    }

    const { data: returReq, error: fetchErr } = await adminClient
      .from('retur_requests')
      .select('id, user_id, order_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !returReq) {
      return NextResponse.json({ error: 'Retur tidak ditemukan' }, { status: 404 });
    }

    if (returReq.status !== 'approved') {
      return NextResponse.json({ error: 'Status retur belum disetujui, tidak dapat mengajukan reimburse' }, { status: 400 });
    }

    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (returReq.user_id && (!user || user.id !== returReq.user_id)) {
      return NextResponse.json({ error: 'Unauthorized. Ini bukan pengajuan Anda.' }, { status: 403 });
    }

    // 3. Validasi Bank yang Tahan Banting (Robust)
    const rule = BANK_RULES[customer_bank_code];
    if (rule && !rule.len.includes(clean_bank_account.length)) {
      return NextResponse.json({ 
        error: `Format nomor rekening ${customer_bank_code} tidak valid. Terdeteksi ${clean_bank_account.length} digit (harus ${rule.len.join(' atau ')} digit).` 
      }, { status: 400 });
    }

    const { data: updatedData, error: updateErr } = await adminClient
      .from('retur_requests')
      .update({
        shipping_receipt_url,
        customer_bank_code,
        customer_bank_account: clean_bank_account,
        customer_bank_account_name,
        reimburse_amount,
        reimburse_status: 'pending_manual_validation'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 4. Mencegah Silent Error saat Guest Checkout
    if (returReq.user_id) {
      await adminClient.from('customer_activity_log').insert({
        user_id: returReq.user_id,
        activity_type: 'reimburse_submitted',
        description: `Klaim reimburse diajukan sebesar IDR ${reimburse_amount}`,
        metadata: { retur_id: id, bank: customer_bank_code },
      });
    }

    return NextResponse.json({ success: true, reimburse_status: 'pending_manual_validation', data: updatedData }, { status: 200 });

  } catch (err: any) {
    console.error('[POST /api/retur/[id]/reimburse]', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat mengajukan klaim.' }, { status: 500 });
  }
}
