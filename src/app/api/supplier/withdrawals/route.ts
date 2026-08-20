import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier_id from supplier_users
    const { data: supplierUser, error: supplierUserError } = await supabaseAdmin
      .from('supplier_users')
      .select('supplier_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (supplierUserError || !supplierUser) {
      return NextResponse.json({ error: 'User is not associated with any supplier' }, { status: 403 });
    }

    const supplierId = supplierUser.supplier_id;

    const body = await req.json();
    const { amount, bankName, accountNumber, accountName } = body;

    // Validate inputs
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah penarikan harus lebih besar dari 0' }, { status: 400 });
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Nama bank, nomor rekening, dan nama pemilik rekening harus diisi' }, { status: 400 });
    }

    // Query current balance securely
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('supplier_balances')
      .select('available_balance')
      .eq('supplier_id', supplierId)
      .maybeSingle();

    if (balanceError) {
      console.error('[Supplier Withdrawals] Error fetching balance:', balanceError);
      return NextResponse.json({ error: 'Gagal mengambil informasi saldo' }, { status: 500 });
    }

    const availableBalance = Number(balanceData?.available_balance || 0);
    if (parsedAmount > availableBalance) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi untuk melakukan penarikan ini' }, { status: 400 });
    }

    // Insert withdrawal request
    const { data, error: insertError } = await supabaseAdmin
      .from('supplier_withdrawals')
      .insert({
        supplier_id: supplierId,
        amount: parsedAmount,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Supplier Withdrawals] Insert error:', insertError);
      return NextResponse.json({ error: 'Gagal memproses pengajuan penarikan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[api/supplier/withdrawals] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
