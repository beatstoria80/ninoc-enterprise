import { createClient } from '@/utils/supabase/server';
import { Banknote, TrendingUp, DollarSign, Download, ArrowUpRight, Calendar, ArrowDownRight, Clock } from 'lucide-react';

export default async function SupplierLedgerPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;

  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('supplier_id')
    .eq('user_id', session.user.id)
    .single();
    
  const supplierId = supplierUser?.supplier_id;

  let availableForPayout = 0;
  let netSalesThisMonth = 0;
  let pendingClearing = 0;
  let payoutHistory: any[] = [];
  let recentTransactions: any[] = [];

  if (supplierId) {
    const { data: ledgers } = await supabase
      .from('supplier_ledgers')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (ledgers) {
      recentTransactions = ledgers.map((l: any) => ({
        id: l.id,
        type: l.status === 'withdrawn' ? 'payout' : 'sale',
        desc: l.status === 'withdrawn' ? `Payout / Withdrawal` : `Sale (Order: ${l.order_id})`,
        amount: l.status === 'withdrawn' ? -Number(l.hpp_amount) : Number(l.hpp_amount),
        date: new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: l.status
      }));

      payoutHistory = ledgers
        .filter((l: any) => l.status === 'withdrawn' || l.status === 'processing_payout')
        .map((l: any) => ({
           id: l.id,
           date: l.created_at,
           amount: Number(l.hpp_amount),
           status: l.status,
           method: 'Bank Transfer'
        }));

      ledgers.forEach((l: any) => {
        if (l.status === 'cleared') availableForPayout += Number(l.hpp_amount);
        if (l.status === 'pending') pendingClearing += Number(l.hpp_amount);
        if (l.status === 'cleared' || l.status === 'withdrawn') netSalesThisMonth += Number(l.hpp_amount);
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Sales & Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">Track your earnings, platform fees, and withdrawal history.</p>
        </div>
        <button className="bg-ink text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2">
          <Download size={16} />
          Export Statement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <DollarSign size={100} />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-medium">Available for Payout</p>
            <h2 className="text-4xl font-bold mt-2">Rp {availableForPayout.toLocaleString('id-ID')}</h2>
            <div className="mt-6 flex items-center gap-2">
              <button 
                disabled={availableForPayout <= 0}
                className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed">
                Request Payout
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium">Net Sales (This Month)</p>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">Rp {netSalesThisMonth.toLocaleString('id-ID')}</h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium">Pending Clearing</p>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">Rp {pendingClearing.toLocaleString('id-ID')}</h3>
          <p className="mt-2 text-sm text-gray-400">Funds locked until buyer confirms receipt.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Payout History</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Date & ID</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payoutHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No payout history found.
                    </td>
                  </tr>
                ) : payoutHistory.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{new Date(po.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{po.id.slice(0, 8).toUpperCase()}...</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{po.method}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      Rp {po.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {po.status === 'completed' || po.status === 'withdrawn' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          Processing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
            <button className="p-2 text-gray-400 hover:text-ink hover:bg-gray-50 rounded-lg">
              <Calendar size={18} />
            </button>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-6">
              {recentTransactions.length === 0 ? (
                <div className="text-center text-gray-400 py-6">No recent transactions found.</div>
              ) : recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 
                      tx.type === 'fee' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {tx.type === 'sale' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer">{tx.desc}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {tx.amount > 0 ? '+' : ''}Rp {Math.abs(tx.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
