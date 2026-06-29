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

function validateBankAccountMock(bankCode: string, accountNo: string) {
  const rule = BANK_RULES[bankCode.toUpperCase()];
  if (!rule) {
    // If not a standard bank, just assume it's valid for mock purposes
    return { valid: true, accountName: 'GUEST CUSTOMER' };
  }
  
  if (!rule.len.includes(accountNo.length)) {
    return { valid: false, error: `Format nomor rekening ${bankCode} tidak valid (harus ${rule.len.join(' atau ')} digit)` };
  }

  // Mock valid account name based on order
  return { valid: true, accountName: 'CUSTOMER NINOC' }; 
}

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
      reimburse_amount,
    } = body;

    if (!shipping_receipt_url || !customer_bank_code || !customer_bank_account || !reimburse_amount) {
      return NextResponse.json({ error: 'Data reimburse tidak lengkap' }, { status: 400 });
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

    // Mock Validation
    const validation = validateBankAccountMock(customer_bank_code, customer_bank_account);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Extract actual customer name from order for mock
    let mockAccountName = validation.accountName;
    const orderData = Array.isArray(returReq.order) ? returReq.order[0] : returReq.order;
    if (orderData) {
        mockAccountName = orderData.customer_name || (orderData.shipping_address as any)?.name || mockAccountName;
    }

    // Update the retur request
    const { data: updatedData, error: updateErr } = await adminClient
      .from('retur_requests')
      .update({
        shipping_receipt_url,
        customer_bank_code,
        customer_bank_account,
        customer_bank_account_name: mockAccountName,
        reimburse_amount: parseInt(reimburse_amount) || 0,
        reimburse_status: 'validated'
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

    return NextResponse.json({ success: true, reimburse_status: 'validated', data: updatedData }, { status: 200 });

  } catch (err: any) {
    console.error('[POST /api/retur/[id]/reimburse]', err);
    return NextResponse.json({ error: err.message || 'Failed to submit reimburse' }, { status: 500 });
  }
}
