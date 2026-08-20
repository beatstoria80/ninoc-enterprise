-- Migration: Create stored procedure for secure atomic withdrawal approval
CREATE OR REPLACE FUNCTION public.approve_supplier_withdrawal(p_withdrawal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to insert into immutable ledgers
AS $$
DECLARE
    v_supplier_id UUID;
    v_amount DECIMAL(12,2);
    v_status TEXT;
    v_balance DECIMAL(12,2);
    v_bank_name TEXT;
    v_account_number TEXT;
    v_account_name TEXT;
BEGIN
    -- 1. Lock the withdrawal row to prevent race conditions
    SELECT supplier_id, amount, status, bank_name, account_number, account_name
    INTO v_supplier_id, v_amount, v_status, v_bank_name, v_account_number, v_account_name
    FROM public.supplier_withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    -- 2. Verify status is pending
    IF v_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pengajuan penarikan tidak ditemukan');
    ELSIF v_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pengajuan ini sudah diproses sebelumnya (Status: ' || v_status || ')');
    END IF;

    -- 3. Verify available balance
    SELECT available_balance
    INTO v_balance
    FROM public.supplier_balances
    WHERE supplier_id = v_supplier_id;

    IF v_balance IS NULL OR v_balance < v_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo supplier tidak mencukupi (Saldo: ' || COALESCE(v_balance, 0) || ', Pengajuan: ' || v_amount || ')');
    END IF;

    -- 4. Update withdrawal status
    UPDATE public.supplier_withdrawals
    SET status = 'approved',
        updated_at = now()
    WHERE id = p_withdrawal_id;

    -- 5. Insert permanent ledger entry
    INSERT INTO public.supplier_ledgers (
        supplier_id,
        transaction_type,
        amount,
        description,
        status
    ) VALUES (
        v_supplier_id,
        'WITHDRAWAL',
        v_amount,
        'Payout Approved to ' || v_bank_name || ' (' || v_account_number || ' a.n ' || v_account_name || ')',
        'cleared'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Persetujuan penarikan berhasil diproses');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
