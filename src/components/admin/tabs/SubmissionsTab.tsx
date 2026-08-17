import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageSearch, Check, X, Building, LayoutList, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import { FashionInventoryTable } from '@/components/supplier/inventory/FashionInventoryTable';
import { FnBInventoryTable } from '@/components/supplier/inventory/FnBInventoryTable';
import { writeAuditLog } from '@/lib/utils/auditLogger';
import type { Submission, SupplierBasic, SupplierProduct } from '@/lib/types/allocation';
import { processSubmission } from '@/app/actions/submissions';

// ─── Helpers ───────────────────────────────────────────────
function buildSubmissionSnapshot(sub: Submission) {
  return {
    submission_id: sub.id,
    product_name: sub.product_name,
    base_hpp: sub.base_hpp,
    supplier_name: sub.suppliers?.name || 'N/A',
    supplier_id: sub.supplier_id,
    category: sub.categories?.name || 'Uncategorized',
    description: sub.description || '',
    images: sub.images || [],
  };
}

// ─── Main Component ────────────────────────────────────────
export function SubmissionsTab() {
  const [viewMode, setViewMode] = useState<'curation' | 'inventory'>('curation');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Curation state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Inventory state
  const [suppliers, setSuppliers] = useState<SupplierBasic[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('supplier_product_submissions')
      .select('*, suppliers(name), categories(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SubmissionsTab] fetchSubmissions error:', error);
      setFetchError('Gagal memuat pengajuan: ' + error.message);
    } else {
      setSubmissions((data as Submission[]) || []);
    }
    setLoading(false);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const { data, error } = await supabase.from('suppliers').select('id, name, pillar, status').order('name');
    if (error) {
      console.error('[SubmissionsTab] fetchSuppliers error:', error);
    } else {
      setSuppliers((data as SupplierBasic[]) || []);
    }
  }, []);

  const fetchSupplierInventory = useCallback(async (supplierId: string) => {
    setLoadingInventory(true);
    setInventoryError(null);
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, price, stock, image_url, category, is_perishable, created_at,
        product_variants (id, size, color, stock_quantity, sku)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SubmissionsTab] fetchSupplierInventory error:', error);
      setInventoryError('Gagal memuat inventaris: ' + error.message);
    } else {
      setSupplierProducts((data as SupplierProduct[]) || []);
    }
    setLoadingInventory(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmissions();
    fetchSuppliers();
  }, [fetchSubmissions, fetchSuppliers]);

  useEffect(() => {
    if (selectedSupplierId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSupplierInventory(selectedSupplierId);
    } else {
      setSupplierProducts([]);
      setInventoryError(null);
    }
  }, [selectedSupplierId, fetchSupplierInventory]);

  // ─── Curation Actions ───────────────────────────────────
  const handleAction = async (sub: Submission, action: 'approve' | 'reject') => {
    let payload = {};
    if (action === 'reject') {
      const reason = prompt('Reason for rejection:');
      if (!reason) return;
      payload = { reason };
    } else {
      const ninocMarkup = prompt('Enter NINOC Markup Amount (Rp) to add to Base HPP:');
      if (!ninocMarkup || isNaN(Number(ninocMarkup))) return;
      payload = { markupAmount: Number(ninocMarkup) };
    }

    setProcessingId(sub.id);
    try {
      const res = await processSubmission(sub.id, action, payload);
      if (!res.success) {
        alert('Gagal memproses pengajuan: ' + res.message);
      } else {
        fetchSubmissions();
      }
    } catch (err: any) {
      alert('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Derived State ──────────────────────────────────────
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const isFnB = selectedSupplier?.pillar === 'FNB';

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header + View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Supplier Allocations & Curation</h2>
          <p className="text-xs text-ink/80">Manage incoming B2B goods and monitor supplier active inventory.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('curation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'curation' ? 'bg-white shadow-sm text-ink' : 'text-gray-500 hover:text-ink'}`}
          >
            <CheckSquare size={16} /> Pending Requests
          </button>
          <button
            onClick={() => setViewMode('inventory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'inventory' ? 'bg-white shadow-sm text-ink' : 'text-gray-500 hover:text-ink'}`}
          >
            <LayoutList size={16} /> Active Inventory
          </button>
        </div>
      </div>

      {/* ─── Curation View ───────────────────────────────── */}
      {viewMode === 'curation' && (
        <div className="grid grid-cols-1 gap-2">
          {/* Loading State */}
          {loading && (
            <div className="bg-white border border-ink/5 rounded-xl p-12 text-center text-ink/60">
              <Loader2 className="mx-auto mb-3 animate-spin" size={24} />
              <p className="text-xs">Memuat pengajuan...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && fetchError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
              <AlertCircle className="mx-auto mb-2 text-rose-500" size={24} />
              <p className="text-sm text-rose-700">{fetchError}</p>
              <button onClick={fetchSubmissions} className="mt-3 text-xs font-medium text-rose-600 hover:underline">Coba Lagi</button>
            </div>
          )}

          {/* Submission Cards */}
          {!loading && !fetchError && submissions.map((sub, idx) => (
            <div
              key={sub.id}
              className="stagger-fade-in bg-white border border-ink/5 p-3 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 md:items-center justify-between"
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-ink text-lg">{sub.product_name}</h3>
                  <span className="px-2 py-0.5 bg-ink/5 text-[10px] uppercase tracking-widest font-medium rounded text-ink/80">
                    {sub.categories?.name || 'Uncategorized'}
                  </span>
                </div>
                <p className="text-xs text-ink/90 max-w-2xl">{sub.description}</p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-ink/80">
                    <Building size={14} />
                    <span>{sub.suppliers?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-ink">
                    <span>Base HPP:</span>
                    <span className="text-emerald-600">Rp {sub.base_hpp.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleAction(sub, 'reject')}
                  disabled={processingId === sub.id}
                  className="px-2 py-1 border border-rose/20 text-rose text-xs font-medium rounded hover:bg-rose/5 active:scale-[0.97] transition-all duration-150 ease-out flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === sub.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
                </button>
                <button
                  onClick={() => handleAction(sub, 'approve')}
                  disabled={processingId === sub.id}
                  className="px-2 py-1 bg-ink text-white text-xs font-medium rounded hover:bg-emerald-600 active:scale-[0.97] transition-all duration-150 ease-out flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === sub.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve & Markup
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!loading && !fetchError && submissions.length === 0 && (
            <div className="bg-white border border-ink/5 rounded-xl p-12 text-center text-ink/80">
              <PackageSearch className="mx-auto mb-4 opacity-50" size={32} />
              <h3 className="text-ink font-medium mb-1">No Pending Submissions</h3>
              <p className="text-xs">All factory product submissions have been curated.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Inventory View ──────────────────────────────── */}
      {viewMode === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier to Monitor</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full sm:w-1/2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
            >
              <option value="">-- Choose a Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.pillar || 'FASHION'})</option>
              ))}
            </select>
          </div>

          {selectedSupplierId && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {loadingInventory && (
                <div className="p-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Loading inventory...
                </div>
              )}

              {!loadingInventory && inventoryError && (
                <div className="p-6 text-center">
                  <AlertCircle className="mx-auto mb-2 text-rose-500" size={24} />
                  <p className="text-sm text-rose-700">{inventoryError}</p>
                </div>
              )}

              {!loadingInventory && !inventoryError && (
                isFnB ? (
                  <FnBInventoryTable products={supplierProducts} />
                ) : (
                  <FashionInventoryTable products={supplierProducts} />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
