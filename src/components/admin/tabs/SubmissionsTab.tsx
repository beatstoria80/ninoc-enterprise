import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageSearch, Check, X, Building, LayoutList, CheckSquare } from 'lucide-react';
import { FashionInventoryTable } from '@/components/supplier/inventory/FashionInventoryTable';
import { FnBInventoryTable } from '@/components/supplier/inventory/FnBInventoryTable';

export function SubmissionsTab() {
  const [viewMode, setViewMode] = useState<'curation' | 'inventory'>('curation');

  // Curation state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inventory state
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('supplier_product_submissions')
      .select('*, suppliers(name), categories(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmissions();
    fetchSuppliers();
  }, []);

  const fetchSupplierInventory = async (supplierId: string) => {
    setLoadingInventory(true);
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, price, stock, image_url, category, is_perishable, created_at,
        product_variants (id, size, color, stock_quantity, sku)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    if (data) setSupplierProducts(data);
    setLoadingInventory(false);
  };

  useEffect(() => {
    if (selectedSupplierId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSupplierInventory(selectedSupplierId);
    } else {
      setSupplierProducts([]);
    }
  }, [selectedSupplierId]);

  const handleAction = async (sub: any, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const reason = prompt('Reason for rejection:');
      if (!reason) return;
      
      await supabase
        .from('supplier_product_submissions')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', sub.id);
    } else {
      const ninocMarkup = prompt('Enter NINOC Markup Amount (Rp) to add to Base HPP:');
      if (!ninocMarkup || isNaN(Number(ninocMarkup))) return;
      
      const sellingPrice = sub.base_hpp + Number(ninocMarkup);
      
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          name: sub.product_name,
          slug: sub.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: sub.description,
          price: sellingPrice,
          category_id: sub.category_id,
          supplier_id: sub.supplier_id
        }])
        .select()
        .single();
        
      if (!error && newProduct) {
        await supabase.from('product_costings').insert([{
          product_id: newProduct.id,
          supplier_base_price: sub.base_hpp,
          ninoc_markup: Number(ninocMarkup)
        }]);
        
        await supabase
          .from('supplier_product_submissions')
          .update({ status: 'approved' })
          .eq('id', sub.id);
      } else {
        alert('Failed to create product: ' + error?.message);
        return;
      }
    }
    
    fetchSubmissions();
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const isFnB = selectedSupplier?.pillar === 'FNB';

  return (
    <div className="space-y-4">
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

      {viewMode === 'curation' && (
        <div className="grid grid-cols-1 gap-2">
          {submissions.map((sub, idx) => (
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
                  className="px-2 py-1 border border-rose/20 text-rose text-xs font-medium rounded hover:bg-rose/5 active:scale-[0.97] transition-all duration-150 ease-out flex items-center gap-2"
                >
                  <X size={14} /> Reject
                </button>
                <button 
                  onClick={() => handleAction(sub, 'approve')}
                  className="px-2 py-1 bg-ink text-white text-xs font-medium rounded hover:bg-emerald-600 active:scale-[0.97] transition-all duration-150 ease-out flex items-center gap-2 shadow-sm"
                >
                  <Check size={14} /> Approve & Markup
                </button>
              </div>
            </div>
          ))}
          
          {!loading && submissions.length === 0 && (
            <div className="bg-white border border-ink/5 rounded-xl p-12 text-center text-ink/80">
              <PackageSearch className="mx-auto mb-4 opacity-50" size={32} />
              <h3 className="text-ink font-medium mb-1">No Pending Submissions</h3>
              <p className="text-xs">All factory product submissions have been curated.</p>
            </div>
          )}
        </div>
      )}

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
              {loadingInventory ? (
                <div className="p-8 text-center text-gray-500 text-sm">Loading inventory...</div>
              ) : (
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
