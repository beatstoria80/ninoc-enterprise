import { createClient } from '@/utils/supabase/server';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PayoutRequestButton } from '@/components/supplier/PayoutRequestButton';
import { getCurrentSupplier } from '@/lib/services/supplier';

export default async function SupplierLedgerPage() {
  const supabase = await createClient();
  const supplierContext = await getCurrentSupplier();
  
  if (!supplierContext) return null;
    
  const supplierId = supplierContext.supplier_id;
  const bankDetails = supplierContext.suppliers || { bank_name: '', bank_account_number: '', bank_account_holder: '' };

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-100">
        <h1 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Virtual Inventory Finance</h1>
      </div>

      {/* Stats Row - Dense */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 px-5 py-4 flex flex-col justify-center relative">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Available Payout</p>
          <div className="mt-1 flex items-center justify-between">
            <h2 className="text-xl font-bold text-emerald-600">Rp {availableForPayout.toLocaleString('id-ID')}</h2>
            <div className="scale-90 origin-right">
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

        <div className="bg-white border border-gray-200 px-5 py-4 flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Gross Revenue (This Month)</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">Rp {netSalesThisMonth.toLocaleString('id-ID')}</h3>
        </div>

        <div className="bg-white border border-gray-200 px-5 py-4 flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <span>Pending Escrow</span>
            <span className="text-[9px] text-gray-400 lowercase tracking-normal">(unsettled)</span>
          </p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">Rp {pendingClearing.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      {/* Tables Row - Dense */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Payout History */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payout History</h3>
          <div className="bg-white border border-gray-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date & ID</th>
                  <th className="px-4 py-2.5 font-medium">Method</th>
                  <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                  <th className="px-4 py-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payoutHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No payout history.</td>
                  </tr>
                ) : payoutHistory.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{new Date(po.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{po.id.slice(0, 8).toUpperCase()}...</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{po.method}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      Rp {po.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {po.status === 'completed' || po.status === 'withdrawn' ? (
                        <span className="text-[10px] uppercase font-bold text-emerald-600">Completed</span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-amber-600">Processing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Double-Entry Ledger</h3>
          <div className="bg-white border border-gray-200">
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-xs italic">No recent transactions.</div>
              ) : recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      tx.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 
                      tx.type === 'fee' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {tx.type === 'sale' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{tx.desc}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ml-4 ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
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
