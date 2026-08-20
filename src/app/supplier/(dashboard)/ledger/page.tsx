import { createClient } from '@/utils/supabase/server';
import { Banknote, TrendingUp, DollarSign, Download, ArrowUpRight, Calendar, ArrowDownRight, Clock, Box } from 'lucide-react';
import { PayoutRequestButton } from '@/components/supplier/PayoutRequestButton';

export default async function SupplierLedgerPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;

  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('supplier_id, suppliers(bank_name, bank_account_number, bank_account_holder)')
    .eq('user_id', session.user.id)
    .single();
    
  const supplierId = supplierUser?.supplier_id;
  const bankDetails = (supplierUser?.suppliers as any) || { bank_name: '', bank_account_number: '', bank_account_holder: '' };

  let availableForPayout = 0;
  let netSalesThisMonth = 0;
  let pendingClearing = 0;
  let payoutHistory: any[] = [];
  let recentTransactions: any[] = [];

  if (supplierId) {
    // 1. Fetch Balances View
    const { data: balances } = await supabase
      .from('supplier_balances')
      .select('*')
      .eq('supplier_id', supplierId)
      .single();

    if (balances) {
      availableForPayout = Number(balances.available_balance || 0);
    }

    // 2. Fetch Detailed Ledger
    const { data: ledgers } = await supabase
      .from('supplier_ledgers')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (ledgers) {
      recentTransactions = ledgers.map((l: any) => {
        let type = 'sale';
        let desc = l.description || 'Virtual Inventory Revenue';
        if (l.transaction_type === 'WITHDRAWAL') { type = 'payout'; desc = 'Payout / Withdrawal'; }
        if (l.transaction_type === 'CAMPAIGN_FEE' || l.transaction_type === 'STORAGE_FEE') { type = 'fee'; }
        
        // Fallback for legacy rows
        if (!l.transaction_type) {
           if (l.status === 'withdrawn') { type = 'payout'; desc = 'Payout / Withdrawal'; }
           else { type = 'sale'; desc = `Sale (Order: ${l.order_id})`; }
        }

        const amt = l.amount || l.hpp_amount || 0;

        return {
          id: l.id,
          type,
          desc,
          amount: type === 'payout' || type === 'fee' ? -Number(amt) : Number(amt),
          date: new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: l.status
        };
      });

      // 3. Fetch Payout History (Withdrawal Requests)
      const { data: withdrawals } = await supabase
        .from('supplier_withdrawals')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (withdrawals) {
        payoutHistory = withdrawals.map((w: any) => ({
          id: w.id,
          date: w.created_at,
          amount: Number(w.amount),
          status: w.status,
          method: `${w.bank_name} (${w.account_number.slice(-4)})`
        }));
      }

      ledgers.forEach((l: any) => {
        const amt = Number(l.amount || l.hpp_amount || 0);
        const isRevenue = l.transaction_type === 'SALES_REVENUE' || (!l.transaction_type && l.status !== 'withdrawn');
        const isFee = l.transaction_type === 'CAMPAIGN_FEE' || l.transaction_type === 'STORAGE_FEE';

        if (l.status === 'pending') {
          if (isRevenue) pendingClearing += amt;
          if (isFee) pendingClearing -= amt;
        }
        
        // Simplified net sales (just total positive revenue cleared/withdrawn)
        if (isRevenue && (l.status === 'cleared' || l.status === 'withdrawn')) {
          netSalesThisMonth += amt;
        }
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Virtual Inventory Finance</h1>
          <p className="text-gray-500 text-sm mt-1">Track your dropship revenues, campaign fees, and withdrawals.</p>
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
              <PayoutRequestButton 
                availableBalance={availableForPayout} 
                supplierId={supplierId}
                initialBankName={bankDetails.bank_name || ''}
                initialAccountNumber={bankDetails.bank_account_number || ''}
                initialAccountName={bankDetails.bank_account_holder || ''}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Box size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium">Gross Revenue (This Month)</p>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">Rp {netSalesThisMonth.toLocaleString('id-ID')}</h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium">Pending Escrow</p>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">Rp {pendingClearing.toLocaleString('id-ID')}</h3>
          <p className="mt-2 text-sm text-gray-400">Funds locked until dropship buyer confirms receipt.</p>
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
            <h3 className="text-lg font-bold text-gray-900">Double-Entry Ledger (Virtual Inventory)</h3>
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
                      tx.type === 'fee' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {tx.type === 'sale' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer">{tx.desc}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {tx.amount > 0 ? '+' : ''}Rp {tx.amount.toLocaleString('id-ID')}
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
