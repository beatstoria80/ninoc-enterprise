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

    // Determine admin/staff rights (assume if they reached here, they have UI access, but ideally check roles)
    // Fetch all completed orders via server-side pagination to bypass 1000-row PostgREST limits
    let allCompletedOrders: any[] = [];
    let hasMore = true;
    let page = 0;
    const PAGE_SIZE = 1000;
    
    // We only need specific fields to calculate revenue, making payload extremely light
    while (hasMore) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_price, status, payment_status, created_at')
        .in('status', ['paid', 'delivered', 'shipped'])
        .in('payment_status', ['success', 'settlement'])
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
      if (error) {
        console.error('[Finance Summary] Fetch Error:', error);
        break;
      }
      
      if (data && data.length > 0) {
        allCompletedOrders = [...allCompletedOrders, ...data];
        if (data.length < PAGE_SIZE) {
          hasMore = false; // reached the end
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    // 2. SERVER-SIDE AGGREGATION
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;

    allCompletedOrders.forEach(o => {
      const price = Number(o.total_price) || 0;
      const createdAt = new Date(o.created_at);
      
      totalRevenue += price;
      if (createdAt >= today) todayRevenue += price;
      if (createdAt >= monthStart) monthRevenue += price;
    });

    return NextResponse.json({
      success: true,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      totalOrdersAnalyzed: allCompletedOrders.length
    });

  } catch (err) {
    console.error('[Finance Summary] Internal Server Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
