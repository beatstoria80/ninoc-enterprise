import { createClient } from '@/utils/supabase/server';
import { Banknote, TrendingUp, DollarSign, Download, ArrowUpRight, Calendar, ArrowDownRight, Clock } from 'lucide-react';

export default async function SupplierLedgerPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;

  // Static mock data for demonstration
  const mockPayouts = [
    { id: 'PO-2026-07A', date: '2026-07-28T10:00:00Z', amount: 12500000, status: 'processing', method: 'Bank Transfer - BCA' },
    { id: 'PO-2026-06B', date: '2026-06-30T10:00:00Z', amount: 34200000, status: 'completed', method: 'Bank Transfer - BCA' },
    { id: 'PO-2026-06A', date: '2026-06-15T10:00:00Z', amount: 28400000, status: 'completed', method: 'Bank Transfer - BCA' },
    { id: 'PO-2026-05B', date: '2026-05-31T10:00:00Z', amount: 41000000, status: 'completed', method: 'Bank Transfer - BCA' },
  ];

  const recentTransactions = [
    { type: 'sale', desc: 'Sold 5x Essential T-Shirt Black', amount: 750000, date: '2 hours ago' },
    { type: 'sale', desc: 'Sold 2x Denim Jacket Vintage', amount: 1200000, date: '5 hours ago' },
    { type: 'fee', desc: 'Ninoc Platform Fee (July)', amount: -450000, date: '1 day ago' },
    { type: 'payout', desc: 'Payout PO-2026-06B', amount: -34200000, date: '28 days ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
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
            <h2 className="text-4xl font-bold mt-2">Rp 12.500.000</h2>
            <div className="mt-6 flex items-center gap-2">
              <button className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors w-full">
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
          <h3 className="text-3xl font-bold text-gray-900">Rp 48.200.000</h3>
          <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600 font-medium">
            <ArrowUpRight size={16} />
            <span>+12.5% vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium">Pending Clearing</p>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">Rp 3.450.000</h3>
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
                {mockPayouts.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{new Date(po.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{po.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{po.method}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      Rp {po.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {po.status === 'completed' ? (
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
              {recentTransactions.map((tx, i) => (
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
            
            <button className="w-full mt-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Load More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
