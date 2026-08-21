
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access. Authentication required.' }, { status: 401 });
    }

    // 2. FETCH AGGREGATED COUNT
    // First, determine how many orders exist to chunk the parallel fetch
    const { count, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['paid', 'delivered', 'shipped'])
      .in('payment_status', ['success', 'settlement']);

    if (countError) {
      console.error('[Finance Summary] Count Error:', countError);
      return NextResponse.json({ error: 'Failed to fetch order count' }, { status: 500 });
    }

    const totalOrders = count || 0;
    const PAGE_SIZE = 1000;
    const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let processedCount = 0;

    // 3. SERVER-SIDE AGGREGATION (Sequential chunking to protect DB connection pool and Node.js Memory)
    // By processing and accumulating sequentially, we prevent OOM crashes and Supabase connection pool exhaustion
    for (let i = 0; i < totalPages; i++) {
      const from = i * PAGE_SIZE;
      const to = (i + 1) * PAGE_SIZE - 1;
      
      const { data, error } = await supabase
        .from('orders')
        .select('total_price, created_at') // ONLY fetch needed columns to minimize memory
        .in('status', ['paid', 'delivered', 'shipped'])
        .in('payment_status', ['success', 'settlement'])
        .range(from, to);
        
      if (error) {
        console.error(`[Finance Summary] Chunk ${i} Fetch Error:`, error);
        continue;
      }

      if (data) {
        for (const o of data) {
          const price = Number(o.total_price) || 0;
          const createdAt = new Date(o.created_at);
          
          totalRevenue += price;
          if (createdAt >= today) todayRevenue += price;
          if (createdAt >= monthStart) monthRevenue += price;
          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      totalOrdersAnalyzed: processedCount
    });

  } catch (err) {
    console.error('[Finance Summary] Internal Server Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

