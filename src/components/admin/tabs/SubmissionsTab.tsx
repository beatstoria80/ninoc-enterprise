import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageSearch, Check, X, Building } from 'lucide-react';

export function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmissions();
  }, []);

  const handleAction = async (sub: any, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const reason = prompt('Reason for rejection:');
      if (!reason) return;
      
      await supabase
        .from('supplier_product_submissions')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', sub.id);
    } else {
      // Approve logic - Convert to Product
      const ninocMarkup = prompt('Enter NINOC Markup Amount (Rp) to add to Base HPP:');
      if (!ninocMarkup || isNaN(Number(ninocMarkup))) return;
      
      const sellingPrice = sub.base_hpp + Number(ninocMarkup);
      
      // 1. Insert into products
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
        // 2. Insert into product_costings
        await supabase.from('product_costings').insert([{
          product_id: newProduct.id,
          supplier_base_price: sub.base_hpp,
          ninoc_markup: Number(ninocMarkup)
        }]);
        
        // 3. Update submission status
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Supplier Submissions (Curation)</h2>
          <p className="text-xs text-ink/60">Review incoming B2B goods, apply NINOC markup, and approve to catalog.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {submissions.map((sub, idx) => (
          <div 
            key={sub.id} 
            className="stagger-fade-in bg-white border border-ink/5 p-6 rounded-xl shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between"
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-ink text-lg">{sub.product_name}</h3>
                <span className="px-2 py-0.5 bg-ink/5 text-[10px] uppercase tracking-widest font-medium rounded text-ink/60">
                  {sub.categories?.name || 'Uncategorized'}
                </span>
              </div>
              <p className="text-sm text-ink/70 max-w-2xl">{sub.description}</p>
              
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-xs text-ink/60">
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
                className="px-4 py-2 border border-rose/20 text-rose text-xs font-medium rounded hover:bg-rose/5 active:scale-[0.97] transition-all duration-150 ease-out flex items-center gap-2"
              >
                <X size={14} /> Reject
              </button>
              <button 
                onClick={() => handleAction(sub, 'approve')}
                className="px-4 py-2 bg-ink text-white text-xs font-medium rounded hover:bg-emerald-600 active:scale-[0.97] transition-all duration-150 ease-out flex items-center gap-2 shadow-sm"
              >
                <Check size={14} /> Approve & Markup
              </button>
            </div>
          </div>
        ))}
        
        {!loading && submissions.length === 0 && (
          <div className="bg-white border border-ink/5 rounded-xl p-12 text-center text-ink/40">
            <PackageSearch className="mx-auto mb-4 opacity-50" size={32} />
            <h3 className="text-ink font-medium mb-1">No Pending Submissions</h3>
            <p className="text-sm">All factory product submissions have been curated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
