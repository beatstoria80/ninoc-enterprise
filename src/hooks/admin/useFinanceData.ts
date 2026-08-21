import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FinanceSummary, ProductCosting, SupplierCostLog, PromoImpact } from '@/components/admin/types';

export function useFinanceData() {
  const [finance, setFinance] = useState<FinanceSummary>({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    pendingPayments: 0,
    completedOrders: 0
  });

  const [productCostings, setProductCostings] = useState<Record<string, ProductCosting>>({});
  const [supplierLogs, setSupplierLogs] = useState<SupplierCostLog[]>([]);
  const [activePromos, setActivePromos] = useState<PromoImpact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFinanceSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/finance-summary');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const financeRes = await response.json();
      
      if (financeRes && financeRes.success) {
        setFinance({
          totalRevenue: financeRes.totalRevenue || 0,
          todayRevenue: financeRes.todayRevenue || 0,
          monthRevenue: financeRes.monthRevenue || 0,
          pendingPayments: 0, // Now handled by order context if needed
          completedOrders: financeRes.totalOrdersAnalyzed || 0
        });
      }
    } catch (financeErr) {
      console.error('Failed to fetch server-side finance summary:', financeErr);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFinancialData = useCallback(async () => {
    try {
      const { data: costData, error: costError } = await supabase.from('product_costings').select('*');
      if (costError) throw costError;

      if (costData) {
        const map: Record<string, ProductCosting> = {};
        costData.forEach((c: ProductCosting) => { map[c.product_id] = c; });
        setProductCostings(map);
      }
      
      const { data: logData, error: logError } = await supabase.from('supplier_cost_log').select('*, products(name)').order('changed_at', { ascending: false }).limit(10);
      if (logError) throw logError;
      if (logData) setSupplierLogs(logData as SupplierCostLog[]);
      
      const { data: promoData, error: promoError } = await supabase.from('promo_impact').select('*, products(name)').eq('is_active', true);
      if (promoError) throw promoError;
      if (promoData) setActivePromos(promoData as PromoImpact[]);
    } catch (err) {
      console.error('Failed to fetch financial data details:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFinanceSummary();
    fetchFinancialData();
  }, [fetchFinanceSummary, fetchFinancialData]);

  return {
    finance,
    productCostings,
    supplierLogs,
    activePromos,
    isLoading,
    fetchFinanceSummary,
    fetchFinancialData
  };
}
