"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, Upload, Link, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface Banner {
  id: string;
  title: string;
  desktop_image_url: string;
  tablet_image_url: string;
  mobile_image_url: string;
  link_url: string;
  is_active: boolean;
  order_index: number;
}

export function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New Banner State
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [tabletFile, setTabletFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('order_index', { ascending: true });
      
    if (data) setBanners(data);
    setLoading(false);
  }

  const handleUpload = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!title || !desktopFile || !mobileFile) return alert("Title, Desktop, and Mobile images are required.");
    setSaving(true);
    
    try {
      const desktop_url = await handleUpload(desktopFile, 'desktop');
      const tablet_url = tabletFile ? await handleUpload(tabletFile, 'tablet') : desktop_url;
      const mobile_url = await handleUpload(mobileFile, 'mobile');
      
      const { error } = await supabase.from('banners').insert({
        title,
        link_url: linkUrl,
        desktop_image_url: desktop_url,
        tablet_image_url: tablet_url,
        mobile_image_url: mobile_url,
        order_index: banners.length,
        is_active: true
      });
      
      if (error) throw error;
      
      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (e: any) {
      alert("Error saving banner: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    await supabase.from('banners').delete().eq('id', id);
    fetchBanners();
  };

  const resetForm = () => {
    setTitle('');
    setLinkUrl('');
    setDesktopFile(null);
    setTabletFile(null);
    setMobileFile(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider">Dynamic Banners</h2>
          <p className="text-xs text-ink/60">Manage promotional banners for PC, Tablet, and Mobile layouts.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-ink text-white px-4 py-2 text-[10px] uppercase tracking-wider"
        >
          <Plus size={14} /> Add Banner
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-xs">Loading banners...</p>
        ) : banners.length === 0 ? (
          <p className="text-xs text-ink/60">No banners found. Create one to get started.</p>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="border border-ink/10 p-4 flex justify-between items-center bg-white">
              <div className="flex gap-4 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.desktop_image_url} alt={banner.title} className="w-32 h-16 object-cover border border-ink/10" />
                <div>
                  <h3 className="text-xs font-semibold">{banner.title}</h3>
                  <a href={banner.link_url} target="_blank" className="text-[10px] text-blue-500 hover:underline">{banner.link_url}</a>
                </div>
              </div>
              <button onClick={() => handleDelete(banner.id)} className="text-red-500 hover:bg-red-50 p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4">
              <X size={20} />
            </button>
            <h2 className="text-sm font-semibold uppercase mb-6">Create New Banner</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase mb-1">Title</label>
                <input 
                  type="text" value={title} onChange={e => setTitle(e.target.value)} 
                  className="w-full border border-ink/20 p-2 text-xs outline-none focus:border-ink" 
                  placeholder="Promo Ramadhan 2026"
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase mb-1">Target URL</label>
                <div className="flex gap-2">
                  <select 
                    value={
                      linkUrl === '' ? '' :
                      ['/', '/collections/all', '/collections/sale', '/collections/new', '/collections/pakaian-pria', '/collections/pakaian-wanita', '/collections/aksesoris'].includes(linkUrl) ? linkUrl : 'custom'
                    }
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setLinkUrl('');
                      } else {
                        setLinkUrl(e.target.value);
                      }
                    }}
                    className="border border-ink/20 p-2 text-xs outline-none focus:border-ink bg-white w-1/3"
                  >
                    <option value="" disabled>Pilih URL (atau ketik)</option>
                    <option value="/">Beranda (/)</option>
                    <option value="/collections/all">Semua Produk</option>
                    <option value="/collections/sale">Promo / Sale</option>
                    <option value="/collections/new">Produk Terbaru</option>
                    <option value="/collections/pakaian-pria">Pakaian Pria</option>
                    <option value="/collections/pakaian-wanita">Pakaian Wanita</option>
                    <option value="/collections/aksesoris">Aksesoris</option>
                    <option value="custom">-- Custom URL --</option>
                  </select>
                  <input 
                    type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} 
                    className="flex-1 border border-ink/20 p-2 text-xs outline-none focus:border-ink" 
                    placeholder="e.g. /shop/nama-produk"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-ink/20 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase mb-2">Desktop (16:9)</span>
                  <input type="file" accept="image/*" onChange={e => setDesktopFile(e.target.files?.[0] || null)} className="text-[9px] w-full" />
                </div>
                <div className="border border-ink/20 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase mb-2">Tablet (4:3)</span>
                  <input type="file" accept="image/*" onChange={e => setTabletFile(e.target.files?.[0] || null)} className="text-[9px] w-full" />
                </div>
                <div className="border border-ink/20 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase mb-2">Mobile (9:16)</span>
                  <input type="file" accept="image/*" onChange={e => setMobileFile(e.target.files?.[0] || null)} className="text-[9px] w-full" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-ink/20 text-xs">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-ink text-white text-xs disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
