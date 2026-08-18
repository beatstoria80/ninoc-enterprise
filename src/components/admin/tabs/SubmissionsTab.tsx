import React, { useState, useEffect, useCallback } from 'react';

import { PackageSearch, Check, X, Building, LayoutList, CheckSquare, Loader2, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon, Layers, Hash, Weight, Tag, Calendar, Eye } from 'lucide-react';
import { FashionInventoryTable } from '@/components/supplier/inventory/FashionInventoryTable';
import { FnBInventoryTable } from '@/components/supplier/inventory/FnBInventoryTable';

import type { Submission, SupplierBasic, SupplierProduct, VariantSubmission } from '@/lib/types/allocation';
import { processSubmission, getPendingSubmissions, getSuppliersList, getSupplierInventory } from '@/app/actions/submissions';
import { cn } from '@/lib/utils';

// ─── Helpers ───────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysAgo(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return '1 hari lalu';
  return `${diff} hari lalu`;
}

// SKU Preview Generator
function generateSkuPreview(sub: Submission): string[] {
  const supplierCode = sub.suppliers?.supplier_code || 'NNC-UNK-000';
  const catCode = sub.categories?.name
    ? sub.categories.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase()
    : 'GEN';
  const baseName = sub.product_name.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
  let nameHash = 0;
  for (let i = 0; i < sub.product_name.length; i++) {
    nameHash = sub.product_name.charCodeAt(i) + ((nameHash << 5) - nameHash);
  }
  const uniqueNum = Math.abs(nameHash % 900) + 100;
  const productCode = `${baseName}${uniqueNum}`;

  const variants: VariantSubmission[] = Array.isArray(sub.variants_data) ? sub.variants_data : [];
  if (variants.length === 0) return [`${supplierCode}-${catCode}-${productCode}-NON-OS`];

  return variants.map(v => {
    const colorCode = (v.color || 'NON').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const sizeCode = (v.size || 'OS').toUpperCase();
    return `${supplierCode}-${catCode}-${productCode}-${colorCode}-${sizeCode}`;
  });
}

// ─── Main Component ────────────────────────────────────────
export function SubmissionsTab() {
  const [viewMode, setViewMode] = useState<'curation' | 'inventory'>('curation');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{ isOpen: boolean; sub: Submission | null; action: 'approve' | 'reject' | null }>({
    isOpen: false,
    sub: null,
    action: null
  });
  const [modalInput, setModalInput] = useState('');
  const [modalError, setModalError] = useState('');

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

  // Image lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const res = await getPendingSubmissions();

    if (!res.success) {
      console.error('[SubmissionsTab] fetchSubmissions error:', res.message);
      setFetchError('Gagal memuat pengajuan: ' + res.message);
    } else {
      setSubmissions((res.data as Submission[]) || []);
    }
    setLoading(false);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const res = await getSuppliersList();
    if (!res.success) {
      console.error('[SubmissionsTab] fetchSuppliers error:', res.message);
    } else {
      setSuppliers((res.data as SupplierBasic[]) || []);
    }
  }, []);

  const fetchSupplierInventory = useCallback(async (supplierId: string) => {
    setLoadingInventory(true);
    setInventoryError(null);
    const res = await getSupplierInventory(supplierId);

    if (!res.success) {
      console.error('[SubmissionsTab] fetchSupplierInventory error:', res.message);
      setInventoryError('Gagal memuat inventaris: ' + res.message);
    } else {
      setSupplierProducts((res.data as SupplierProduct[]) || []);
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
  const openActionModal = (sub: Submission, action: 'approve' | 'reject') => {
    setModalState({ isOpen: true, sub, action });
    setModalInput('');
    setModalError('');
  };

  const confirmAction = async () => {
    const { sub, action } = modalState;
    if (!sub || !action) return;

    let payload = {};
    if (action === 'reject') {
      if (!modalInput.trim()) return setModalError('Alasan penolakan harus diisi.');
      payload = { reason: modalInput };
    } else {
      const markup = Number(modalInput);
      if (isNaN(markup) || markup <= 0) return setModalError('Markup harus berupa angka lebih dari 0.');
      payload = { markupAmount: markup };
    }

    setModalState({ isOpen: false, sub: null, action: null });
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
        <div className="grid grid-cols-1 gap-3">
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
          {!loading && !fetchError && submissions.map((sub, idx) => {
            const isExpanded = expandedId === sub.id;
            const variants: VariantSubmission[] = Array.isArray(sub.variants_data) ? sub.variants_data : [];
            const totalStock = variants.reduce((sum, v) => sum + (v.initial_stock || 0), 0);
            const skuPreviews = generateSkuPreview(sub);

            return (
              <div
                key={sub.id}
                className="stagger-fade-in bg-white border border-ink/5 rounded-xl shadow-sm overflow-hidden"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
              >
                {/* Card Header */}
                <div className="p-4 flex flex-col md:flex-row gap-3 md:items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {/* Supplier Badge + Code */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full w-fit shadow-sm">
                        <Building size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">{sub.suppliers?.name || 'Unknown Supplier'}</span>
                      </div>
                      {sub.suppliers?.supplier_code && (
                        <span className="px-2 py-1 bg-gray-900 text-white text-[10px] font-mono font-bold rounded tracking-wider">
                          {sub.suppliers.supplier_code}
                        </span>
                      )}
                      <span className="text-[10px] text-ink/40 flex items-center gap-1">
                        <Calendar size={10} />
                        {daysAgo(sub.created_at)}
                      </span>
                    </div>

                    {/* Product Name + Category */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-ink text-lg">{sub.product_name}</h3>
                      <span className="px-2 py-0.5 bg-ink/5 text-[10px] uppercase tracking-widest font-medium rounded text-ink/80">
                        {sub.categories?.name || 'Uncategorized'}
                      </span>
                      {sub.sub_categories?.name && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] uppercase tracking-widest font-medium rounded border border-amber-100">
                          {sub.sub_categories.name}
                        </span>
                      )}
                    </div>

                    {sub.description && (
                      <p className="text-xs text-ink/70 max-w-2xl line-clamp-2">{sub.description}</p>
                    )}

                    {/* Key Metrics Row */}
                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        <span>HPP:</span>
                        <span className="text-emerald-600">Rp {sub.base_hpp.toLocaleString('id-ID')}</span>
                      </div>
                      {sub.weight_grams > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-ink/60">
                          <Weight size={12} />
                          <span>{sub.weight_grams}g</span>
                        </div>
                      )}
                      {sub.material && (
                        <div className="flex items-center gap-1 text-[11px] text-ink/60">
                          <Tag size={12} />
                          <span>{sub.material}</span>
                        </div>
                      )}
                      {sub.brand && (
                        <div className="flex items-center gap-1 text-[11px] text-ink/60 bg-ink/5 px-1.5 py-0.5 rounded">
                          {sub.brand}
                        </div>
                      )}
                      {variants.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-ink/60">
                          <Layers size={12} />
                          <span>{variants.length} varian • {totalStock} unit</span>
                        </div>
                      )}
                      {sub.images && sub.images.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-ink/60">
                          <ImageIcon size={12} />
                          <span>{sub.images.length} foto</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-ink/60 hover:text-ink bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                    >
                      <Eye size={14} />
                      {isExpanded ? 'Tutup' : 'Detail'}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button 
                      onClick={() => openActionModal(sub, 'reject')}
                      disabled={processingId === sub.id}
                      className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => openActionModal(sub, 'approve')}
                      disabled={processingId === sub.id}
                      className="bg-ink text-white hover:bg-ink/90 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {processingId === sub.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Approve
                    </button>
                  </div>
                </div>

                {/* ─── Expanded Detail Panel ──────────────── */}
                {isExpanded && (
                  <div className="border-t border-ink/5 bg-gray-50/50 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Image Gallery */}
                      {sub.images && sub.images.length > 0 && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider text-ink/50 font-medium mb-2">Foto Produk</h4>
                          <div className="flex gap-2 flex-wrap">
                            {sub.images.map((img, imgIdx) => (
                              <button
                                key={imgIdx}
                                onClick={() => setLightboxImg(img)}
                                className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-ink/30 transition-colors relative group"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img} alt={`Product ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                {imgIdx === 0 && (
                                  <span className="absolute top-0.5 left-0.5 bg-ink text-white text-[7px] px-1 py-0.5 rounded font-bold uppercase">Cover</span>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supplier Info */}
                      <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-ink/50 font-medium mb-2">Info Supplier</h4>
                        <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Supplier</span>
                            <span className="font-medium text-ink">{sub.suppliers?.name || 'N/A'}</span>
                          </div>
                          {sub.suppliers?.supplier_code && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Kode Supplier</span>
                              <span className="font-mono font-bold text-ink bg-gray-100 px-1.5 py-0.5 rounded">{sub.suppliers.supplier_code}</span>
                            </div>
                          )}
                          {sub.suppliers?.pillar && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Pillar</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                sub.suppliers.pillar === 'FNB' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                              )}>
                                {sub.suppliers.pillar}
                              </span>
                            </div>
                          )}
                          {sub.suppliers?.contact_email && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Email</span>
                              <span className="font-mono text-ink/70">{sub.suppliers.contact_email}</span>
                            </div>
                          )}
                          {sub.suppliers?.contact_phone && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Telepon</span>
                              <span className="font-mono text-ink/70">{sub.suppliers.contact_phone}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Diajukan</span>
                            <span className="text-ink/70">{formatDate(sub.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Variants Table */}
                    {variants.length > 0 && (
                      <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-ink/50 font-medium mb-2">Varian & Stok Awal</h4>
                        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400">
                                <th className="px-3 py-2 text-left font-medium">Ukuran</th>
                                <th className="px-3 py-2 text-left font-medium">Warna</th>
                                <th className="px-3 py-2 text-right font-medium">Stok Awal</th>
                                <th className="px-3 py-2 text-left font-medium">SKU Preview</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {variants.map((v, vIdx) => (
                                <tr key={vIdx} className="hover:bg-gray-50/50">
                                  <td className="px-3 py-2 font-medium text-ink">{v.size || 'One Size'}</td>
                                  <td className="px-3 py-2 text-ink/70">{v.color || '-'}</td>
                                  <td className="px-3 py-2 text-right font-bold text-ink">{v.initial_stock}</td>
                                  <td className="px-3 py-2">
                                    <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                                      {skuPreviews[vIdx] || '-'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gray-50 border-t border-gray-100">
                                <td colSpan={2} className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium">Total</td>
                                <td className="px-3 py-2 text-right font-bold text-ink text-sm">{totalStock}</td>
                                <td className="px-3 py-2 text-[10px] text-gray-400">{variants.length} SKU</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Specifications / JSONB */}
                    {sub.specifications && Object.keys(sub.specifications).length > 0 && (
                      <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-ink/50 font-medium mb-2">Spesifikasi</h4>
                        <div className="bg-white rounded-lg border border-gray-100 p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(sub.specifications).map(([key, val]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                              <span className="font-medium text-ink">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

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

      {/* ─── Image Lightbox ──────────────────────────────── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxImg} alt="Product Preview" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain" />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-3 -right-3 bg-white text-ink p-1.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Action Modal (Enhanced) ─────────────────────── */}
      {modalState.isOpen && modalState.sub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 shrink-0">
              <h3 className="font-display font-bold text-lg text-ink">
                {modalState.action === 'approve' ? 'Approve Allocation' : 'Reject Allocation'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{modalState.sub.product_name}</p>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Submission Summary in Modal */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Supplier</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{modalState.sub.suppliers?.name || 'N/A'}</span>
                    {modalState.sub.suppliers?.supplier_code && (
                      <span className="font-mono text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">{modalState.sub.suppliers.supplier_code}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Kategori</span>
                  <span className="font-medium">{modalState.sub.categories?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Base HPP</span>
                  <span className="font-bold text-emerald-600">Rp {modalState.sub.base_hpp.toLocaleString('id-ID')}</span>
                </div>
                {(() => {
                  const v: VariantSubmission[] = Array.isArray(modalState.sub.variants_data) ? modalState.sub.variants_data : [];
                  const ts = v.reduce((s, x) => s + (x.initial_stock || 0), 0);
                  return v.length > 0 ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Varian / Stok</span>
                      <span className="font-medium">{v.length} varian • {ts} unit</span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* SKU Preview for Approve */}
              {modalState.action === 'approve' && (() => {
                const skus = generateSkuPreview(modalState.sub);
                return skus.length > 0 ? (
                  <div>
                    <label className="block text-[10px] font-bold text-ink mb-1.5 uppercase tracking-wider">SKU yang akan di-generate</label>
                    <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100 space-y-1 max-h-32 overflow-y-auto">
                      {skus.map((sku, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <Hash size={10} className="text-emerald-500 shrink-0" />
                          <span className="font-mono font-bold text-emerald-700">{sku}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {modalState.action === 'approve' ? (
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Markup Amount (Rp)</label>
                  <input
                    type="number"
                    value={modalInput}
                    onChange={e => setModalInput(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ink focus:border-ink outline-none"
                    autoFocus
                  />
                  {modalInput && Number(modalInput) > 0 && (
                    <div className="mt-2 bg-gray-50 rounded p-2 text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Harga Jual</span>
                        <span className="font-bold text-ink">Rp {(modalState.sub.base_hpp + Number(modalInput)).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Margin</span>
                        <span className="font-bold text-emerald-600">
                          {modalState.sub.base_hpp > 0 ? ((Number(modalInput) / modalState.sub.base_hpp) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Reason for Rejection</label>
                  <textarea
                    value={modalInput}
                    onChange={e => setModalInput(e.target.value)}
                    placeholder="Alasan detail..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ink focus:border-ink outline-none min-h-[100px]"
                    autoFocus
                  />
                </div>
              )}

              {modalError && (
                <p className="text-xs font-medium text-rose-500 bg-rose-50 p-2 rounded">{modalError}</p>
              )}
            </div>

            <div className="p-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 shrink-0">
              <button 
                onClick={() => setModalState({ isOpen: false, sub: null, action: null })}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ink hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmAction}
                className={cn(
                  "px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors",
                  modalState.action === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                )}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
