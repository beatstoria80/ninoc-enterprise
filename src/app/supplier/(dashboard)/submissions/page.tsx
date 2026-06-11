'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageOpen, Plus, Send, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SupplierSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: user } = await supabase
      .from('supplier_users')
      .select('supplier_id')
      .eq('user_id', session.user.id)
      .single();

    if (user) {
      setSupplierId(user.supplier_id);
      
      const { data: subs } = await supabase
        .from('supplier_product_submissions')
        .select('*, categories(name)')
        .eq('supplier_id', user.supplier_id)
        .order('created_at', { ascending: false });
      
      if (subs) setSubmissions(subs);
    }

    const { data: cats } = await supabase.from('categories').select('*').order('name');
    if (cats) setCategories(cats);

    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supplierId) return;
    
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const newSubmission = {
      supplier_id: supplierId,
      product_name: formData.get('name') as string,
      category_id: formData.get('category') as string,
      base_hpp: parseFloat(formData.get('hpp') as string),
      description: formData.get('description') as string,
      status: 'pending'
    };

    const { error } = await supabase
      .from('supplier_product_submissions')
      .insert([newSubmission]);

    if (!error) {
      setShowModal(false);
      fetchInitialData();
    }
    setSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'rejected': return <AlertCircle size={14} className="text-rose" />;
      default: return <Clock size={14} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Product Submissions</h2>
          <p className="text-xs text-ink/60">Submit your factory&apos;s products for NINOC curation and B2B deployment.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-ink text-white text-xs md:text-[10px] uppercase tracking-wider font-medium flex items-center gap-2 rounded hover:bg-rose active:scale-[0.97] transition-all duration-150 ease-out"
        >
          <Plus size={14} /> New Submission
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 text-xs md:text-[10px] uppercase tracking-wider text-ink/60">
              <th className="p-4 font-medium">Product Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Base HPP</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 text-sm">
            {submissions.map((sub, idx) => (
              <tr 
                key={sub.id} 
                className="stagger-fade-in hover:bg-ink/5 active:scale-[0.99] transition-all duration-150 ease-out cursor-pointer origin-left"
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
              >
                <td className="p-4 font-medium text-ink">{sub.product_name}</td>
                <td className="p-4 text-ink/70">
                  {sub.categories?.name || 'Uncategorized'}
                </td>
                <td className="p-4 text-ink/70">
                  Rp {sub.base_hpp.toLocaleString('id-ID')}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs md:text-[10px] uppercase tracking-wider font-medium rounded-full ${
                    sub.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    sub.status === 'rejected' ? 'bg-rose/10 text-rose' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {getStatusIcon(sub.status)}
                    {sub.status}
                  </span>
                </td>
                <td className="p-4 text-ink/60 text-xs">
                  {new Date(sub.created_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
            {!loading && submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-ink/40">
                  <PackageOpen className="mx-auto mb-3 opacity-50" size={32} />
                  <p>You haven&apos;t submitted any products yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-ink/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-ink/5 flex justify-between items-center bg-cr noise">
              <h3 className="font-display font-medium text-ink">Submit New Product</h3>
              <button onClick={() => setShowModal(false)} className="text-ink/40 hover:text-rose transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs md:text-[10px] uppercase tracking-wider font-medium text-ink/60 mb-1.5">Product Name</label>
                <input required name="name" type="text" className="w-full border border-ink/10 rounded px-3 py-2 text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all" placeholder="e.g. Heavyweight Cotton Oversized T-Shirt" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-[10px] uppercase tracking-wider font-medium text-ink/60 mb-1.5">Category</label>
                  <select required name="category" className="w-full border border-ink/10 rounded px-3 py-2 text-sm focus:border-rose outline-none transition-all bg-white">
                    <option value="">Select Category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs md:text-[10px] uppercase tracking-wider font-medium text-ink/60 mb-1.5">Base Factory Price (HPP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">Rp</span>
                    <input required name="hpp" type="number" min="0" className="w-full border border-ink/10 rounded pl-8 pr-3 py-2 text-sm focus:border-rose outline-none transition-all" placeholder="50000" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-[10px] uppercase tracking-wider font-medium text-ink/60 mb-1.5">Material & Specs Description</label>
                <textarea required name="description" rows={3} className="w-full border border-ink/10 rounded px-3 py-2 text-sm focus:border-rose outline-none transition-all resize-none" placeholder="100% Cotton, 235gsm, preshrunk..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-medium text-ink/60 hover:text-ink transition-colors">
                  Cancel
                </button>
                <button disabled={submitting} type="submit" className="px-5 py-2 bg-ink text-white text-xs font-medium rounded hover:bg-rose active:scale-[0.97] transition-all duration-150 ease-out flex items-center gap-2 disabled:opacity-50">
                  {submitting ? 'Submitting...' : <><Send size={14} /> Submit for Curation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
