import React, { useState, useEffect } from 'react';
import { FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StockLedger() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedgers = async () => {
    const { data } = await supabase
      .from('stock_ledgers')
      .select('*, product_variants(*, products(name))')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setLedgers(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLedgers();
  }, []);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'in_po': return 'bg-green-100 text-green-700';
      case 'out_order': return 'bg-rose/10 text-rose';
      case 'adj_manual': return 'bg-orange-100 text-orange-700';
      case 'retur': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'in_po': return 'PO Inbound';
      case 'out_order': return 'Online Sale';
      case 'adj_manual': return 'Manual Adj';
      case 'retur': return 'Customer Return';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-ink">Kartu Stok (Stock Ledger)</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading ledger data...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Product Variant</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Transaction Type</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-[10px] tracking-wider text-right">Qty</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Reference</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledgers.map(ledger => (
                <tr key={ledger.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(ledger.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">
                    {ledger.product_variants?.products?.name} - {ledger.product_variants?.size}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full ${getBadgeColor(ledger.type)}`}>
                      {formatType(ledger.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`flex items-center justify-end gap-1 font-bold ${ledger.qty > 0 ? 'text-green-600' : 'text-rose'}`}>
                      {ledger.qty > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(ledger.qty)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">
                    {ledger.reference_id || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {ledger.created_by || 'System'}
                  </td>
                </tr>
              ))}
              {ledgers.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                  No stock movements recorded yet.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
