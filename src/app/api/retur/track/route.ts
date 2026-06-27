import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let queryId = searchParams.get('q');
    
    if (!queryId) {
      return NextResponse.json({ error: 'Order ID atau Nomor Invoice harus diisi.' }, { status: 400 });
    }

    queryId = queryId.trim();
    let orderIdToSearch = queryId;

    // Check if the query is an invoice number (numeric or prefixed with something).
    // If it doesn't start with NINOC-, let's see if we can find it as order_number in orders table.
    if (!queryId.toUpperCase().startsWith('NINOC-')) {
      // Try to parse as integer for order_number
      const orderNumber = parseInt(queryId.replace(/\D/g, ''), 10);
      
      if (!isNaN(orderNumber)) {
        const { data: orderData } = await adminClient
          .from('orders')
          .select('id')
          .eq('order_number', orderNumber)
          .maybeSingle();
          
        if (orderData) {
          orderIdToSearch = orderData.id;
        }
      }
    }

    // Now search the retur_requests table using the resolved order_id
    const { data: returRequest, error } = await adminClient
      .from('retur_requests')
      .select('status, reason_label, return_type, created_at')
      .eq('order_id', orderIdToSearch)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Track Retur DB Error]', error);
      return NextResponse.json({ error: 'Terjadi kesalahan saat melacak pesanan.' }, { status: 500 });
    }

    if (!returRequest) {
      return NextResponse.json({ 
        error: 'Tidak ada pengajuan retur yang ditemukan untuk nomor pesanan/invoice tersebut.' 
      }, { status: 404 });
    }

    // Return ONLY safe public data
    return NextResponse.json({ 
      data: {
        order_id: orderIdToSearch, // Send back the actual order_id for confirmation
        status: returRequest.status,
        reason_label: returRequest.reason_label,
        return_type: returRequest.return_type,
        created_at: returRequest.created_at
      }
    });

  } catch (err) {
    console.error('[GET /api/retur/track]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
