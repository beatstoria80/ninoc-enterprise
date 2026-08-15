import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Factory, Clock, AlertCircle, FileText, ShieldCheck, MapPin, ChevronDown, Package, Truck, AlertTriangle, DollarSign } from 'lucide-react';

interface SupplierStats {
  totalOrders: number;
  totalItemsSold: number;
  totalRevenue: number;
  returCount: number;
  cancelledCount: number;
}

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [supplierStats, setSupplierStats] = useState<Record<string, SupplierStats>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [supRes, whRes, itemsRes, returRes] = await Promise.all([
      supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
      supabase.from('warehouses').select('id, name, code').eq('is_active', true),
      supabase.from('order_items').select('id, supplier_id, quantity, price, orders!inner(status)'),
      supabase.from('retur_requests').select('id, order:orders!inner(order_items!inner(supplier_id))')
    ]);
    if (supRes.data) setSuppliers(supRes.data);
    if (whRes.data) setWarehouses(whRes.data);

    // Compute stats per supplier
    const stats: Record<string, SupplierStats> = {};
    if (itemsRes.data) {
      itemsRes.data.forEach((item: any) => {
        const sid = item.supplier_id;
        if (!sid) return;
        if (!stats[sid]) stats[sid] = { totalOrders: 0, totalItemsSold: 0, totalRevenue: 0, returCount: 0, cancelledCount: 0 };
        const orderStatus = (item.orders as any)?.status;
        if (orderStatus === 'cancelled') {
          stats[sid].cancelledCount += item.quantity || 1;
        } else if (orderStatus !== 'refunded') {
          stats[sid].totalItemsSold += item.quantity || 1;
          stats[sid].totalRevenue += (item.price || 0) * (item.quantity || 1);
        }
        stats[sid].totalOrders += 1;
      });
    }
    if (returRes.data) {
      returRes.data.forEach((ret: any) => {
        const items = ret.order?.order_items || [];
        items.forEach((item: any) => {
          const sid = item.supplier_id;
          if (!sid) return;
          if (!stats[sid]) stats[sid] = { totalOrders: 0, totalItemsSold: 0, totalRevenue: 0, returCount: 0, cancelledCount: 0 };
          stats[sid].returCount += 1;
        });
      });
    }
    setSupplierStats(stats);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this supplier as ${newStatus}?`)) return;
    await supabase.from('suppliers').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const updateWarehouse = async (id: string, hubId: string) => {
    await supabase.from('suppliers').update({ assigned_hub_id: hubId || null }).eq('id', id);
    fetchData();
  };

  const viewDocument = async (path: string) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from('supplier_documents').createSignedUrl(path, 60 * 5); // 5 minutes
    if (error) {
      alert('Error fetching document: ' + error.message);
    } else if (data) {
      window.open(data.signedUrl, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center text-ink/80">Loading suppliers...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Supplier Partner Review (KYC)</h2>
          <p className="text-xs text-ink/80">Approve or reject B2B manufacturer applications and verify legal integrity.</p>
        </div>
        <div className="bg-ink/5 p-3 rounded-lg flex gap-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink/90">Pending</p>
            <p className="text-xl font-bold text-amber-600">{suppliers.filter(s => s.status === 'pending').length}</p>
          </div>
          <div className="w-px bg-ink/10" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink/90">Active</p>
            <p className="text-xl font-bold text-emerald-600">{suppliers.filter(s => s.status === 'active').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 text-[10px] uppercase tracking-wider text-ink/80">
              <th className="p-2 font-medium">Factory / Company</th>
              <th className="p-2 font-medium">Legal Identity (KYC)</th>
              <th className="p-2 font-medium">Operational KPIs</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 text-xs">
            {suppliers.map(sup => {
              const stats = supplierStats[sup.id] || { totalOrders: 0, totalItemsSold: 0, totalRevenue: 0, returCount: 0, cancelledCount: 0 };
              const isExpanded = expandedId === sup.id;
              return (
                <React.Fragment key={sup.id}>
                  <tr className="hover:bg-ink/5 transition-colors">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-ink/5 flex items-center justify-center text-ink/80 shrink-0">
                          <Factory size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-ink">{sup.name}</p>
                          <p className="text-[10px] text-ink/80 font-mono">{sup.contact_email}</p>
                          <p className="text-[10px] text-ink/80 font-mono">{sup.contact_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-emerald-500" />
                          {sup.legal_entity_type || 'Unknown'} {sup.legal_name || 'No Data'}
                        </p>
                        <p className="text-[10px] text-ink/80">Dir: {sup.director_name || '-'}</p>
                        <p className="text-[10px] text-ink/80">NPWP: {sup.tax_id || '-'}</p>
                        <p className="text-[10px] text-ink/80">NIB: {sup.business_registration_number || '-'}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      {sup.status === 'active' ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Package size={11} className="text-blue-500" />
                              <span className="text-[10px] text-ink/70">{stats.totalItemsSold} sold</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={11} className="text-emerald-500" />
                              <span className="text-[10px] text-ink/70">IDR {(stats.totalRevenue / 1000).toFixed(0)}K</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {stats.returCount > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle size={11} className="text-amber-500" />
                                <span className="text-[10px] text-amber-600 font-medium">{stats.returCount} retur</span>
                              </div>
                            )}
                            {stats.cancelledCount > 0 && (
                              <div className="flex items-center gap-1">
                                <X size={11} className="text-red-500" />
                                <span className="text-[10px] text-red-600 font-medium">{stats.cancelledCount} cancel</span>
                              </div>
                            )}
                            {stats.returCount === 0 && stats.cancelledCount === 0 && (
                              <span className="text-[10px] text-emerald-500 font-medium">✓ Clean record</span>
                            )}
                          </div>
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : sup.id)}
                            className="flex items-center gap-1 text-[10px] text-ink/50 hover:text-ink transition-colors"
                          >
                            <ChevronDown size={10} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-ink/40">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          sup.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          sup.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {sup.status === 'active' ? <Check size={10} /> : sup.status === 'pending' ? <Clock size={10} /> : <X size={10} />}
                          {sup.status}
                        </span>
                        {sup.status === 'active' && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin size={12} className="text-ink/50" />
                            <select 
                              value={sup.assigned_hub_id || ''} 
                              onChange={(e) => updateWarehouse(sup.id, e.target.value)}
                              className="text-[10px] px-1 py-0.5 border border-ink/20 rounded bg-white max-w-[120px]"
                            >
                              <option value="">Unassigned</option>
                              {warehouses.map(w => <option key={w.id} value={w.id}>{w.code}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      {sup.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(sup.id, 'active')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold tracking-widest hover:bg-emerald-100 rounded transition-colors" title="Approve">
                            Approve
                          </button>
                          <button onClick={() => updateStatus(sup.id, 'suspended')} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] uppercase font-bold tracking-widest hover:bg-red-100 rounded transition-colors" title="Reject">
                            Reject
                          </button>
                        </div>
                      )}
                      {sup.status === 'active' && (
                        <button onClick={() => updateStatus(sup.id, 'suspended')} className="text-[10px] text-red-500 hover:underline uppercase tracking-wider font-medium">
                          Suspend
                        </button>
                      )}
                      {sup.status === 'suspended' && (
                        <button onClick={() => updateStatus(sup.id, 'active')} className="text-[10px] text-emerald-500 hover:underline uppercase tracking-wider font-medium">
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Operational Detail Row */}
                  {isExpanded && sup.status === 'active' && (
                    <tr>
                      <td colSpan={5} className="bg-ink/[0.02] p-4 border-t border-ink/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded-lg border border-ink/10">
                            <p className="text-[10px] uppercase tracking-wider text-ink/50 mb-1">Total Orders Processed</p>
                            <p className="text-lg font-bold text-ink">{stats.totalOrders}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-ink/10">
                            <p className="text-[10px] uppercase tracking-wider text-ink/50 mb-1">Items Sold</p>
                            <p className="text-lg font-bold text-ink">{stats.totalItemsSold}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-ink/10">
                            <p className="text-[10px] uppercase tracking-wider text-ink/50 mb-1">Revenue Generated</p>
                            <p className="text-lg font-bold text-emerald-600">IDR {stats.totalRevenue.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-ink/10">
                            <p className="text-[10px] uppercase tracking-wider text-ink/50 mb-1">Issue Rate</p>
                            <p className={`text-lg font-bold ${(stats.returCount + stats.cancelledCount) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {stats.totalOrders > 0 ? (((stats.returCount + stats.cancelledCount) / stats.totalOrders) * 100).toFixed(1) : '0'}%
                            </p>
                            <p className="text-[10px] text-ink/50 mt-0.5">{stats.returCount} returs, {stats.cancelledCount} cancels</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {sup.id_card_url && (
                            <button onClick={() => viewDocument(sup.id_card_url)} className="flex items-center gap-2 text-[10px] uppercase font-medium text-ink/80 hover:text-rose transition-colors bg-white px-3 py-1.5 rounded border border-ink/10">
                              <FileText size={12} /> KTP Direktur
                            </button>
                          )}
                          {sup.tax_id_url && (
                            <button onClick={() => viewDocument(sup.tax_id_url)} className="flex items-center gap-2 text-[10px] uppercase font-medium text-ink/80 hover:text-rose transition-colors bg-white px-3 py-1.5 rounded border border-ink/10">
                              <FileText size={12} /> NPWP
                            </button>
                          )}
                          {sup.business_license_url && (
                            <button onClick={() => viewDocument(sup.business_license_url)} className="flex items-center gap-2 text-[10px] uppercase font-medium text-ink/80 hover:text-rose transition-colors bg-white px-3 py-1.5 rounded border border-ink/10">
                              <FileText size={12} /> NIB
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink/80">
                  <AlertCircle className="mx-auto mb-2 opacity-50" size={24} />
                  <p>No supplier applications yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
