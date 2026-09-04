import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';

// Constants for DRY and Maintainability
const VALID_ORDER_STATUSES = ['paid', 'delivered', 'shipped'];
const VALID_PAYMENT_STATUSES = ['success', 'settlement'];
const PAGE_SIZE = 1000;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // GMT+7

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    
    // 1. AUTHENTICATION & ADMIN ROLE AUTHORIZATION
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { data: roleData } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();

    const isAdmin = !!roleData && ['super_admin', 'admin', 'finance'].includes(roleData.role);
    
    if (!isAdmin) {
      console.warn(`[Security Alert] Non-admin user attempted to access finance summary: ${user.email}`);
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    // 2. TIMEZONE HANDLING (WIB)
    // Convert server UTC time to Indonesian Time (WIB) for accurate "Today" and "Month" boundaries
    const nowUtc = new Date();
    const nowWib = new Date(nowUtc.getTime() + WIB_OFFSET_MS);
    
    // Calculate boundaries in WIB, then convert back to UTC for database comparison
    const todayWibStart = new Date(Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate(), -7, 0, 0, 0));
    const monthWibStart = new Date(Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), 1, -7, 0, 0, 0));

    // 3. FETCH AGGREGATED COUNT
    const { count, error: countError } = await adminSupabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', VALID_ORDER_STATUSES)
      .in('payment_status', VALID_PAYMENT_STATUSES);

    if (countError) {
      console.error('[Finance Summary] Count Error:', countError);
      return NextResponse.json({ error: 'Failed to fetch order count' }, { status: 500 });
    }

    const totalOrders = count || 0;
    const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let processedCount = 0;

    // 4. SEQUENTIAL AGGREGATION
    // Kept sequential to protect the Node.js memory and DB connection pool
    for (let i = 0; i < totalPages; i++) {
      const from = i * PAGE_SIZE;
      const to = (i + 1) * PAGE_SIZE - 1;
      
      const { data, error } = await adminSupabase
        .from('orders')
        .select('total_price, created_at')
        .in('status', VALID_ORDER_STATUSES)
        .in('payment_status', VALID_PAYMENT_STATUSES)
        .range(from, to);
        
      if (error) {
        console.error(`[Finance Summary] Chunk ${i} Fetch Error:`, error);
        continue; // Skip failing chunk but don't crash entire calculation
      }

      if (data) {
        for (const o of data) {
          const price = Number(o.total_price) || 0;
          const createdAt = new Date(o.created_at);
          
          totalRevenue += price;
          if (createdAt >= todayWibStart) todayRevenue += price;
          if (createdAt >= monthWibStart) monthRevenue += price;
          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      totalOrdersAnalyzed: processedCount,
      _metadata: {
        last_updated: nowUtc.toISOString(),
        timezone: 'Asia/Jakarta (WIB)'
      }
    });

  } catch (err) {
    console.error('[Finance Summary] Internal Server Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

