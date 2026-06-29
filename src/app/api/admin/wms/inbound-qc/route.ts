import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Initialize admin client to bypass RLS for systemic updates
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { po_id, po_item_id, variant_id, qty_good, qty_reject, notes } = await req.json();

    if (!po_id || !po_item_id || !variant_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (qty_good < 0 || qty_reject < 0) {
      return NextResponse.json({ error: 'Kuantitas tidak boleh negatif' }, { status: 400 });
    }
    
    if (qty_good === 0 && qty_reject === 0) {
      return NextResponse.json({ error: 'Total kuantitas yang diterima harus lebih dari 0' }, { status: 400 });
    }

    // High Validation: Check PO Item boundaries
    const { data: poItem, error: poItemError } = await adminClient
      .from('po_items')
      .select('qty_ordered, qty_received')
      .eq('id', po_item_id)
      .single();

    if (poItemError || !poItem) {
      return NextResponse.json({ error: 'Purchase Order Item tidak ditemukan' }, { status: 404 });
    }

    const totalNewReceived = qty_good + qty_reject;
    const qtyRemaining = poItem.qty_ordered - (poItem.qty_received || 0);

    if (totalNewReceived > qtyRemaining) {
      return NextResponse.json({ 
        error: `Validasi gagal: Jumlah yang diterima (${totalNewReceived}) melebihi sisa pesanan (${qtyRemaining}).` 
      }, { status: 400 });
    }

    // Execute updates
    
    // 1. Update po_items
    const { data: currentPoItem } = await adminClient
      .from('po_items')
      .select('qty_received, qty_rejected')
      .eq('id', po_item_id)
      .single();
      
    const currentReceived = currentPoItem?.qty_received || 0;
    const currentRejected = currentPoItem?.qty_rejected || 0;

    await adminClient
      .from('po_items')
      .update({
        qty_received: currentReceived + totalNewReceived,
        qty_rejected: currentRejected + qty_reject,
      })
      .eq('id', po_item_id);

    // 2. Update stock for variants (ONLY FOR qty_good)
    if (qty_good > 0) {
      const { data: variant } = await adminClient
        .from('variants')
        .select('stock_quantity')
        .eq('id', variant_id)
        .single();
        
      const currentStock = variant?.stock_quantity || 0;
      await adminClient
        .from('variants')
        .update({ stock_quantity: currentStock + qty_good })
        .eq('id', variant_id);
    }

    // 3. Log to inbound_qc_logs
    const { error: logError } = await adminClient
      .from('inbound_qc_logs')
      .insert({
        po_id,
        po_item_id,
        admin_email: user.email || 'unknown',
        qty_good,
        qty_rejected: qty_reject,
        notes: notes || null
      });
      
    if (logError && logError.code !== '42P01') { 
      console.error('QC Log Error:', logError);
    }

    // 4. Update PO status
    const { data: allItems } = await adminClient
      .from('po_items')
      .select('qty_ordered, qty_received')
      .eq('po_id', po_id);
      
    if (allItems) {
      const isFullyReceived = allItems.every(i => (i.qty_received || 0) >= i.qty_ordered);
      const newStatus = isFullyReceived ? 'received' : 'partial';
      
      await adminClient
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', po_id);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Inbound QC Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
