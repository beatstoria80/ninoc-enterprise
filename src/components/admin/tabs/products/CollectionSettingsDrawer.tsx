"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, Calendar, Tag, Search, Plus, Trash2, CheckSquare, Square, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Product, Collection } from '../../types';
import Image from 'next/image';

interface CollectionSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null; // if null, it's "Create New"
  onSaved: () => void;
}

export function CollectionSettingsDrawer({ isOpen, onClose, collection, onSaved }: CollectionSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'products'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const isVideoUrl = (url: string | null | undefined) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Collection>>({
    name: '',
    slug: '',
    description: '',
    status: 'draft',
    banner_url: '',
    collection_type: 'manual',
    start_date: '',
    end_date: '',
  });

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Load collection data when opened
  useEffect(() => {
    if (isOpen) {
      if (collection) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          name: collection.name || '',
          slug: collection.slug || '',
          description: collection.description || '',
          status: collection.status || 'draft',
          banner_url: collection.banner_url || '',
          collection_type: collection.collection_type || 'manual',
          start_date: collection.start_date ? new Date(collection.start_date).toISOString().split('T')[0] : '',
          end_date: collection.end_date ? new Date(collection.end_date).toISOString().split('T')[0] : '',
        });
        
        // Fetch products for this collection
        const fetchCollectionProducts = async () => {
          const { data } = await supabase
            .from('collection_products')
            .select('product_id')
            .eq('collection_id', collection.id);
          
          if (data) {
            setSelectedProductIds(new Set(data.map(d => d.product_id)));
          }
        };
        fetchCollectionProducts();
      } else {
        // Reset for new
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          name: '',
          slug: '',
          description: '',
          status: 'draft',
          banner_url: '',
          collection_type: 'manual',
          start_date: '',
          end_date: '',
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedProductIds(new Set());
      }

      // Fetch all products for the picker
      const fetchAllProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setAllProducts(data);
      };
      fetchAllProducts();
    }
  }, [isOpen, collection]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!collection && formData.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({
        ...prev,
        slug: prev.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }));
    }
  }, [formData.name, collection]);

  const toggleProduct = (productId: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    setSelectedProductIds(next);
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('collections')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('collections')
        .getPublicUrl(fileName);

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, banner_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert(`Gagal mengunggah media: ${(error as Error).message || 'Pastikan ukuran file tidak terlalu besar.'}`);
    } finally {
      setIsUploadingBanner(false);
      // Reset input value
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let savedCollectionId = collection?.id;

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        status: formData.status,
        banner_url: formData.banner_url,
        collection_type: formData.collection_type,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      if (savedCollectionId) {
        // Update existing
        await supabase.from('collections').update(payload).eq('id', savedCollectionId);
        
        // Delete old relations
        await supabase.from('collection_products').delete().eq('collection_id', savedCollectionId);
      } else {
        // Create new
        const { data, error } = await supabase.from('collections').insert([payload]).select().single();
        if (error) throw error;
        savedCollectionId = data.id;
      }

      // Insert new relations
      if (savedCollectionId && selectedProductIds.size > 0) {
        const relations = Array.from(selectedProductIds).map(pid => ({
          collection_id: savedCollectionId,
          product_id: pid
        }));
        await supabase.from('collection_products').insert(relations);
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-display font-medium text-ink">
                {collection ? 'Edit Collection' : 'Create Collection'}
              </h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-ink hover:bg-gray-50 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* TABS */}
            <div className="flex p-2 bg-gray-50/50 border-b border-gray-100">
              {(['general', 'products'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded transition-colors",
                    activeTab === tab ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink hover:bg-white/50"
                  )}
                >
                  {tab === 'general' ? 'General Info' : `Products (${selectedProductIds.size})`}
                </button>
              ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto minimal-scroll p-6">
              {activeTab === 'general' ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink">Collection Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Ramadhan Sale 2026"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink">URL Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Banner */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink flex items-center gap-2">
                      <ImageIcon size={14} /> Banner Media (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.banner_url ? (
                        <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 group">
                          {isVideoUrl(formData.banner_url) ? (
                            <video src={formData.banner_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                          ) : (
                            <Image src={formData.banner_url} alt="Banner Preview" fill className="object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer text-white p-2">
                              {isVideoUrl(formData.banner_url) ? <Video size={16} /> : <ImageIcon size={16} />}
                              <input 
                                type="file" 
                                accept="image/*,video/mp4,video/webm,video/quicktime" 
                                onChange={handleBannerUpload} 
                                className="hidden" 
                                disabled={isUploadingBanner}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-32 h-20 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex-shrink-0 flex flex-col items-center justify-center gap-1">
                          <ImageIcon size={16} className="text-gray-400" />
                          <span className="text-[9px] text-gray-400 font-medium">No Media</span>
                        </div>
                      )}

                      <div className="flex-1">
                        <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium text-ink cursor-pointer transition-colors disabled:opacity-50 w-full sm:w-auto">
                          {isUploadingBanner ? (
                            <>
                              <span className="w-3 h-3 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              {isVideoUrl(formData.banner_url) ? <Video size={14} /> : <ImageIcon size={14} />}
                              {formData.banner_url ? 'Change Media' : 'Upload Media'}
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*,video/mp4,video/webm,video/quicktime" 
                            onChange={handleBannerUpload} 
                            className="hidden" 
                            disabled={isUploadingBanner}
                          />
                        </label>
                        <p className="text-[10px] text-gray-400 mt-2">
                          Recommended format: JPG, PNG, MP4, WEBM. Ratio 16:9 or 3:1.
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink">Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink">Type</label>
                      <select
                        value={formData.collection_type}
                        onChange={e => setFormData(prev => ({ ...prev, collection_type: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none cursor-not-allowed"
                        disabled
                      >
                        <option value="manual">Manual</option>
                        <option value="smart">Smart (Coming Soon)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5"><Calendar size={12}/> Start Date</label>
                      <input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5"><Calendar size={12}/> End Date</label>
                      <input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products to add..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-rose focus:ring-1 focus:ring-rose outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredProducts.map(product => {
                      const isSelected = selectedProductIds.has(product.id);
                      return (
                        <div 
                          key={product.id} 
                          onClick={() => toggleProduct(product.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                            isSelected ? "border-rose bg-rose/5" : "border-gray-100 bg-white hover:border-gray-200"
                          )}
                        >
                          <button className={cn("flex-shrink-0", isSelected ? "text-rose" : "text-gray-300")}>
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          {product.image_url && (
                            <div className="relative w-10 h-10 rounded bg-gray-50 flex-shrink-0 overflow-hidden">
                              <Image src={product.image_url} alt="" fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{product.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{product.category}</p>
                          </div>
                          <p className="text-xs font-medium text-ink">
                            Rp {product.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !formData.name}
                className="flex items-center gap-2 px-6 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16} />}
                Save Collection
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
