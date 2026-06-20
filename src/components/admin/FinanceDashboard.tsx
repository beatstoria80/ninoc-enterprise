import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CreditCard, PieChart } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-ink">Finance & P&L Dashboard (Current Month)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4">
            <BarChart3 size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gross Revenue</p>
          <p className="text-2xl font-bold text-ink">Rp {metrics.grossRevenue.toLocaleString('id-ID')}</p>
        </div>

        {/* Total HPP (Cost of Goods Sold) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
            <PieChart size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total COGS (HPP)</p>
          <p className="text-2xl font-bold text-ink">Rp {metrics.totalHpp.toLocaleString('id-ID')}</p>
        </div>

        {/* Affiliate Payouts */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <CreditCard size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Affiliate Commission</p>
          <p className="text-2xl font-bold text-ink">Rp {metrics.totalAffiliateCommissions.toLocaleString('id-ID')}</p>
        </div>

        {/* Total OPEX */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-4 relative z-10">
            <TrendingUp size={20} className="rotate-180" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total OPEX</p>
          <p className="text-2xl font-bold text-ink relative z-10">Rp {metrics.totalOpex.toLocaleString('id-ID')}</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} className="text-rose" />
          </div>
          <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center text-rose mb-4 relative z-10">
            <TrendingUp size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Net Profit Estimates</p>
          <p className="text-2xl font-bold text-ink relative z-10">Rp {metrics.netProfit.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-ink mb-4">Supplier Liabilities (Hutang Pabrik)</h3>
          <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-lg border border-orange-100">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Pending Payments</p>
              <p className="text-sm text-gray-600">Total owed to suppliers from successful orders.</p>
            </div>
            <div className="text-xl font-bold text-ink">
              Rp {metrics.pendingSupplierPayments.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-ink mb-4">Financial Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-500">Profit Margin</span>
                <span className="font-bold text-ink">
                  {metrics.grossRevenue > 0 ? Math.round((metrics.netProfit / metrics.grossRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-rose h-2 rounded-full" 
                  style={{ width: `${metrics.grossRevenue > 0 ? Math.round((metrics.netProfit / metrics.grossRevenue) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-500">COGS (HPP) Ratio</span>
                <span className="font-bold text-ink">
                  {metrics.grossRevenue > 0 ? Math.round((metrics.totalHpp / metrics.grossRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-orange-400 h-2 rounded-full" 
                  style={{ width: `${metrics.grossRevenue > 0 ? Math.round((metrics.totalHpp / metrics.grossRevenue) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-500">OPEX Ratio</span>
                <span className="font-bold text-ink">
                  {metrics.grossRevenue > 0 ? Math.round((metrics.totalOpex / metrics.grossRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full" 
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
