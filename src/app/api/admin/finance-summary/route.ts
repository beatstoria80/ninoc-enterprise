
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
    const chunkPromises = [];

    // Create parallel fetch promises (max 1000 per request per PostgREST limits)
    for (let i = 0; i < Math.ceil(totalOrders / PAGE_SIZE); i++) {
      const from = i * PAGE_SIZE;
      const to = (i + 1) * PAGE_SIZE - 1;
      
      const fetchPromise = supabase
        .from('orders')
        .select('total_price, created_at') // ONLY fetch needed columns to minimize memory
        .in('status', ['paid', 'delivered', 'shipped'])
        .in('payment_status', ['success', 'settlement'])
        .range(from, to);
        
      chunkPromises.push(fetchPromise);
    }

    // Await all chunks in parallel (significantly faster than sequential while-loop)
    // For extreme scaling (>50k orders), a batching mechanism like p-limit should be used.
    // Given Vercel limits, parallel execution here solves the immediate timeout issue.
    const chunkResults = await Promise.all(chunkPromises);

    // 3. SERVER-SIDE AGGREGATION
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let processedCount = 0;

    for (const result of chunkResults) {
      if (result.error) {
        console.error('[Finance Summary] Chunk Fetch Error:', result.error);
        continue;
      }
      
      if (result.data) {
        for (const o of result.data) {
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

