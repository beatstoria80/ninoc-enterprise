'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, ImagePlus, Package, Layers, Camera } from 'lucide-react';
import type { VariantSubmission } from '@/lib/types/allocation';

interface CategoryOption {
  id: string;
  name: string;
}

export default function RequestAllocationModalClient({ supplierId }: { supplierId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [step, setStep] = useState(1);

  // Categories from DB
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryOption[]>([]);

  // Form Data — Step 1: Basic Info
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    base_hpp: '',
    category_id: '',
    sub_category_id: '',
    weight_grams: '',
    material: '',
    brand: '',
  });

  // Form Data — Step 2: Variants
  const [variants, setVariants] = useState<VariantSubmission[]>([
    { size: '', color: '', initial_stock: 0 }
  ]);

  // Form Data — Step 3: Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // ─── Fetch Categories ─────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (data) setCategories(data);
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!formData.category_id) {
        setSubCategories([]);
        return;
      }
      const { data } = await supabase
        .from('sub_categories')
        .select('id, name')
        .eq('category_id', formData.category_id)
        .order('name');
      if (data) setSubCategories(data);
    };
    fetchSubCategories();
  }, [formData.category_id]);

  // ─── Variant Helpers ──────────────────────────────────
  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', initial_stock: 0 }]);
  };

  const removeVariant = (idx: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx: number, field: keyof VariantSubmission, value: string | number) => {
    const updated = [...variants];
    if (field === 'initial_stock') {
      updated[idx][field] = Number(value) || 0;
    } else {
      (updated[idx] as any)[field] = value;
    }
    setVariants(updated);
  };

  const totalInitialStock = variants.reduce((sum, v) => sum + v.initial_stock, 0);

  // ─── Image Helpers ────────────────────────────────────
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    
    setImageFiles(prev => [...prev, ...toAdd]);
    
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Validation ───────────────────────────────────────
  const validateStep1 = () => {
    if (!formData.product_name.trim()) return 'Nama produk harus diisi.';
    if (!formData.base_hpp || Number(formData.base_hpp) <= 0) return 'HPP harus lebih dari 0.';
    if (!formData.category_id) return 'Kategori harus dipilih.';
    if (!formData.weight_grams || Number(formData.weight_grams) <= 0) return 'Berat produk harus diisi.';
    return null;
  };

  const validateStep2 = () => {
    const hasValidVariant = variants.some(v => v.initial_stock > 0);
    if (!hasValidVariant) return 'Minimal 1 varian harus memiliki stok awal > 0.';
    return null;
  };

  // ─── Submit ───────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Upload images
      const uploadedImageUrls: string[] = [];
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const uniqueId = crypto.randomUUID();
        const fileName = `${supplierId}-${uniqueId}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error('Gagal mengupload foto: ' + uploadError.message);
        }
        
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        uploadedImageUrls.push(publicUrlData.publicUrl);
      }

      // Clean variants (filter out empty rows)
      const cleanVariants = variants.filter(v => 
        v.size.trim() || v.color.trim() || v.initial_stock > 0
      );

      const { error } = await supabase
        .from('supplier_product_submissions')
        .insert([{
          supplier_id: supplierId,
          product_name: formData.product_name,
          description: formData.description || null,
          base_hpp: Number(formData.base_hpp),
          category_id: formData.category_id || null,
          sub_category_id: formData.sub_category_id || null,
          weight_grams: Number(formData.weight_grams) || 0,
          material: formData.material || null,
          brand: formData.brand || null,
          variants_data: cleanVariants,
          images: uploadedImageUrls,
          status: 'pending'
        }]);

      if (error) throw error;

      setSuccessMsg('Pengajuan alokasi berhasil dikirim ke Admin NINOC!');
      setTimeout(() => {
        resetForm();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setStep(1);
    setSuccessMsg('');
    setErrorMsg('');
    setFormData({
      product_name: '', description: '', base_hpp: '',
      category_id: '', sub_category_id: '',
      weight_grams: '', material: '', brand: '',
    });
    setVariants([{ size: '', color: '', initial_stock: 0 }]);
    setImageFiles([]);
    setImagePreviews([]);
  };

  // ─── Step Navigation ──────────────────────────────────
  const goNext = () => {
    setErrorMsg('');
    if (step === 1) {
      const err = validateStep1();
      if (err) return setErrorMsg(err);
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) return setErrorMsg(err);
    }
    if (step < 3) setStep(step + 1);
  };

  const goBack = () => {
    setErrorMsg('');
    if (step > 1) setStep(step - 1);
  };

  const stepLabels = [
    { num: 1, label: 'Info Produk', icon: Package },
    { num: 2, label: 'Varian & Stok', icon: Layers },
    { num: 3, label: 'Foto Produk', icon: Camera },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-1.5 rounded-sm"
      >
        <Plus size={14} /> Request Allocation
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-display font-medium text-lg text-ink">Pengajuan Alokasi Baru</h3>
              <button 
                onClick={resetForm}
                className="p-2 -mr-2 text-ink/40 hover:text-ink/80 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-1">
                {stepLabels.map((s, i) => (
                  <React.Fragment key={s.num}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      step === s.num 
                        ? 'bg-ink text-white' 
                        : step > s.num
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      <s.icon size={14} />
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{s.num}</span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Messages */}
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

              {/* ─── STEP 1: Basic Info ────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">Nama Produk <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.product_name}
                      onChange={e => setFormData({...formData, product_name: e.target.value})}
                      placeholder="e.g. Cargo Pants Premium"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Kategori <span className="text-rose-500">*</span></label>
                      <select
                        value={formData.category_id}
                        onChange={e => setFormData({...formData, category_id: e.target.value, sub_category_id: ''})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                      >
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Sub-Kategori</label>
                      <select
                        value={formData.sub_category_id}
                        onChange={e => setFormData({...formData, sub_category_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                        disabled={!formData.category_id || subCategories.length === 0}
                      >
                        <option value="">-- Opsional --</option>
                        {subCategories.map(sc => (
                          <option key={sc.id} value={sc.id}>{sc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Harga Dasar (HPP) <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.base_hpp}
                          onChange={e => setFormData({...formData, base_hpp: e.target.value})}
                          placeholder="50000"
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Berat (gram) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.weight_grams}
                        onChange={e => setFormData({...formData, weight_grams: e.target.value})}
                        placeholder="250"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Material / Bahan</label>
                      <input 
                        type="text" 
                        value={formData.material}
                        onChange={e => setFormData({...formData, material: e.target.value})}
                        placeholder="e.g. Cotton Twill 280gsm"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-1">Brand / Merek</label>
                      <input 
                        type="text" 
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        placeholder="e.g. NINOC Originals"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">Deskripsi Produk</label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Deskripsi detail tentang produk..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink/50 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Variants & Stock ─────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-ink">Varian Produk</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Tentukan ukuran, warna, dan stok awal per varian.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white text-[11px] font-medium rounded-lg hover:bg-ink/90 transition-colors"
                    >
                      <Plus size={14} /> Tambah Varian
                    </button>
                  </div>

                  {/* Variant Header */}
                  <div className="grid grid-cols-[1fr_1fr_100px_40px] gap-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium px-1">
                    <span>Ukuran</span>
                    <span>Warna</span>
                    <span>Stok Awal</span>
                    <span></span>
                  </div>

                  {/* Variant Rows */}
                  {variants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_100px_40px] gap-2 items-center">
                      <input
                        type="text"
                        value={v.size}
                        onChange={e => updateVariant(idx, 'size', e.target.value)}
                        placeholder="e.g. M, L, XL"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-ink/50"
                      />
                      <input
                        type="text"
                        value={v.color}
                        onChange={e => updateVariant(idx, 'color', e.target.value)}
                        placeholder="e.g. Black"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-ink/50"
                      />
                      <input
                        type="number"
                        min="0"
                        value={v.initial_stock || ''}
                        onChange={e => updateVariant(idx, 'initial_stock', e.target.value)}
                        placeholder="0"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-ink/50 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        disabled={variants.length <= 1}
                        className="p-2 text-gray-300 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-100">
                    <span className="text-xs text-gray-500">{variants.length} varian</span>
                    <span className="text-sm font-bold text-ink">
                      Total Stok Awal: <span className="text-emerald-600">{totalInitialStock}</span> unit
                    </span>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Images ───────────────────── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-ink">Foto Produk</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Upload hingga 5 foto produk untuk etalase NINOC. Foto pertama akan menjadi cover.</p>
                  </div>

                  {/* Image Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-ink text-white text-[9px] px-1.5 py-0.5 rounded font-medium uppercase">Cover</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {imageFiles.length < 5 && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-ink/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600">
                        <ImagePlus size={24} />
                        <span className="text-[10px] font-medium">Tambah</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageAdd}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Submission Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2">
                    <h5 className="text-xs font-bold text-ink uppercase tracking-wider">Ringkasan Pengajuan</h5>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-gray-500">Produk:</span>
                      <span className="font-medium text-ink">{formData.product_name}</span>
                      <span className="text-gray-500">HPP:</span>
                      <span className="font-medium text-emerald-600">Rp {Number(formData.base_hpp).toLocaleString('id-ID')}</span>
                      <span className="text-gray-500">Kategori:</span>
                      <span className="font-medium text-ink">{categories.find(c => c.id === formData.category_id)?.name || '-'}</span>
                      <span className="text-gray-500">Berat:</span>
                      <span className="font-medium text-ink">{formData.weight_grams}g</span>
                      <span className="text-gray-500">Varian:</span>
                      <span className="font-medium text-ink">{variants.length} varian ({totalInitialStock} unit)</span>
                      <span className="text-gray-500">Foto:</span>
                      <span className="font-medium text-ink">{imageFiles.length} foto</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
              <div>
                {step > 1 && (
                  <button 
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-ink border border-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={16} /> Kembali
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink transition-colors"
                >
                  Batal
                </button>

                {step < 3 ? (
                  <button 
                    type="button"
                    onClick={goNext}
                    className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-ink rounded-lg hover:bg-ink/90 transition-colors"
                  >
                    Lanjut <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
