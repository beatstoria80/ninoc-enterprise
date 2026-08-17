'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus } from 'lucide-react';

export default function RequestAllocationModalClient({ supplierId }: { supplierId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    base_hpp: '',
    categoryId: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let uploadedImageUrl = '';
      if (imageFile) {
        // We will assume 'product-images' bucket or similar exists. We'll use standard storage upload.
        // Wait, uploadSupabaseFile is likely in '@/lib/utils/uploadHelpers'
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${supplierId}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error('Gagal mengupload foto: ' + uploadError.message);
        }
        
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        uploadedImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from('supplier_product_submissions')
        .insert([{
          supplier_id: supplierId,
          product_name: formData.product_name,
          description: formData.description,
          base_hpp: Number(formData.base_hpp),
          images: uploadedImageUrl ? [uploadedImageUrl] : [],
          status: 'pending'
        }]);

      if (error) throw error;

      setSuccessMsg('Pengajuan alokasi berhasil dikirim ke Admin!');
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setFormData({ product_name: '', description: '', base_hpp: '', categoryId: '' });
        setImageFile(null);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-ink text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-2"
      >
        <Plus size={16} /> Request Allocation
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-display font-medium text-lg text-ink">Pengajuan Alokasi Baru</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-ink/40 hover:text-ink/80 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {errorMsg && (
                <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-sm font-medium">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Nama Produk</label>
                  <input 
                    required
                    type="text" 
                    value={formData.product_name}
                    onChange={e => setFormData({...formData, product_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Harga Dasar (HPP) - IDR</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    value={formData.base_hpp}
                    onChange={e => setFormData({...formData, base_hpp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Deskripsi & Spesifikasi</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Foto Produk (Untuk Etalase)</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-ink/5 file:text-ink
                      hover:file:bg-ink/10"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink border border-gray-200 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-ink rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Memproses...' : 'Kirim Pengajuan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
