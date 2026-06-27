import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { sendEmailReturStatusUpdate } from '@/lib/email';
import { sendWAReturStatusUpdate } from '@/lib/whatsapp';

const adminClient = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await adminClient
      .from('retur_requests')
      .select(`
        *,
        user:user_id(id, email, raw_user_meta_data),
        resolved_by_user:resolved_by(id, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ retur_request: data });
  } catch (err) {
    console.error('[GET /api/retur/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch retur request' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      status,
      admin_notes,
      fraud_suspected,
      fraud_reasons,
      refund_amount,
      refund_method,
    } = body;

    // Get current admin user via server-side cookie session (service role cannot getUser)
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (fraud_suspected !== undefined) updates.fraud_suspected = fraud_suspected;
    if (fraud_reasons !== undefined) updates.fraud_reasons = fraud_reasons;
    if (refund_amount !== undefined) updates.refund_amount = refund_amount;
    if (refund_method !== undefined) updates.refund_method = refund_method;

    // Set resolved_at and resolved_by when status changes to approved/rejected/completed
    if (status && ['approved', 'rejected', 'completed'].includes(status)) {
      updates.resolved_by = user.id;
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await adminClient
      .from('retur_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (user.id && status) {
      await adminClient.from('customer_activity_log').insert({
        user_id: data.user_id,
        activity_type: status === 'approved' ? 'retur_approved'
          : status === 'rejected' ? 'retur_rejected'
          : status === 'completed' ? 'retur_completed'
          : 'note_added',
        description: `Retur status diubah ke ${status}`,
        metadata: { retur_id: id, admin_notes },
      });
    }

    // Trigger Notifications for approved or rejected
    if (status === 'approved' || status === 'rejected') {
      adminClient.from('orders').select('customer_email, customer_phone, shipping_address').eq('id', data.order_id).single()
        .then(({ data: order }) => {
          if (order) {
            const customerEmail = data.guest_email || order.customer_email;
            if (customerEmail) {
              sendEmailReturStatusUpdate(data, order, customerEmail, status, admin_notes).catch(console.error);
            }
            if (order.customer_phone) {
              sendWAReturStatusUpdate({
                phone: order.customer_phone,
                customer_name: (order.shipping_address as any)?.name || 'Customer',
                order_id: data.order_id,
                new_status: status === 'approved' ? 'DISETUJUI' : 'DITOLAK',
                additional_notes: admin_notes
              }).catch(console.error);
            }
          }
        }).catch(console.error);
    }

    return NextResponse.json({ retur_request: data });
  } catch (err) {
    console.error('[PATCH /api/retur/[id]]', err);
    return NextResponse.json({ error: 'Failed to update retur request' }, { status: 500 });
  }
}
