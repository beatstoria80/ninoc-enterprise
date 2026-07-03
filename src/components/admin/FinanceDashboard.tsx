import React, { useState, useEffect } from 'react';
// import { BarChart3, TrendingUp, CreditCard, PieChart } from 'lucide-react'; // Unused in minimalist mode
import { supabase } from '@/lib/supabase';

export default function FinanceDashboard() {
  const [metrics, setMetrics] = useState({
    grossRevenue: 0,
    totalHpp: 0,
    totalAffiliateCommissions: 0,
    totalOpex: 0,
    netProfit: 0,
    pendingSupplierPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchFinanceMetrics = async () => {
    try {
      // Get current month start and end dates for efficient querying
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // 1. Get all completed orders (paid, shipped, delivered) for this month
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_price, status')
        .in('status', ['paid', 'shipped', 'delivered'])
        .gte('created_at', firstDay)
        .lte('created_at', lastDay);
        
      const grossRevenue = orders?.reduce((sum, o) => sum + Number(o.total_price || 0), 0) || 0;

      // 2. Get Supplier Ledgers (HPP)
      const { data: ledgers } = await supabase
        .from('supplier_ledgers')
        .select('hpp_amount, status')
        .gte('created_at', firstDay)
        .lte('created_at', lastDay);
      
      let totalHpp = 0;
      let pendingSupplierPayments = 0;
      
      ledgers?.forEach(l => {
        totalHpp += Number(l.hpp_amount || 0);
        if (l.status === 'pending') {
          pendingSupplierPayments += Number(l.hpp_amount || 0);
        }
      });

      // 3. Get Affiliate Commissions
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount')
        .gte('created_at', firstDay)
        .lte('created_at', lastDay);
        
      const totalAffiliateCommissions = commissions?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

      // 4. Get OPEX (Operational Expenses)
      const { data: opex } = await supabase
        .from('operational_expenses')
        .select('amount')
        .gte('expense_date', firstDay)
        .lte('expense_date', lastDay);
        
      const totalOpex = opex?.reduce((sum, o) => sum + Number(o.amount || 0), 0) || 0;

      // 5. Calculate Net Profit
      const netProfit = grossRevenue - totalHpp - totalAffiliateCommissions - totalOpex;

      setMetrics({
        grossRevenue,
        totalHpp,
        totalAffiliateCommissions,
        totalOpex,
        netProfit,
        pendingSupplierPayments
      });
    } catch (error) {
      console.error('Failed to fetch finance metrics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFinanceMetrics();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Financial Data...</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-sm font-bold text-ink">Finance & P&L Dashboard (Current Month)</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-white p-3 rounded border border-ink/10 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-ink/60 uppercase tracking-wider mb-0.5">Gross Revenue</p>
          <p className="text-base font-bold text-ink font-mono">Rp {metrics.grossRevenue.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-3 rounded border border-ink/10 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-ink/60 uppercase tracking-wider mb-0.5">Total COGS (HPP)</p>
          <p className="text-base font-bold text-ink font-mono">Rp {metrics.totalHpp.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-3 rounded border border-ink/10 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-ink/60 uppercase tracking-wider mb-0.5">Affiliate Comm.</p>
          <p className="text-base font-bold text-ink font-mono">Rp {metrics.totalAffiliateCommissions.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-3 rounded border border-ink/10 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-ink/60 uppercase tracking-wider mb-0.5">Total OPEX</p>
          <p className="text-base font-bold text-ink font-mono">Rp {metrics.totalOpex.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-rose/5 p-3 rounded border border-rose/20 flex flex-col justify-center">
          <p className="text-[10px] font-bold text-rose uppercase tracking-wider mb-0.5">Net Profit Estimates</p>
          <p className="text-base font-bold text-rose font-mono">Rp {metrics.netProfit.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-white p-3 rounded border border-ink/10">
          <h3 className="text-[11px] font-bold text-ink mb-2 uppercase tracking-wider">Supplier Liabilities</h3>
          <div className="flex items-center justify-between p-2 bg-orange-50/50 rounded border border-orange-100">
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase mb-0.5">Pending Payments</p>
            </div>
            <div className="text-sm font-bold text-ink font-mono">
              Rp {metrics.pendingSupplierPayments.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded border border-ink/10">
          <h3 className="text-[11px] font-bold text-ink mb-2 uppercase tracking-wider">Financial Health</h3>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-medium text-ink/60">Margin</span>
                <span className="font-bold text-ink font-mono">
                  {metrics.grossRevenue > 0 ? Math.round((metrics.netProfit / metrics.grossRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-ink/5 h-1">
                <div 
                  className="bg-rose h-1" 
                  style={{ width: `${metrics.grossRevenue > 0 ? Math.round((metrics.netProfit / metrics.grossRevenue) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-medium text-ink/60">COGS</span>
                <span className="font-bold text-ink font-mono">
                  {metrics.grossRevenue > 0 ? Math.round((metrics.totalHpp / metrics.grossRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-ink/5 h-1">
                <div 
                  className="bg-orange-400 h-1" 
                  style={{ width: `${metrics.grossRevenue > 0 ? Math.round((metrics.totalHpp / metrics.grossRevenue) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-medium text-ink/60">OPEX</span>
                <span className="font-bold text-ink font-mono">
                  {metrics.grossRevenue > 0 ? Math.round((metrics.totalOpex / metrics.grossRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-ink/5 h-1">
                <div 
                  className="bg-purple-400 h-1" 
                  style={{ width: `${metrics.grossRevenue > 0 ? Math.round((metrics.totalOpex / metrics.grossRevenue) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
