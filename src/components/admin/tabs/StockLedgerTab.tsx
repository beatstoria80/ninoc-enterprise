import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRightLeft, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export function StockLedgerTab() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory_movements')
      .select('*, variants(sku, products(name)), warehouses(name)')
      .order('created_at', { ascending: false })
      .limit(100); // Last 100 movements
    if (data) setMovements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'inbound_do':
      case 'adjustment_found':
      case 'return':
        return <TrendingUp size={14} className="text-emerald-500" />;
      case 'outbound_order':
      case 'adjustment_loss':
        return <TrendingDown size={14} className="text-rose" />;
      default:
        return <RefreshCw size={14} className="text-ink/40" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Kartu Stok (Inventory Ledger)</h2>
          <p className="text-xs text-ink/60">Immutable log of all stock changes (inbound, outbound, returns).</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 text-[10px] uppercase tracking-wider text-ink/60">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Product & SKU</th>
              <th className="p-4 font-medium">Location</th>
              <th className="p-4 font-medium">Movement Type</th>
              <th className="p-4 font-medium text-right">Qty +/-</th>
              <th className="p-4 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 text-sm">
            {movements.map(mov => (
              <tr key={mov.id} className="hover:bg-ink/5 transition-colors cursor-pointer">
                <td className="p-4 text-ink/70">
                  {new Date(mov.created_at).toLocaleString('id-ID')}
                </td>
                <td className="p-4">
                  <div className="font-medium text-ink">{mov.variants?.products?.name || 'Unknown'}</div>
                  <div className="text-[10px] text-ink/50 mt-0.5">{mov.variants?.sku || 'NO-SKU'}</div>
                </td>
                <td className="p-4 text-ink/70">
                  {mov.warehouses?.name || 'Unknown'}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getMovementIcon(mov.movement_type)}
                    <span className="text-ink uppercase text-[10px] tracking-wider font-medium">
                      {mov.movement_type.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className={`p-4 text-right font-bold ${mov.quantity_change > 0 ? 'text-emerald-600' : 'text-rose'}`}>
                  {mov.quantity_change > 0 ? '+' : ''}{mov.quantity_change}
                </td>
                <td className="p-4 text-ink/60 text-xs font-mono">
                  {mov.reference_id || '-'}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  <ArrowRightLeft className="mx-auto mb-2 opacity-50" size={24} />
                  <p>No inventory movements recorded yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
