import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmailReturStatusUpdate } from '@/lib/email';
import { sendWAReturStatusUpdate } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Retur ID required' }, { status: 400 });

    const body = await req.json();
    const { items, qc_notes, qc_outcome } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const { data: retur, error: fetchErr } = await adminClient
      .from('retur_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !retur) {
      return NextResponse.json({ error: 'Retur not found' }, { status: 404 });
    }

    // Only restock if it's not fraud and items are sellable
    if (qc_outcome !== 'fraud_non_ninoc') {
      for (const item of items) {
        if (item.condition === 'sellable') {
          if (item.variant_id) {
            const { data: variant } = await adminClient.from('variants').select('stock_quantity').eq('id', item.variant_id).single();
            if (variant) {
              await adminClient.from('variants').update({ stock_quantity: variant.stock_quantity + item.quantity }).eq('id', item.variant_id);
            }
          } else if (item.product_id) {
            const { data: product } = await adminClient.from('products').select('stock').eq('id', item.product_id).single();
            if (product && typeof product.stock === 'number') {
              await adminClient.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
            }
          }

          await adminClient.from('inventory_movements').insert({
            movement_type: 'return',
            quantity_change: item.quantity,
            reference_id: `RETUR-${id}`,
            notes: `Restocked from QC (Sellable). OrderItem: ${item.order_item_id || 'Unknown'}`
          });

        } else if (item.condition === 'defective') {
          await adminClient.from('inventory_movements').insert({
            movement_type: 'adjustment_loss',
            quantity_change: 0,
            reference_id: `RETUR-${id}`,
            notes: `Defective Retur (Written off). OrderItem: ${item.order_item_id || 'Unknown'}`
          });
        }
      }
    }

    // Determine final status based on QC Outcome
    let finalStatus = 'completed';
    let fraudFlag = false;

    if (qc_outcome === 'fraud_non_ninoc') {
      finalStatus = 'rejected';
      fraudFlag = true;
    }

    const { error: updateErr } = await adminClient
      .from('retur_requests')
      .update({
        status: finalStatus,
        qc_status: qc_outcome || 'audited',
        qc_notes: qc_notes || null,
        fraud_suspected: fraudFlag ? true : retur.fraud_suspected,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateErr) throw updateErr;

    // Trigger Notifications for completed
    await (async () => {
      try {
        const { data: order } = await adminClient.from('orders').select('customer_email, customer_phone, shipping_address').eq('id', retur.order_id).single();
        if (order) {
          const customerEmail = retur.guest_email || order.customer_email;
          if (customerEmail) {
            await sendEmailReturStatusUpdate(retur, order, customerEmail, finalStatus, qc_notes);
          }
          if (order.customer_phone) {
            await sendWAReturStatusUpdate({
              phone: order.customer_phone,
              customer_name: (order.shipping_address as any)?.name || 'Customer',
              order_id: retur.order_id,
              new_status: finalStatus === 'completed' ? 'SELESAI' : 'DITOLAK',
              additional_notes: qc_notes
            });
          }
        }
      } catch (e) {
        console.error('[Notification Error]', e);
      }
    })();

    return NextResponse.json({ success: true, message: 'QC Audit completed successfully' });

  } catch (error: any) {
    console.error('[QC Audit Error]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
