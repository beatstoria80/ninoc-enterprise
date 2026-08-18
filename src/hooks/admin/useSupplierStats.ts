import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SupplierStats {
  totalOrders: number;
  totalItemsSold: number;
  totalRevenue: number;
  returCount: number;
  cancelledCount: number;
}

export function useSupplierStats() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [supplierStats, setSupplierStats] = useState<Record<string, SupplierStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        // Execute all independent queries in parallel to avoid network waterfalls
        const [supRes, whRes, itemsRes, returRes] = await Promise.all([
          supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
          supabase.from('warehouses').select('id, name, code').eq('is_active', true),
          supabase.from('order_items').select('id, supplier_id, quantity, price, orders!inner(status)'),
          supabase.from('retur_requests').select('id, order:orders!inner(order_items!inner(supplier_id))')
        ]);

        if (!isMounted) return;

        if (supRes.error) throw supRes.error;
        if (supRes.data) setSuppliers(supRes.data);
        if (whRes.data) setWarehouses(whRes.data);

        // Process aggregations safely
        const stats: Record<string, SupplierStats> = {};
        
        if (itemsRes.data) {
          for (const item of itemsRes.data) {
            const sid = item.supplier_id;
            if (!sid) continue;
            
            if (!stats[sid]) {
              stats[sid] = { totalOrders: 0, totalItemsSold: 0, totalRevenue: 0, returCount: 0, cancelledCount: 0 };
            }
            
            // Type safety and fallback for nested relational data
            const orderStatus = (item.orders as any)?.status;
            const quantity = item.quantity || 1;
            const price = item.price || 0;

            if (orderStatus === 'cancelled') {
              stats[sid].cancelledCount += quantity;
            } else if (orderStatus !== 'refunded') {
              stats[sid].totalItemsSold += quantity;
              stats[sid].totalRevenue += price * quantity;
            }
            stats[sid].totalOrders += 1;
          }
        }
        
        if (returRes.data) {
          for (const ret of returRes.data) {
            const items = (ret as any).order?.order_items || [];
            for (const item of items) {
              const sid = item.supplier_id;
              if (!sid) continue;
              
              if (!stats[sid]) {
                stats[sid] = { totalOrders: 0, totalItemsSold: 0, totalRevenue: 0, returCount: 0, cancelledCount: 0 };
              }
              stats[sid].returCount += 1;
            }
          }
        }
        
        setSupplierStats(stats);
      } catch (err: any) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false; // Prevent memory leaks on unmount
    };
  }, [refreshKey]);

  return { suppliers, warehouses, supplierStats, loading, error, refetch };
}
