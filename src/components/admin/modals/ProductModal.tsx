// @ts-nocheck
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Trash2, Edit2, Plus, ArrowRightLeft, Download, ToggleRight, ToggleLeft, Save, Search, PanelRightClose, GripVertical, Check, Info, CalendarClock, PackagePlus } from "lucide-react";
import Image from "next/image";
import { isFnBDepartment, isObjectsDepartment } from "@/lib/departmentDomain";
import { compressImage, forceDownloadImage } from "@/lib/utils/imageUtils";


import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SeoHelper } from "@/components/admin/SeoHelper";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ProductModal(props: any) {
  const isFashion = !props.isFnB && !props.isObjects;
  const {
    isProductModalOpen, setIsProductModalOpen,
    isEditMode, productForm, setProductForm,
    dbDepartments, dbCategories, dbWarehouses,
    isUploadingProductImage, setIsUploadingProductImage,
    saveProduct, variants, setVariants,
    activeSpecTab, setActiveSpecTab,
    specifications, setSpecifications,
    handleAddSpec, handleRemoveSpec, handleUpdateSpec,
    galleryImages, setGalleryImages,
    handleUploadGalleryImage, handleRemoveGalleryImage,
    modelInfo, setModelInfo,
    isFnB, isObjects, isSeoPanelOpen, setIsSeoPanelOpen, showToast, handleProductNameChange,
    addVariant, removeVariant, updateVariant, handleProductImageUpload
  } = props;

  return (
    <>
      {/* ===== PRODUCT MODAL ===== */}
      <AnimatePresence>
        {isProductModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 lg:p-6"
          >
            <div className="flex items-start justify-center gap-4 w-full max-w-[1200px] max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
              
              {/* MAIN PRODUCT MODAL */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="w-full lg:max-w-3xl flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-ink/5 relative overflow-hidden flex-shrink-0 max-h-[90vh]"
              >
                <div className="bg-white px-5 py-4 border-b border-ink/5 flex items-center justify-between z-10 flex-shrink-0">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-ink tracking-tight">
                      {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <p className="text-[10px] text-ink/50 uppercase tracking-wider mt-0.5">Manage your product catalog</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isSeoPanelOpen && (
                      <button 
                        type="button"
                        onClick={() => setIsSeoPanelOpen(true)}
                        className="px-3 py-1.5 text-rose bg-rose/5 hover:bg-rose/10 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Search size={14} />
                        SEO Helper
                      </button>
                    )}
                    <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-2 text-ink/50 hover:text-ink hover:bg-ink/5 rounded-full transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
                  {/* STEP 1: CONCEPT MALL PILLAR & ORIGIN WAREHOUSE (VERY TOP HIERARCHY) */}
                  <div className="p-3 bg-gradient-to-r from-gray-900 via-gray-800 to-ink text-white rounded-xl shadow-sm space-y-2.5 border border-gray-700/50">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
                        <span>🏢</span> STEP 1: ENTERPRISE PILLAR & LOKASI GUDANG ASAL
                      </h4>
                      <span className="text-[9px] bg-rose/90 text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                        {isFnB ? 'F&B / Pantry Hub' : isObjects ? 'Objects & Home Goods' : 'Apparel'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-300 mb-1 font-semibold">Pilih Department Pillar</label>
                        <select
                          value={productForm.department_id}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            const selDept = dbDepartments.find(d => d.id === newDept || d.slug === newDept || String(d.id) === String(newDept));
                            const deptNameClean = (selDept?.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            const isPantrySel = newDept === '3' || newDept === 'pantry' || selDept?.slug === 'pantry' || ['pantry', 'f&b', 'cafe', 'roastery', 'coffee', 'pastry', 'rtd', 'snack', 'beverage', 'kopi'].some(k => deptNameClean.includes(k));
                            const isObjectsSel = !isPantrySel && (newDept === '2' || newDept === 'objects' || selDept?.slug === 'objects' || ['objects', 'consumer', 'home', 'kitchen', 'utilities', 'collectibles', 'ceramics', 'goods', 'homeware', 'lifestyle', 'keramik'].some(k => deptNameClean.includes(k)));

                            let newCat = productForm.category;
                            let newWh = productForm.warehouse_id;
                            let newPerishable = productForm.is_perishable;
                            let newSpecs = [...(productForm.specifications || [])];

                            const fbWh = dbWarehouses.find(w => (w.name || '').toLowerCase().includes('roastery') || (w.name || '').toLowerCase().includes('f&b') || w.code === 'WH-BANDUNG-FB')?.id || '';
                            const mainWh = dbWarehouses.find(w => w.is_primary || w.code === 'WH-BANDUNG-01')?.id || dbWarehouses[0]?.id || '';

                            if (isPantrySel) {
                              newCat = 'coffee';
                              newWh = fbWh;
                              newPerishable = true;
                              newSpecs = [{ label: 'Roast Level', value: 'Medium Roast' }];
                            } else if (isObjectsSel) {
                              newCat = 'utilities';
                              newWh = mainWh;
                              newPerishable = false;
                              newSpecs = [{ label: 'Material', value: 'High-Grade Ceramic' }];
                            } else {
                              newCat = 'kaos';
                              newWh = mainWh;
                              newPerishable = false;
                              newSpecs = [{ label: 'Fit', value: 'Standar / Regular Fit' }, { label: 'Jenis Pakaian', value: 'kaos' }];
                            }
                            setProductForm({
                              ...productForm,
                              department_id: newDept,
                              category: newCat,
                              sub_category: newCat,
                              warehouse_id: newWh,
                              is_perishable: newPerishable,
                              specifications: newSpecs
                            } as any);
                          }}
                          className="w-full px-2 py-1.5 border border-white/20 rounded-lg text-xs focus:outline-none focus:border-rose bg-gray-900 text-white font-medium shadow-inner"
                        >
                          <option value="">-- Pilih Department Pillar --</option>
                          {dbDepartments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                          {!dbDepartments.length && (
                            <>
                              <option value="1">Apparel (Garment Fashion)</option>
                              <option value="2">Objects & Consumer Goods (Home & Dining)</option>
                              <option value="3">Pantry & Café (F&B / Kopi / Pastry)</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-300 mb-1 font-semibold">Gudang Asal Pengiriman (Biteship Origin)</label>
                        <select
                          value={productForm.warehouse_id}
                          onChange={(e) => setProductForm({ ...productForm, warehouse_id: e.target.value })}
                          className="w-full px-2 py-1.5 border border-white/20 rounded-lg text-xs focus:outline-none focus:border-rose bg-gray-900 text-white font-medium shadow-inner"
                        >
                          <option value="">-- Pilih Gudang Asal --</option>
                          {dbWarehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name} (Biteship Numeric ID/Kode Pos: {w.postal_code || 'Tidak Ada'})</option>
                          ))}
                          {!dbWarehouses.length && (
                            <>
                              <option value="" disabled>Gudang Utama NINOC (Biteship ID: 40292) - Harap buat Gudang</option>
                              <option value="" disabled>NINOC Pantry Roastery Hub (Biteship ID: 40292) - Harap buat Gudang</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: BASIC INFORMATION */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center justify-between">
                      <span>STEP 2: INFORMASI DASAR & SEO</span>
                      <span className="text-[10px] font-normal text-gray-400 capitalize">{isFnB ? 'Produk Makanan / Minuman' : isObjects ? 'Produk Peralatan / Home' : 'Produk Fashion / Pakaian'}</span>
                    </h3>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Nama Produk (SEO Optimized)</label>
                      <textarea
                        value={productForm.name}
                        onChange={(e) => handleProductNameChange(e.target.value)}
                        placeholder={isFnB ? "e.g. NINOC Priangan Artisan Roasted Coffee Beans 250g..." : "Enter product name..."}
                        rows={2}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 resize-y leading-relaxed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Slug URL</label>
                      <input
                        type="text"
                        value={productForm.slug}
                        onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                        placeholder="product-slug-url"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 font-mono text-[11px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Harga Final (IDR)</label>
                        <input
                          type="text"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="e.g. 149000"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 font-semibold text-ink"
                        />
                      </div>
                    </div>



                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Kategori Spesifik Pillar</label>
                        <select
                          value={productForm.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newSpecs = [...(productForm.specifications || [])];
                            const jenisIdx = newSpecs.findIndex(s => s.label === 'Jenis Pakaian');
                            if (jenisIdx >= 0) {
                              newSpecs[jenisIdx].value = val;
                            } else if (!isFnB && !isObjects) {
                              newSpecs.push({ label: 'Jenis Pakaian', value: val });
                            }
                            setProductForm({ ...productForm, category: val, sub_category: val, specifications: newSpecs } as any);
                          }}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                        >
                          {(() => {
                            let filtered = dbCategories.length > 0 ? dbCategories.filter(c => {
                              if (c.slug === 'pakaian-unisex' || c.slug === 'baju-unisex') return false;
                              if (isFnB) return c.slug.includes('coffee') || c.slug.includes('kopi') || c.slug.includes('pastry') || c.slug.includes('snack') || c.slug.includes('rtd') || c.slug.includes('fnb') || c.slug.includes('beverage');
                              if (isObjects) return c.slug.includes('home') || c.slug.includes('kitchen') || c.slug.includes('utilities') || c.slug.includes('objects') || c.slug.includes('collectibles') || c.slug.includes('art');
                              return !c.slug.includes('coffee') && !c.slug.includes('kopi') && !c.slug.includes('pastry') && !c.slug.includes('snack') && !c.slug.includes('rtd') && !c.slug.includes('home') && !c.slug.includes('kitchen');
                            }) : [];

                            const presets = isFnB ? [
                              { slug: 'coffee', name: 'Biji Kopi / Roasted Beans' },
                              { slug: 'pastry', name: 'Pastry & Bakery' },
                              { slug: 'rtd', name: 'Minuman RTD / Beverages' },
                              { slug: 'snack', name: 'Camilan / Gourmet Snacks' }
                            ] : isObjects ? [
                              { slug: 'utilities', name: 'Utilities & Alat Tulis' },
                              { slug: 'home', name: 'Peralatan Rumah / Home Goods' },
                              { slug: 'kitchen', name: 'Kitchen & Dining' },
                              { slug: 'collectibles', name: 'Seni / Collectibles' }
                            ] : [
                              { slug: 'kaos', name: 'Kaos / T-Shirt (Atasan)' },
                              { slug: 'hoodie', name: 'Hoodie / Pullover (Atasan)' },
                              { slug: 'sweater', name: 'Sweater / Crewneck (Atasan)' },
                              { slug: 'kemeja', name: 'Kemeja / Flannel (Atasan)' },
                              { slug: 'jaket', name: 'Jaket & Outerwear (Atasan)' },
                              { slug: 'celana-panjang', name: 'Celana Panjang / Cargo / Trousers (Bawahan)' },
                              { slug: 'celana-pendek', name: 'Celana Pendek / Shorts (Bawahan)' },
                              { slug: 'rok-dress', name: 'Rok & Dress (Bawahan)' },
                              { slug: 'aksesoris', name: 'Aksesoris / Headwear & Bags' },
                              { slug: 'unisex', name: 'Unisex / Couple Set' },
                              { slug: 'archive', name: 'Arsip / Studio Edition' }
                            ];
                            // Deduplicate semantic overlaps between dbCategories and presets
                            const combined = [...filtered.filter(c => 
                              !['outerwear', 'celana', 'pakaian', 'pakaian-pria', 'pakaian-wanita'].includes(c.slug)
                            )];
                            presets.forEach(p => {
                              if (!combined.some(c => c.slug === p.slug)) {
                                combined.push({ id: p.slug as any, slug: p.slug, name: p.name });
                              }
                            });
                            return combined.map(c => (
                              <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: LOGISTICS & DIMENSIONS */}
                  <div className="p-3.5 bg-gray-50/90 border border-gray-200/80 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/80 flex items-center gap-1.5 border-b border-gray-200/60 pb-2">
                      <span>📦</span> STEP 3: DIMENSI LOGISTIK & BERAT (PERHITUNGAN BITESHIP)
                    </h4>

                    <div className="grid grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Berat / Weight (g)</label>
                        <input
                          type="number"
                          value={productForm.weight_grams}
                          onChange={(e) => setProductForm({ ...productForm, weight_grams: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white font-semibold text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Panjang / Length (cm)</label>
                        <input
                          type="number"
                          value={productForm.length_cm}
                          onChange={(e) => setProductForm({ ...productForm, length_cm: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Lebar / Width (cm)</label>
                        <input
                          type="number"
                          value={productForm.width_cm}
                          onChange={(e) => setProductForm({ ...productForm, width_cm: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Tinggi / Height (cm)</label>
                        <input
                          type="number"
                          value={productForm.height_cm}
                          onChange={(e) => setProductForm({ ...productForm, height_cm: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* ONLY DISPLAY F&B SHELF LIFE WHEN IS F&B! HIDE FOR FASHION/OBJECTS */}
                    {isFnB && (
                      <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-gray-200/60 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">⏳ Masa Simpan / Shelf Life (Hari)</label>
                          <input
                            type="number"
                            placeholder="e.g. 90 (Hari)"
                            value={productForm.shelf_life_days}
                            onChange={(e) => setProductForm({ ...productForm, shelf_life_days: e.target.value })}
                            className="w-full px-2 py-1.5 border border-amber-300/80 rounded-lg text-xs bg-white text-ink font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id="is_perishable"
                            checked={productForm.is_perishable}
                            onChange={(e) => setProductForm({ ...productForm, is_perishable: e.target.checked })}
                            className="rounded border-amber-400 text-rose focus:ring-rose w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="is_perishable" className="text-[11px] font-bold text-amber-950 cursor-pointer leading-tight">
                            Perishable (Mudah Basi)<br/>
                            <span className="text-[9px] font-medium text-amber-800/80 mt-0.5 inline-block">Bila dicentang: Hanya kurir Instan Lokal. Hilangkan centang untuk produk kemasan tahan lama (Bisa kirim luar provinsi/Reguler).</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 4: SPECIFICATIONS & BADGES */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
                      STEP 4: SPESIFIKASI & DESKRIPSI PRODUK
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Price Tag (Badge di atas harga)</label>
                        <select
                          value={productForm.price_tag}
                          onChange={(e) => setProductForm({ ...productForm, price_tag: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white"
                        >
                          <option value="">None (Tanpa Tag)</option>
                          <option value="Harga Special">Harga Special</option>
                          <option value="Diskon">Diskon</option>
                          <option value="Price Deal">Price Deal</option>
                          <option value="Limited Edition">Limited Edition</option>
                          <option value="Special Edition">Special Edition</option>
                          <option value="REDEEM">REDEEM</option>
                        </select>
                      </div>

                      {/* CONDITIONAL FIELD BASED ON PILLAR: Fit Type for Fashion vs Roast Level for F&B vs Material for Objects */}
                      <div>
                        {isFnB ? (
                          <>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Roast Level / Profil Rasa (F&B)</label>
                            <select
                              value={productForm.specifications?.find(s => s.label === 'Roast Level' || s.label === 'Profil Rasa')?.value || 'Medium Roast'}
                              onChange={(e) => {
                                const newSpecs = [...(productForm.specifications || [])];
                                const idx = newSpecs.findIndex(s => s.label === 'Roast Level' || s.label === 'Profil Rasa');
                                if (idx >= 0) {
                                  newSpecs[idx].value = e.target.value;
                                  newSpecs[idx].label = 'Roast Level';
                                } else {
                                  newSpecs.push({ label: 'Roast Level', value: e.target.value });
                                }
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                            >
                              <option value="Light Roast">Light Roast / Fruity Acidic</option>
                              <option value="Medium Roast">Medium Roast / Balanced</option>
                              <option value="Medium-Dark Roast">Medium-Dark Roast / Caramel & Nutty</option>
                              <option value="Dark Roast">Dark Roast / Bold & Smoky</option>
                              <option value="Fresh Pastry">Fresh Pastry / Daily Baked</option>
                            </select>
                          </>
                        ) : isObjects ? (
                          <>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Material / Bahan Utama (Objects)</label>
                            <select
                              value={productForm.specifications?.find(s => s.label === 'Material' || s.label === 'Bahan')?.value || 'High-Grade Ceramic'}
                              onChange={(e) => {
                                const newSpecs = [...(productForm.specifications || [])];
                                const idx = newSpecs.findIndex(s => s.label === 'Material' || s.label === 'Bahan');
                                if (idx >= 0) {
                                  newSpecs[idx].value = e.target.value;
                                  newSpecs[idx].label = 'Material';
                                } else {
                                  newSpecs.push({ label: 'Material', value: e.target.value });
                                }
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                            >
                              <option value="High-Grade Ceramic">High-Grade Ceramic</option>
                              <option value="Stainless Steel 304">Stainless Steel 304</option>
                              <option value="Solid Wood / Kayu Jati">Solid Wood / Kayu Jati</option>
                              <option value="Borosilicate Glass">Borosilicate Glass</option>
                              <option value="Premium Canvas / Utility">Premium Canvas / Utility</option>
                            </select>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Tipe Potongan / Fit Type (Fashion)</label>
                              <select
                                value={productForm.specifications?.find(s => s.label === 'Fit')?.value || 'Standar / Regular Fit'}
                                onChange={(e) => {
                                  const newSpecs = [...(productForm.specifications || [])];
                                  const fitIndex = newSpecs.findIndex(s => s.label === 'Fit');
                                  if (fitIndex >= 0) {
                                    newSpecs[fitIndex].value = e.target.value;
                                  } else {
                                    newSpecs.push({ label: 'Fit', value: e.target.value });
                                  }
                                  setProductForm({ ...productForm, specifications: newSpecs });
                                }}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                              >
                                <option value="Standar / Regular Fit">Standar / Regular Fit</option>
                                <option value="Oversize / Relaxed Fit">Oversize / Relaxed Fit</option>
                                <option value="Boxy Fit / Drop Shoulder">Boxy Fit / Drop Shoulder</option>
                                <option value="Slim Fit / Tapered">Slim Fit / Tapered</option>
                                <option value="Cropped Fit">Cropped Fit</option>
                                <option value="Athletic / Muscle Fit">Athletic / Muscle Fit</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Custom Badge Text (Overlay Label)</label>
                        <span className="text-[9px] text-gray-400 italic">Overrides default title badge</span>
                      </div>
                      <input
                        type="text"
                        value={productForm.badge_text || ''}
                        onChange={(e) => setProductForm({ ...productForm, badge_text: e.target.value })}
                        placeholder="Type custom text or pick preset..."
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {(isFnB ? 
                          ['FRESH ROAST', 'ARTISAN BLEND', 'DAILY FRESH', 'SINGLE ORIGIN', 'BEST SELLER', 'LIMITED EDITION', 'RECOMMENDED'] : 
                         isObjects ? 
                          ['HOME EDITION', 'STUDIO CRAFT', 'HANDMADE', 'BEST SELLER', 'LIMITED EDITION', 'NEW ARRIVAL'] :
                          ['BEST SELLER', 'NEW ARRIVAL', 'LIMITED EDITION', 'EXCLUSIVE', 'PREMIUM QUALITY', 'ORIGINAL DESIGN', 'STUDIO EDITION']
                        ).map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setProductForm({ ...productForm, badge_text: preset })}
                            className={cn(
                              "px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border transition-all",
                              productForm.badge_text === preset 
                                ? "bg-rose text-white border-rose shadow-sm" 
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, badge_text: '' })}
                          className="px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border border-gray-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 transition-all ml-auto"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* CUSTOM VARIANT LABEL (untuk mengganti "Pilih Warna" pada halaman produk) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Label Varian Kustom (Opsional)</label>
                        <span className="text-[9px] text-gray-400 italic">Ganti teks &ldquo;Pilih Warna&rdquo; di halaman toko</span>
                      </div>
                      <input
                        type="text"
                        value={productForm.variant_label || ''}
                        onChange={(e) => setProductForm({ ...productForm, variant_label: e.target.value })}
                        placeholder="Kosongkan untuk default (Pilih Warna). Contoh: Tech Deck Series, Motif, Aksen..."
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {(isFnB
                          ? ['Blend', 'Roast Profile', 'Varian Rasa', 'Origin']
                          : isObjects
                          ? ['Series', 'Motif', 'Aksen', 'Varian Model', 'Edisi']
                          : ['Warna', 'Motif', 'Series', 'Edisi', 'Aksen']
                        ).map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setProductForm({ ...productForm, variant_label: preset })}
                            className={cn(
                              "px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border transition-all",
                              productForm.variant_label === preset
                                ? "bg-rose text-white border-rose shadow-sm"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, variant_label: '' })}
                          className="px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border border-gray-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 transition-all ml-auto"
                        >
                          Reset Default
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Deskripsi Produk (Bahasa Indonesia)</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 min-h-[90px] leading-relaxed"
                        placeholder="Deskripsi lengkap mengenai bahan, keunggulan, atau catatan rasa..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Description (English)</label>
                      <textarea
                        value={productForm.description_en || ''}
                        onChange={(e) => setProductForm({ ...productForm, description_en: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 min-h-[90px] leading-relaxed"
                        placeholder="Product description in English..."
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Spesifikasi Detail (Key-Value Table)</label>
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, specifications: [...(productForm.specifications || []), { label: '', value: '' }] })}
                          className="text-[10px] uppercase tracking-wider text-rose hover:text-rose/80 font-bold flex items-center gap-1"
                        >
                          <span>+</span> Add Spec
                        </button>
                      </div>
                      <div className="space-y-2">
                        {productForm.specifications?.map((spec, idx) => {
                          if (spec.label.startsWith('ColorImage:') || spec.label.startsWith('ColorP') || spec.label === 'GlobalP5') return null;
                          return (
                          <div key={idx} className="flex gap-2 items-start">
                            <input
                              type="text"
                              placeholder={isFnB ? "e.g. Origin / Variety" : "e.g. Material"}
                              value={spec.label}
                              onChange={(e) => {
                                const newSpecs = [...productForm.specifications];
                                newSpecs[idx].label = e.target.value;
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="w-1/3 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 font-medium"
                            />
                            <input
                              type="text"
                              placeholder={isFnB ? "e.g. Priangan West Java / Arabica" : "e.g. 100% Cotton"}
                              value={spec.value}
                              onChange={(e) => {
                                const newSpecs = [...productForm.specifications];
                                newSpecs[idx].value = e.target.value;
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSpecs = productForm.specifications.filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose hover:bg-rose/5 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isFnB) {
                              setProductForm({
                                ...productForm,
                                specifications: [
                                  { label: 'Origin', value: 'Priangan West Java' },
                                  { label: 'Varietas', value: 'Arabica' },
                                  { label: 'Roast Level', value: 'Medium Roast' },
                                  { label: 'Process', value: 'Natural / Washed' },
                                  { label: 'Tasting Notes', value: 'Caramel, Dark Chocolate, Floral Hint' },
                                  { label: 'Berat Bersih', value: '200g / 500g / 1kg' },
                                  { label: 'Kemasan', value: 'Resealable Standing Pouch' },
                                  { label: 'Saran Penyajian', value: 'Suhu air 90-93°C, rasio 1:15' },
                                  { label: 'Asal Produksi', value: 'Roasted in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Roastery' },
                                ]
                              });
                            } else if (isObjects) {
                              setProductForm({
                                ...productForm,
                                specifications: [
                                  { label: 'Material', value: 'High-Grade Ceramic / Solid Wood' },
                                  { label: 'Finishing', value: 'Matte / Glazed' },
                                  { label: 'Dimensi', value: '10cm x 8cm x 12cm' },
                                  { label: 'Berat', value: '350g' },
                                  { label: 'Perawatan', value: 'Cuci tangan disarankan, Jangan gunakan serat kasar' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ]
                              });
                            } else {
                              const isCelana = productForm.category === 'celana';
                              const isHoodie = productForm.category === 'hoodie' || productForm.category === 'outer' || productForm.category === 'jaket';
                              setProductForm({
                                ...productForm,
                                specifications: isCelana ? [
                                  { label: 'Bahan', value: 'Cotton Twill 320gsm' },
                                  { label: 'Fit', value: 'Relaxed Fit' },
                                  { label: 'Kancing/Resleting', value: 'YKK Zipper' },
                                  { label: 'Kantong', value: '2 Samping & 2 Belakang' },
                                  { label: 'Detail', value: 'Waistband Adjustable, Belt Loop' },
                                  { label: 'Perawatan', value: 'Cuci mesin air dingin, Jangan gunakan pemutih' },
                                  { label: 'Jenis Produk', value: 'Celana / Trousers' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ] : isHoodie ? [
                                  { label: 'Bahan', value: 'Cotton Fleece 360gsm' },
                                  { label: 'Kerah', value: 'Hood / Hoodie' },
                                  { label: 'Fit', value: 'Oversize Fit' },
                                  { label: 'Design', value: 'Front & Back Graphic Artwork' },
                                  { label: 'Sablon', value: 'High-Quality DTF' },
                                  { label: 'Detail', value: 'Kangaroo Pocket, Drawstring Hood' },
                                  { label: 'Perawatan', value: 'Cuci mesin air dingin, Jangan gunakan pemutih' },
                                  { label: 'Jenis Produk', value: 'Hoodie / Outer' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ] : [
                                  { label: 'Bahan', value: '100% Cotton Combed 24s' },
                                  { label: 'Kerah', value: 'O-Neck' },
                                  { label: 'Fit', value: 'Regular Fit' },
                                  { label: 'Design', value: 'Front & Back Graphic Artwork' },
                                  { label: 'Motif', value: 'Design Art Illustration' },
                                  { label: 'Sablon', value: 'High-Quality DTF' },
                                  { label: 'Perawatan', value: 'Cuci mesin air dingin, Setrika suhu sedang' },
                                  { label: 'Jenis Produk', value: 'Kaos / Graphic Tee' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ]
                              });
                            }
                          }}
                          className="text-[10px] px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200 shadow-2xs"
                        >
                          ⚡ Auto-Fill Preset ({isFnB ? 'F&B Roastery' : isObjects ? 'Objects & Home' : productForm.category === 'celana' ? 'Celana' : productForm.category === 'hoodie' || productForm.category === 'outer' || productForm.category === 'jaket' ? 'Hoodie / Outer' : 'Atasan / Kaos'})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ===== STEP 5: MEASUREMENT / SIZE CHART & MODEL INFO (ONLY FOR FASHION PILLAR!) ===== */}
                  {isFashion && (
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
                      <div>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2.5">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-gray-700 font-bold">Measurement / Size Chart Garment (CM)</label>
                            <p className="text-[10px] text-gray-500">Standar spesifikasi industri apparel (Lebar Dada, Panjang Badan, Bahu, Lengan / Pinggang & Paha)</p>
                          </div>
                          <div className="flex items-center gap-2 self-start md:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                const isCelana = productForm.category === 'celana';
                                setProductForm({
                                  ...productForm,
                                  measurements: [
                                    ...(productForm.measurements || []),
                                    isCelana
                                      ? { size: '', waist: '', length: '', thigh: '', hip: '', leg_opening: '' }
                                      : { size: '', chest: '', length: '', shoulder: '', sleeve: '' }
                                  ]
                                });
                              }}
                              className="text-[10px] uppercase tracking-wider text-white bg-rose hover:bg-rose/90 px-3 py-1.5 rounded-lg font-bold shadow-2xs transition-all flex items-center gap-1"
                            >
                              <span>+ Add Size Row</span>
                            </button>
                            {(productForm.measurements?.length || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Kosongkan seluruh tabel ukuran? Ukuran juga akan dihapus dari varian website.')) {
                                    setProductForm({ ...productForm, measurements: [], variants: [] });
                                  }
                                }}
                                className="text-[10px] uppercase tracking-wider text-rose bg-rose/10 hover:bg-rose hover:text-white px-2.5 py-1.5 rounded-lg font-bold border border-rose/30 transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Hapus / Kosongkan semua baris ukuran sekaligus"
                              >
                                <Trash2 size={13} />
                                <span>Reset Table</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ===== INSTANT INDUSTRY PRESETS ===== */}
                        <div className="bg-gray-50/80 border border-gray-200/70 rounded-lg p-2.5 mb-3 space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block">⚡ One-Click Industry Standard Presets (Auto-Fill Table):</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setProductForm({
                                ...productForm,
                                measurements: [
                                  { size: 'S', chest: '56', length: '66', shoulder: '54', sleeve: '60' },
                                  { size: 'M', chest: '58', length: '68', shoulder: '56', sleeve: '61' },
                                  { size: 'L', chest: '60', length: '70', shoulder: '58', sleeve: '62' },
                                  { size: 'XL', chest: '63', length: '72', shoulder: '60', sleeve: '63' },
                                  { size: 'XXL', chest: '66', length: '74', shoulder: '62', sleeve: '64' },
                                  { size: '3XL', chest: '69', length: '76', shoulder: '64', sleeve: '65' }
                                ]
                              })}
                              className="px-2 py-1 bg-white hover:bg-rose/10 hover:text-rose hover:border-rose/30 text-gray-700 text-[9px] font-semibold border border-gray-200 rounded transition-all shadow-2xs"
                            >
                              🧥 Hoodie / Outer (Boxy Oversize Fit)
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductForm({
                                ...productForm,
                                measurements: [
                                  { size: 'S', chest: '54', length: '68', shoulder: '50', sleeve: '23' },
                                  { size: 'M', chest: '56', length: '70', shoulder: '52', sleeve: '24' },
                                  { size: 'L', chest: '58', length: '72', shoulder: '54', sleeve: '25' },
                                  { size: 'XL', chest: '61', length: '74', shoulder: '56', sleeve: '26' },
                                  { size: 'XXL', chest: '64', length: '76', shoulder: '58', sleeve: '27' },
                                  { size: '3XL', chest: '67', length: '78', shoulder: '60', sleeve: '28' }
                                ]
                              })}
                              className="px-2 py-1 bg-white hover:bg-rose/10 hover:text-rose hover:border-rose/30 text-gray-700 text-[9px] font-semibold border border-gray-200 rounded transition-all shadow-2xs"
                            >
                              👕 Kaos / Tee (Boxy Oversize Fit)
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductForm({
                                ...productForm,
                                measurements: [
                                  { size: 'S', chest: '48', length: '68', shoulder: '43', sleeve: '21' },
                                  { size: 'M', chest: '50', length: '70', shoulder: '45', sleeve: '22' },
                                  { size: 'L', chest: '52', length: '72', shoulder: '47', sleeve: '23' },
                                  { size: 'XL', chest: '55', length: '74', shoulder: '49', sleeve: '24' },
                                  { size: 'XXL', chest: '58', length: '76', shoulder: '51', sleeve: '25' },
                                  { size: '3XL', chest: '61', length: '78', shoulder: '53', sleeve: '26' }
                                ]
                              })}
                              className="px-2 py-1 bg-white hover:bg-rose/10 hover:text-rose hover:border-rose/30 text-gray-700 text-[9px] font-semibold border border-gray-200 rounded transition-all shadow-2xs"
                            >
                              👕 Kaos / Tee (Standar Regular Fit)
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductForm({
                                ...productForm,
                                measurements: [
                                  { size: '28 (S)', waist: '76', length: '98', thigh: '62', hip: '100', leg_opening: '38' },
                                  { size: '30 (M)', waist: '81', length: '100', thigh: '64', hip: '104', leg_opening: '40' },
                                  { size: '32 (L)', waist: '86', length: '102', thigh: '66', hip: '108', leg_opening: '42' },
                                  { size: '34 (XL)', waist: '91', length: '104', thigh: '69', hip: '113', leg_opening: '44' },
                                  { size: '36 (XXL)', waist: '96', length: '106', thigh: '72', hip: '118', leg_opening: '46' }
                                ]
                              })}
                              className="px-2 py-1 bg-white hover:bg-rose/10 hover:text-rose hover:border-rose/30 text-gray-700 text-[9px] font-semibold border border-gray-200 rounded transition-all shadow-2xs"
                            >
                              👖 Celana / Trousers (Relaxed Fit)
                            </button>
                          </div>
                        </div>

                        {(productForm.measurements?.length || 0) > 0 && (
                          <div className="space-y-2 overflow-x-auto">
                            {productForm.category === 'celana' ? (
                              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_40px] gap-2 text-[9px] uppercase tracking-wider text-gray-400 font-semibold px-1 min-w-[530px]">
                                <span>Size</span>
                                <span>Waist</span>
                                <span>Length</span>
                                <span>Thigh</span>
                                <span>Hip</span>
                                <span>Leg</span>
                                <span className="text-center font-bold text-rose/70">Hapus</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_40px] gap-2 text-[9px] uppercase tracking-wider text-gray-400 font-semibold px-1 min-w-[510px]">
                                <span>Size</span>
                                <span>Chest</span>
                                <span>Length</span>
                                <span>Shoulder</span>
                                <span>Sleeve</span>
                                <span className="text-center font-bold text-rose/70">Hapus</span>
                              </div>
                            )}
                            
                            {productForm.measurements?.map((m, idx) => (
                              <div key={idx} className={cn("grid gap-2 items-center min-w-[510px]", productForm.category === 'celana' ? "grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_40px] min-w-[530px]" : "grid-cols-[1.2fr_1fr_1fr_1fr_1fr_40px]")}>
                                <input
                                  type="text"
                                  placeholder="e.g. S / 32"
                                  value={m.size}
                                  onChange={(e) => {
                                    const newM = [...productForm.measurements];
                                    newM[idx] = { ...newM[idx], size: e.target.value };
                                    setProductForm({ ...productForm, measurements: newM });
                                  }}
                                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60 font-bold bg-gray-50/50"
                                />
                                {productForm.category === 'celana' ? (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Waist"
                                      value={m.waist || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], waist: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Length"
                                      value={m.length || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], length: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Thigh"
                                      value={m.thigh || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], thigh: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Hip"
                                      value={m.hip || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], hip: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Leg"
                                      value={m.leg_opening || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], leg_opening: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Chest"
                                      value={m.chest || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], chest: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Length"
                                      value={m.length || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], length: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Shoulder"
                                      value={m.shoulder || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], shoulder: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Sleeve"
                                      value={m.sleeve || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], sleeve: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/60"
                                    />
                                  </>
                                )}
                                <button
                                  type="button"
                                  title={`Hapus ukuran "${m.size || 'ini'}" dari tabel & varian shop`}
                                  onClick={() => {
                                    const deletedSizeObj = productForm.measurements[idx];
                                    const deletedSizeStr = deletedSizeObj?.size ? deletedSizeObj.size.trim().toUpperCase() : '';
                                    const newM = productForm.measurements.filter((_, i) => i !== idx);
                                    
                                    // Auto-sync: Also remove exact matching size from productForm.variants so it disappears from shop
                                    let newV = productForm.variants || [];
                                    if (deletedSizeStr) {
                                      newV = newV.filter(v => {
                                        if (!v.size) return true;
                                        const vSizeStr = v.size.trim().toUpperCase();
                                        return vSizeStr !== deletedSizeStr && !vSizeStr.startsWith(deletedSizeStr + ' ') && !deletedSizeStr.startsWith(vSizeStr + ' ');
                                      });
                                    }
                                    setProductForm({ ...productForm, measurements: newM, variants: newV });
                                  }}
                                  className="p-1.5 bg-rose/10 hover:bg-rose text-rose hover:text-white border border-rose/30 rounded-lg transition-all duration-200 flex items-center justify-center shadow-2xs group shrink-0 cursor-pointer w-full h-8"
                                >
                                  <Trash2 size={15} className="transition-transform group-hover:scale-110 shrink-0" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mr-1">Quick Add / Remove Row:</span>
                          {productForm.category === 'celana' 
                            ? [['28','76','98','62','100','38'],['30','81','100','64','104','40'],['32','86','102','66','108','42'],['34','91','104','69','113','44'],['36','96','106','72','118','46'],['38','101','108','75','123','48'],['40','106','110','78','128','50'],['ALL SIZE','86','102','66','108','42']].map(([sz, w, l, th, hp, leg]) => {
                                const fullSz = `${sz}${sz === '28' ? ' (S)' : sz === '30' ? ' (M)' : sz === '32' ? ' (L)' : sz === '34' ? ' (XL)' : sz === '36' ? ' (XXL)' : sz === '38' ? ' (3XL)' : sz === '40' ? ' (4XL)' : ''}`;
                                const existsIndex = productForm.measurements?.findIndex(m => m.size === sz || m.size === fullSz || m.size.startsWith(sz));
                                const exists = existsIndex !== undefined && existsIndex >= 0;
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    title={exists ? `Klik untuk HAPUS ukuran ${sz}` : `Klik untuk TAMBAH ukuran ${sz}`}
                                    onClick={() => {
                                      if (exists) {
                                        const newM = productForm.measurements.filter((_, i) => i !== existsIndex);
                                        setProductForm({ ...productForm, measurements: newM });
                                      } else {
                                        setProductForm({ ...productForm, measurements: [...(productForm.measurements || []), { size: fullSz, waist: w, length: l, thigh: th, hip: hp, leg_opening: leg }] });
                                      }
                                    }}
                                    className={cn(
                                      "px-2 py-1 text-[9px] uppercase tracking-wider font-semibold rounded border transition-all shadow-2xs flex items-center gap-1 cursor-pointer",
                                      exists
                                        ? "bg-rose/10 text-rose border-rose/40 font-bold hover:bg-rose hover:text-white"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-rose hover:text-rose hover:bg-rose/5"
                                    )}
                                  >
                                    <span>{exists ? '✓' : '+'}</span>
                                    <span>{sz}</span>
                                    {exists && <span className="text-[8px] opacity-75">✕</span>}
                                  </button>
                                );
                              })
                            : (productForm.category === 'hoodie' || productForm.category === 'outer' || productForm.category === 'jaket')
                              ? [['S','56','66','54','60'],['M','58','68','56','61'],['L','60','70','58','62'],['XL','63','72','60','63'],['XXL','66','74','62','64'],['3XL','69','76','64','65'],['4XL','72','78','66','66'],['5XL','75','80','68','67'],['ALL SIZE','62','71','59','63']].map(([sz, ch, ln, sh, sl]) => {
                                  const existsIndex = productForm.measurements?.findIndex(m => m.size === sz);
                                  const exists = existsIndex !== undefined && existsIndex >= 0;
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      title={exists ? `Klik untuk HAPUS ukuran ${sz}` : `Klik untuk TAMBAH ukuran ${sz}`}
                                      onClick={() => {
                                        if (exists) {
                                          const newM = productForm.measurements.filter((_, i) => i !== existsIndex);
                                          setProductForm({ ...productForm, measurements: newM });
                                        } else {
                                          setProductForm({ ...productForm, measurements: [...(productForm.measurements || []), { size: sz, chest: ch, length: ln, shoulder: sh, sleeve: sl }] });
                                        }
                                      }}
                                      className={cn(
                                        "px-2 py-1 text-[9px] uppercase tracking-wider font-semibold rounded border transition-all shadow-2xs flex items-center gap-1 cursor-pointer",
                                        exists
                                          ? "bg-rose/10 text-rose border-rose/40 font-bold hover:bg-rose hover:text-white"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-rose hover:text-rose hover:bg-rose/5"
                                      )}
                                    >
                                      <span>{exists ? '✓' : '+'}</span>
                                      <span>{sz}</span>
                                      {exists && <span className="text-[8px] opacity-75">✕</span>}
                                    </button>
                                  );
                                })
                              : [['S','52','68','46','22'],['M','54','70','48','23'],['L','56','72','50','24'],['XL','58','74','52','25'],['XXL','61','76','54','26'],['3XL','64','78','56','27'],['4XL','67','80','58','28'],['5XL','70','82','60','29'],['ALL SIZE','58','74','52','25']].map(([sz, ch, ln, sh, sl]) => {
                                  const existsIndex = productForm.measurements?.findIndex(m => m.size === sz);
                                  const exists = existsIndex !== undefined && existsIndex >= 0;
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      title={exists ? `Klik untuk HAPUS ukuran ${sz}` : `Klik untuk TAMBAH ukuran ${sz}`}
                                      onClick={() => {
                                        if (exists) {
                                          const newM = productForm.measurements.filter((_, i) => i !== existsIndex);
                                          setProductForm({ ...productForm, measurements: newM });
                                        } else {
                                          setProductForm({ ...productForm, measurements: [...(productForm.measurements || []), { size: sz, chest: ch, length: ln, shoulder: sh, sleeve: sl }] });
                                        }
                                      }}
                                      className={cn(
                                        "px-2 py-1 text-[9px] uppercase tracking-wider font-semibold rounded border transition-all shadow-2xs flex items-center gap-1 cursor-pointer",
                                        exists
                                          ? "bg-rose/10 text-rose border-rose/40 font-bold hover:bg-rose hover:text-white"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-rose hover:text-rose hover:bg-rose/5"
                                      )}
                                    >
                                      <span>{exists ? '✓' : '+'}</span>
                                      <span>{sz}</span>
                                      {exists && <span className="text-[8px] opacity-75">✕</span>}
                                    </button>
                                  );
                                })
                          }
                        </div>
                      </div>

                      {/* ===== MODEL INFO ===== */}
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Model Info Garment (Optional)</label>
                        <input
                          type="text"
                          value={productForm.model_info || ''}
                          onChange={(e) => setProductForm({ ...productForm, model_info: e.target.value })}
                          placeholder="e.g. Model wearing Size M (175cm / 65kg)"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                        />
                      </div>
                    </div>
                  )}

                  {(isObjects || isFnB) && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-lg space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                            <span>🎯 {isObjects ? 'Object & Consumer Goods' : 'Pantry & Cafe (F&B)'} — Unlimited Upload Gallery</span>
                          </div>
                          <p className="text-[10px] text-emerald-700 leading-relaxed">
                            Kategori ini mendukung upload foto tambahan tak terhingga (Unlimited Upload) untuk galeri produk secara lengkap.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Image URL</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="url"
                            value={productForm.image_url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductForm(prev => ({ 
                                ...prev, 
                                image_url: val,
                                image_alt: prev.image_alt ? prev.image_alt : prev.name ? `${prev.name} - Official Product View` : val ? 'NINOC Official Product View' : ''
                              }));
                            }}
                            placeholder="https://..."
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                          />
                          <input
                            type="text"
                            value={productForm.image_alt || ''}
                            onChange={(e) => setProductForm({ ...productForm, image_alt: e.target.value })}
                            placeholder="Alt text (SEO)"
                            title="Teks Alternatif Gambar untuk SEO (contoh: Kaos Pria Hitam)"
                            className="w-1/3 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                          />
                          <label className="relative flex items-center justify-center px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] uppercase tracking-wider font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap">
                            {isUploadingProductImage ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>Upload File</span>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleProductImageUpload}
                              disabled={isUploadingProductImage}
                            />
                          </label>
                          {productForm.image_url && (
                            <>
                              <button
                                type="button"
                                onClick={() => forceDownloadImage(productForm.image_url, 'main-image.jpg')}
                                className="flex items-center justify-center px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] uppercase tracking-wider font-medium rounded-lg transition-colors whitespace-nowrap"
                                title="Download Gambar"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductForm(prev => {
                                  const newSpecs = (prev.specifications || []).filter(s => !s?.label?.toLowerCase().startsWith('colorimage:'));
                                  return { ...prev, image_url: '', image_alt: '', specifications: newSpecs };
                                })}
                                className="flex items-center justify-center px-2 py-1.5 bg-rose/10 hover:bg-rose/20 text-rose text-[10px] uppercase tracking-wider font-medium rounded-lg transition-colors whitespace-nowrap"
                                title="Hapus URL Gambar"
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Additional Images — for product gallery navigation */}
                      <div className="space-y-3">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500">Additional Images (Gallery)</label>
                        {(['perspective1','perspective2','perspective3','perspective4', 'GlobalP5', 'GlobalP6', 'GlobalP7', 'GlobalP8', 'GlobalP9', 'GlobalP10', 'GlobalP11', 'GlobalP12', 'GlobalP13', 'GlobalP14', 'GlobalP15'] as const).map((field, idx) => {
                          const isGlobalP = field.startsWith('GlobalP');
                          const val = isGlobalP ? productForm.specifications?.find(s => s.label === field)?.value || '' : (productForm as any)[field] || '';
                          return (
                          <div key={field} className="flex flex-col gap-2 w-full bg-gray-50/40 p-2.5 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-500 font-bold w-7 shrink-0 text-right">P{idx + 1}</span>
                              {val ? (
                                <Image src={val} alt={`P${idx + 1}`} width={48} height={48} className="w-12 h-12 object-cover rounded-md shadow-sm border border-gray-200 shrink-0 bg-white" unoptimized />
                              ) : (
                                <div className="w-12 h-12 rounded-md border border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-300 text-[9px] shrink-0 font-medium">
                                  No Foto
                                </div>
                              )}
                              <input
                                type="url"
                                value={val}
                                onChange={(e) => {
                                  if (isGlobalP) {
                                    const newSpecs = [...(productForm.specifications || [])];
                                    const specIdx = newSpecs.findIndex(s => s.label === field);
                                    if (specIdx >= 0) newSpecs[specIdx].value = e.target.value;
                                    else newSpecs.push({ label: field, value: e.target.value });
                                    setProductForm({ ...productForm, specifications: newSpecs });
                                  } else {
                                    setProductForm({ ...productForm, [field]: e.target.value });
                                  }
                                }}
                                placeholder={`https://... (URL Foto P${idx + 1})`}
                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 bg-white font-mono text-ink"
                              />
                              <label className="relative flex items-center justify-center px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] uppercase tracking-wider font-semibold rounded cursor-pointer transition-colors whitespace-nowrap shrink-0">
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setIsUploadingProductImage(true);
                                    try {
                                      const compressedFile = await compressImage(file);
                                      const formData = new FormData();
                                      formData.append('files', compressedFile);
                                      formData.append('bucket', 'products');
                                      const res = await fetch('/api/admin/upload-images', {
                                        method: 'POST',
                                        body: formData
                                      });
                                      const data = await res.json();
                                      if (!res.ok || data.error || !data.results?.[0]?.url) {
                                        throw new Error(data.error || 'Upload failed');
                                      }
                                      if (isGlobalP) {
                                        const newSpecs = [...(productForm.specifications || [])];
                                        const specIdx = newSpecs.findIndex(s => s.label === field);
                                        if (specIdx >= 0) newSpecs[specIdx].value = data.results[0].url;
                                        else newSpecs.push({ label: field, value: data.results[0].url });
                                        setProductForm({ ...productForm, specifications: newSpecs });
                                      } else {
                                        const newUrl = data.results[0].url;
                                        setProductForm(prev => {
                                          const firstColor = prev.variants.find(v => Boolean(v.color))?.color?.split(',')[0].trim();
                                          const newSpecs = [...(prev.specifications || [])];
                                          if (firstColor && prev.variants.filter(v => Boolean(v.color)).map(v => v.color).filter((v, i, a) => a.indexOf(v) === i).length === 1) {
                                             const prefix = field === 'perspective1' ? 'ColorP1' : field === 'perspective2' ? 'ColorP2' : field === 'perspective3' ? 'ColorP3' : 'ColorP4';
                                             const label = `${prefix}:${firstColor}`;
                                             const idx = newSpecs.findIndex(s => s.label?.toLowerCase().startsWith(`${prefix.toLowerCase()}:`));
                                             if (idx >= 0) newSpecs[idx] = { label, value: newUrl };
                                             else newSpecs.push({ label, value: newUrl });
                                          }
                                          return { ...prev, [field]: newUrl, specifications: newSpecs };
                                        });
                                      }
                                    } catch (err) {
                                      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                    } finally {
                                      setIsUploadingProductImage(false);
                                    }
                                  }}
                                  disabled={isUploadingProductImage}
                                />
                              </label>
                              {val && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => forceDownloadImage(val, `${field}-image.jpg`)}
                                    className="flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors shrink-0"
                                    title="Download Gambar"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isGlobalP) {
                                        const newSpecs = [...(productForm.specifications || [])];
                                        const specIdx = newSpecs.findIndex(s => s.label === field);
                                        if (specIdx >= 0) {
                                          newSpecs.splice(specIdx, 1);
                                          setProductForm({ ...productForm, specifications: newSpecs });
                                        }
                                      } else {
                                        setProductForm(prev => {
                                          const firstColor = prev.variants.find(v => Boolean(v.color))?.color?.split(',')[0].trim();
                                          const newSpecs = [...(prev.specifications || [])];
                                          if (firstColor && prev.variants.filter(v => Boolean(v.color)).map(v => v.color).filter((v, i, a) => a.indexOf(v) === i).length === 1) {
                                             const prefix = field === 'perspective1' ? 'ColorP1' : field === 'perspective2' ? 'ColorP2' : field === 'perspective3' ? 'ColorP3' : 'ColorP4';
                                             const idx = newSpecs.findIndex(s => s.label?.toLowerCase().startsWith(`${prefix.toLowerCase()}:`));
                                             if (idx >= 0) newSpecs.splice(idx, 1);
                                          }
                                          return { ...prev, [field]: '', specifications: newSpecs };
                                        });
                                      }
                                    }}
                                    className="flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-400 hover:bg-rose hover:text-white transition-colors shrink-0"
                                    title="Hapus Gambar"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      {/* ===== UNLIMITED EXTRA GALLERY IMAGES (OBJECTS & F&B) ===== */}
                      {(isObjects || isFnB) && (
                        <div className="space-y-3 pt-3 border-t border-emerald-100 mt-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-emerald-800 font-bold">
                                Foto Tambahan Tak Terhingga (Unlimited Gallery & Descriptions)
                              </label>
                              <p className="text-[9px] text-gray-500">
                                Tambahkan foto sebanyak yang diperlukan untuk detail lengkap produk.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentSpecs = [...(productForm.specifications || [])];
                                const existingIndices = currentSpecs
                                  .filter(s => s.label && s.label.startsWith('ExtraImage_'))
                                  .map(s => parseInt(s.label.replace('ExtraImage_', ''), 10) || 0);
                                const nextIdx = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
                                currentSpecs.push({ label: `ExtraImage_${nextIdx}`, value: '' });
                                setProductForm(prev => ({ ...prev, specifications: currentSpecs }));
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                            >
                              + Tambah Foto Tak Terhingga
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(productForm.specifications || [])
                              .filter(s => s.label && s.label.startsWith('ExtraImage_'))
                              .sort((a, b) => {
                                const numA = parseInt(a.label.replace('ExtraImage_', ''), 10) || 0;
                                const numB = parseInt(b.label.replace('ExtraImage_', ''), 10) || 0;
                                return numA - numB;
                              })
                              .map((spec, index) => {
                                const idxNum = spec.label.replace('ExtraImage_', '');
                                const descSpec = productForm.specifications?.find(s => s.label === `ExtraImageDesc_${idxNum}`);
                                return (
                                  <div key={spec.label} className="flex flex-col gap-1.5 w-full bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-200/50">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-bold text-emerald-800 w-14 shrink-0">
                                        Extra #{index + 1}
                                      </span>
                                      <input
                                        type="url"
                                        value={spec.value || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const newSpecs = [...(productForm.specifications || [])];
                                          const idx = newSpecs.findIndex(s => s.label === spec.label);
                                          if (idx >= 0) newSpecs[idx].value = val;
                                          setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                        }}
                                        placeholder="https://... URL Foto Tambahan"
                                        className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-[10px] focus:outline-none focus:border-emerald-500"
                                      />
                                      <label className="relative flex items-center justify-center px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-[9px] uppercase tracking-wider font-medium rounded cursor-pointer transition-colors whitespace-nowrap">
                                        <span>Upload</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setIsUploadingProductImage(true);
                                            try {
                                              const compressedFile = await compressImage(file);
                                              const formData = new FormData();
                                              formData.append('files', compressedFile);
                                              formData.append('bucket', 'products');
                                              const res = await fetch('/api/admin/upload-images', {
                                                method: 'POST',
                                                body: formData
                                              });
                                              const data = await res.json();
                                              if (!res.ok || data.error || !data.results?.[0]?.url) {
                                                throw new Error(data.error || 'Upload failed');
                                              }
                                              const newSpecs = [...(productForm.specifications || [])];
                                              const idx = newSpecs.findIndex(s => s.label === spec.label);
                                              if (idx >= 0) newSpecs[idx].value = data.results[0].url;
                                              setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                            } catch (err) {
                                              alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                            } finally {
                                              setIsUploadingProductImage(false);
                                            }
                                          }}
                                          disabled={isUploadingProductImage}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newSpecs = (productForm.specifications || []).filter(
                                            s => s.label !== spec.label && s.label !== `ExtraImageDesc_${idxNum}`
                                          );
                                          setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                        }}
                                        className="flex items-center justify-center px-2 py-1 bg-rose/10 hover:bg-rose/20 text-rose text-[9px] uppercase tracking-wider font-medium rounded transition-colors whitespace-nowrap"
                                        title="Hapus Foto Ini"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}


                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">Featured Product</h4>
                        <p className="text-xs text-gray-500">Show this product on the home page</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, is_featured: !productForm.is_featured })}
                        className={cn("text-2xl transition-colors", productForm.is_featured ? "text-rose" : "text-gray-300")}
                      >
                        {productForm.is_featured ? (
                          <ToggleRight className="fill-current" />
                        ) : (
                          <ToggleLeft />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">Affiliate Eligible</h4>
                        <p className="text-xs text-gray-500">Allow affiliates to earn commission on this product</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, affiliate_eligible: !productForm.affiliate_eligible })}
                        className={cn("text-2xl transition-colors", productForm.affiliate_eligible ? "text-green-500" : "text-gray-300")}
                      >
                        {productForm.affiliate_eligible ? (
                          <ToggleRight className="fill-current" />
                        ) : (
                          <ToggleLeft />
                        )}
                      </button>
                    </div>
                  </div>

                {/* Variants Grouped by Color */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wide">Variants & Stock</h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (!productForm.name) {
                          showToast('Please enter a product name first before generating SKUs.', 'error');
                          return;
                        }
                        // e.g. Category: celana -> CLN, pakaian -> PKA
                        const catCode = productForm.category === 'celana' ? 'CLN' : productForm.category === 'pakaian' ? 'KAS' : productForm.category.substring(0,3).toUpperCase();
                        // Product Name: "Cargo Pants" -> "CARG", plus 3 random digits -> "CARG842"
                        const baseName = productForm.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
                        // Generate a pseudo-random 3-digit sequence based on the product name so it's consistent for variants of the same product
                        let hash = 0;
                        for (let i = 0; i < productForm.name.length; i++) {
                          hash = productForm.name.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const uniqueNum = Math.abs(hash % 900) + 100; // 100 to 999
                        const nameCode = `${baseName}${uniqueNum}`;
                        
                        const newVariants = productForm.variants.map(v => {
                          const colorCode = (v.color || 'NON').substring(0, 3).toUpperCase();
                          const sizeCode = (v.size || 'OS').toUpperCase();
                          return { ...v, sku: `${catCode}-${nameCode}-${colorCode}-${sizeCode}` };
                        });
                        setProductForm({ ...productForm, variants: newVariants });
                        showToast(`Success: ${newVariants.length} SKUs generated automatically!`, 'success');
                      }}
                      className="px-3 py-1.5 bg-ink text-white text-[9px] uppercase tracking-wider font-medium rounded hover:bg-ink/80 transition-colors"
                    >
                      Auto-Generate SKUs
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      const colorGroups: { color: string, originalIndices: number[] }[] = [];
                      productForm.variants.forEach((v, idx) => {
                        const color = v.color || '';
                        let group = colorGroups.find(g => g.color === color);
                        if (!group) {
                          group = { color, originalIndices: [] };
                          colorGroups.push(group);
                        }
                        group.originalIndices.push(idx);
                      });

                      return (
                        <>
                          {colorGroups.map((group) => (
                            <div key={group.originalIndices[0]} className="bg-gray-50 rounded-xl p-2 space-y-2 border border-gray-100">
                              <div className="flex items-center justify-between pb-3 border-b border-gray-200 flex-wrap gap-3">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{productForm.variant_label ? `${productForm.variant_label}:` : isFnB ? 'Varian / Blend:' : isObjects ? 'Varian Model / Series:' : 'Color / Warna:'}</span>
                                  <input
                                    type="text"
                                    value={group.color}
                                    placeholder="e.g. Black or Series Name"
                                    onChange={(e) => {
                                      const oldColor = group.color;
                                      const newColor = e.target.value;
                                      const newVariants = [...productForm.variants];
                                      group.originalIndices.forEach(idx => {
                                        newVariants[idx] = { ...newVariants[idx], color: newColor };
                                      });

                                      const newSpecs = [...(productForm.specifications || [])];
                                      if (oldColor && oldColor !== newColor) {
                                        newSpecs.forEach((s) => {
                                          if (s && typeof s.label === 'string') {
                                            const parts = s.label.split(':');
                                            if (parts.length >= 2 && parts.slice(1).join(':').trim().toLowerCase() === oldColor.trim().toLowerCase()) {
                                              s.label = `${parts[0]}:${newColor}`;
                                            }
                                          }
                                        });
                                      }

                                      setProductForm({ ...productForm, variants: newVariants, specifications: newSpecs });
                                    }}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 font-medium text-ink w-48"
                                  />
                                </div>
                                <button
                                    onClick={() => {
                                      const newVariants = productForm.variants.filter((_, i) => !group.originalIndices.includes(i));
                                      setProductForm({ ...productForm, variants: newVariants });
                                    }}
                                    className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 font-medium"
                                  >
                                    Remove {productForm.variant_label || (isFnB ? 'Blend' : isObjects ? 'Varian' : 'Color')}
                                  </button>

                                <div className="mt-2 space-y-2">
                                  {(['Image', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15'] as const).map((imgType) => {
                                    const colorSpecLabel = `Color${imgType}:${group.color}`;
                                    const colorDescLabel = `Color${imgType}Desc:${group.color}`;
                                    const colorSpec = productForm.specifications?.find(s =>
                                      s.label && s.label.trim().toLowerCase() === colorSpecLabel.trim().toLowerCase()
                                    );
                                    const descSpec = productForm.specifications?.find(s =>
                                      s.label && s.label.trim().toLowerCase() === colorDescLabel.trim().toLowerCase()
                                    );

                                    const colorImage = colorSpec?.value || '';
                                    const descValue = descSpec?.value || '';
                                    const labelDisplay = imgType === 'Image' ? 'Main Image' : `Gallery ${imgType}`;
                                    
                                    return (
                                      <div key={imgType} className="flex flex-col gap-2 w-full bg-white p-2.5 border border-gray-200 rounded-lg text-xs shadow-sm">
                                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
                                          <span className="text-xs uppercase tracking-wider text-gray-700 font-bold">{labelDisplay}</span>
                                          <div className="flex items-center gap-1.5">
                                            <label className="relative flex items-center justify-center px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] uppercase tracking-wider font-semibold rounded cursor-pointer transition-colors whitespace-nowrap">
                                              <span>Upload File</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  setIsUploadingProductImage(true);
                                                  try {
                                                    const compressedFile = await compressImage(file);
                                                    const formData = new FormData();
                                                    formData.append('files', compressedFile);
                                                    formData.append('bucket', 'products');
                                                    const res = await fetch('/api/admin/upload-images', {
                                                      method: 'POST',
                                                      body: formData
                                                    });
                                                    const data = await res.json();
                                                    if (!res.ok || data.error || !data.results?.[0]?.url) {
                                                      throw new Error(data.error || 'Upload failed');
                                                    }
                                                    
                                                    const newUrl = data.results[0].url;
                                                    const newSpecs = [...(productForm.specifications || [])];
                                                    const specIdx = newSpecs.findIndex(s => 
                                                      s && typeof s.label === 'string' && s.label.trim().toLowerCase() === colorSpecLabel.trim().toLowerCase()
                                                    );
                                                    if (specIdx >= 0) {
                                                      newSpecs[specIdx] = { label: colorSpecLabel, value: newUrl };
                                                    } else {
                                                      newSpecs.push({ label: colorSpecLabel, value: newUrl });
                                                    }
                                                    setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                                  } catch (err) {
                                                    alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                                  } finally {
                                                    setIsUploadingProductImage(false);
                                                  }
                                                }}
                                                disabled={isUploadingProductImage}
                                              />
                                            </label>
                                            {colorImage && (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => forceDownloadImage(colorImage, `variant-${imgType}-image.jpg`)}
                                                  className="px-2 py-1 bg-ink/5 hover:bg-ink/10 text-ink text-[10px] uppercase tracking-wider font-semibold rounded transition-colors whitespace-nowrap flex items-center gap-1"
                                                  title="Download image"
                                                >
                                                  <Download size={12} />
                                                  Download
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newSpecs = (productForm.specifications || []).filter(s => {
                                                      if (!s || typeof s.label !== 'string') return true;
                                                      return s.label.trim().toLowerCase() !== colorSpecLabel.trim().toLowerCase();
                                                    });
                                                    setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                                  }}
                                                  className="px-2 py-1 bg-rose/10 hover:bg-rose/20 text-rose text-[10px] uppercase tracking-wider font-semibold rounded transition-colors whitespace-nowrap"
                                                  title="Hapus foto varian ini (tidak mempengaruhi galeri utama)"
                                                >
                                                  Hapus
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-3 pt-1">
                                          {colorImage ? (
                                            <div className="relative shrink-0">
                                              <Image src={colorImage} alt={`${group.color} ${imgType}`} width={56} height={56} className="w-14 h-14 object-cover rounded-md shadow border border-gray-200 bg-gray-50" unoptimized />
                                            </div>
                                          ) : (
                                            <div className="w-14 h-14 rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] shrink-0 font-medium">
                                              No Foto
                                            </div>
                                          )}
                                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                            <div>
                                              <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">URL Gambar (atau Upload di atas):</label>
                                              <input
                                                type="url"
                                                value={colorImage || ''}
                                                placeholder={`https://... (Link foto ${labelDisplay})`}
                                                onChange={(e) => {
                                                  const newUrl = e.target.value;
                                                  const newSpecs = [...(productForm.specifications || [])];
                                                  const specIdx = newSpecs.findIndex(s => 
                                                    s && typeof s.label === 'string' && (
                                                      s.label.trim().toLowerCase() === colorSpecLabel.trim().toLowerCase() ||
                                                      (colorGroups.length === 1 && s.label.trim().toLowerCase().startsWith(`color${imgType.toLowerCase()}:`))
                                                    )
                                                  );
                                                  if (newUrl.trim() === '') {
                                                    if (specIdx >= 0) newSpecs.splice(specIdx, 1);
                                                  } else if (specIdx >= 0) {
                                                    newSpecs[specIdx] = { label: colorSpecLabel, value: newUrl };
                                                  } else {
                                                    newSpecs.push({ label: colorSpecLabel, value: newUrl });
                                                  }
                                                  const updates: any = { specifications: newSpecs };
                                                  if (colorGroups.length === 1) {
                                                    if (imgType === 'Image') updates.image_url = newUrl;
                                                    else if (imgType === 'P1') updates.perspective1 = newUrl;
                                                    else if (imgType === 'P2') updates.perspective2 = newUrl;
                                                    else if (imgType === 'P3') updates.perspective3 = newUrl;
                                                    else if (imgType === 'P4') updates.perspective4 = newUrl;
                                                  }
                                                  setProductForm(prev => ({ ...prev, ...updates }));
                                                }}
                                                className="w-full px-2 py-1 bg-gray-50/50 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-rose/50 text-ink font-mono"
                                              />
                                            </div>
                                            <div>
                                              <input
                                                type="text"
                                                value={descValue}
                                                placeholder={`Deskripsi khusus foto ${labelDisplay} (Alt Text / SEO)`}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  const newSpecs = [...(productForm.specifications || [])];
                                                  const specIdx = newSpecs.findIndex(s => s.label === colorDescLabel);
                                                  if (val.trim() === '') {
                                                    if (specIdx >= 0) newSpecs.splice(specIdx, 1);
                                                  } else if (specIdx >= 0) {
                                                    newSpecs[specIdx] = { label: colorDescLabel, value: val };
                                                  } else {
                                                    newSpecs.push({ label: colorDescLabel, value: val });
                                                  }
                                                  setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                                }}
                                                className="w-full px-2 py-1 bg-gray-50/50 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-rose/50 text-ink"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Deskripsi Khusus Varian/Series ini */}
                                {(() => {
                                  const descSpecLabel = `ColorDesc:${group.color}`;
                                  const descSpec = productForm.specifications?.find(s => s.label === descSpecLabel);
                                  const descValue = descSpec?.value || '';
                                  return (
                                    <div className="mt-2.5 bg-white p-2.5 border border-gray-200 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                                          Deskripsi / Catatan Khusus {productForm.variant_label || 'Varian/Series'} &ldquo;{group.color}&rdquo; (Opsional)
                                        </label>
                                        <span className="text-[8px] text-gray-400 italic">Muncul saat pembeli memilih varian ini di halaman toko</span>
                                      </div>
                                      <input
                                        type="text"
                                        value={descValue}
                                        placeholder="Contoh: Set 2pcs grafis Primitive api & Stereo skater biru lengkap dengan trucks & wheels..."
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const newSpecs = [...(productForm.specifications || [])];
                                          const specIdx = newSpecs.findIndex(s => s.label === descSpecLabel);
                                          if (val.trim() === '') {
                                            if (specIdx >= 0) newSpecs.splice(specIdx, 1);
                                          } else if (specIdx >= 0) {
                                            newSpecs[specIdx] = { label: descSpecLabel, value: val };
                                          } else {
                                            newSpecs.push({ label: descSpecLabel, value: val });
                                          }
                                          setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 focus:bg-white transition-all text-ink"
                                      />
                                    </div>
                                  );
                                })()}

                              <div className="pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {Array.from(new Set([
                                    ...(isFnB ? ['250G', '500G', '1000G', 'SINGLE PACK', 'BOX OF 6', 'BOX OF 12', '1 LITRE', 'REGULAR'] :
                                        isObjects ? ['REGULAR', 'LARGE', 'SET OF 2', 'SET OF 4', 'SINGLE', 'BUNDLE', 'ONE SIZE'] :
                                        ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'ONE SIZE']),
                                    ...group.originalIndices.map(i => productForm.variants[i].size).filter(Boolean)
                                  ])).map(size => {
                                    const idx = group.originalIndices.find(i => productForm.variants[i].size === size);
                                    const isSelected = idx !== undefined;
                                    return (
                                      <button
                                        key={size}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (isSelected) {
                                            const newVariants = productForm.variants.filter((_, i) => i !== idx);
                                            setProductForm({ ...productForm, variants: newVariants });
                                          } else {
                                            setProductForm({
                                              ...productForm,
                                              variants: [...productForm.variants, { id: '', size: size, color: group.color, stock_quantity: 0 }]
                                            });
                                          }
                                        }}
                                        className={cn(
                                          "px-2 py-1 text-xs font-medium rounded border transition-colors uppercase",
                                          isSelected 
                                            ? "bg-rose border-rose text-white shadow-sm" 
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                        )}
                                      >
                                        {size}
                                      </button>
                                    );
                                  })}
                                  <input
                                    type="text"
                                    placeholder="+ Custom Size (Enter)"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const newSize = e.currentTarget.value.trim();
                                        if (newSize) {
                                          setProductForm({
                                            ...productForm,
                                            variants: [...productForm.variants, { id: '', size: newSize, color: group.color, stock_quantity: 0 }]
                                          });
                                          e.currentTarget.value = '';
                                        }
                                      }
                                    }}
                                    className="px-1.5 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 w-36"
                                  />
                                </div>
                                
                                {group.originalIndices.length > 0 && (
                                  <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 mt-3">
                                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Set Stock Quantities & SKU:</span>
                                      {group.originalIndices.slice().sort((a, b) => {
                                        const SIZE_ORDER = ['250G', '500G', '1000G', 'SINGLE PACK', 'BOX OF 6', 'BOX OF 12', '1 LITRE', 'REGULAR', 'LARGE', 'SET OF 2', 'SET OF 4', 'SINGLE', 'BUNDLE', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'ONE SIZE', '28', '30', '32', '34', '36', '38', '40', '42'];
                                      const sizeA = productForm.variants[a].size || '';
                                      const sizeB = productForm.variants[b].size || '';
                                      const idxA = SIZE_ORDER.indexOf(sizeA.toUpperCase());
                                      const idxB = SIZE_ORDER.indexOf(sizeB.toUpperCase());
                                      if (idxA === -1 && idxB === -1) return sizeA.localeCompare(sizeB);
                                      if (idxA === -1) return 1;
                                      if (idxB === -1) return -1;
                                      return idxA - idxB;
                                    }).map(idx => {
                                      const variant = productForm.variants[idx];
                                      return (
                                        <div key={idx} className="flex items-center justify-between bg-white px-1.5 py-1 border border-gray-200 rounded-lg">
                                            <span className="text-xs font-medium text-gray-700 w-16">Size {variant.size}</span>
                                            <div className="flex-1 flex items-center gap-3 justify-end">
                                               <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                                                 <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">SKU</span>
                                                 <input
                                                   type="text"
                                                   placeholder="Auto/Manual"
                                                   value={variant.sku || ''}
                                                   onChange={(e) => {
                                                     const newVariants = [...productForm.variants];
                                                     newVariants[idx] = { ...newVariants[idx], sku: e.target.value.toUpperCase() };
                                                     setProductForm({ ...productForm, variants: newVariants });
                                                   }}
                                                   className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded font-mono focus:border-rose/50 outline-none placeholder:text-gray-300"
                                                 />
                                               </div>
                                               <div className="w-px h-6 bg-gray-200" />
                                               <div className="flex items-center gap-1.5">
                                                 <span className="text-[10px] text-gray-400 font-medium">QTY</span>
                                                 <input
                                                   type="number"
                                                   min="0"
                                                   value={variant.stock_quantity}
                                                   onChange={(e) => {
                                                     const newVariants = [...productForm.variants];
                                                     newVariants[idx] = { ...newVariants[idx], stock_quantity: parseInt(e.target.value) || 0 };
                                                     setProductForm({ ...productForm, variants: newVariants });
                                                   }}
                                                   className="w-16 px-2 py-1.5 text-xs border border-gray-300 rounded text-center focus:border-rose/50 outline-none font-medium"
                                                 />
                                               </div>
                                            </div>
                                          </div>  );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => {
                              const uniqueSuffix = Date.now().toString().slice(-4);
                              setProductForm({
                                ...productForm,
                                variants: [...productForm.variants, { id: '', size: isFnB ? '250G' : isObjects ? 'REGULAR' : 'New Size', color: isFnB ? `Blend ${uniqueSuffix}` : isObjects ? `Model ${uniqueSuffix}` : `Color ${uniqueSuffix}`, stock_quantity: 0 }]
                              });
                            }}
                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-gray-500 hover:border-rose/50 hover:text-rose transition-colors bg-white font-medium"
                          >
                            <Plus size={14} /> Add New {isFnB ? 'Varian / Blend' : isObjects ? 'Varian Model' : 'Color Variant'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 bg-white px-2 py-1.5 border-t border-gray-100 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProduct}
                  className="px-2 py-1 text-xs bg-rose text-white rounded hover:bg-rose/90 flex items-center gap-2"
                >
                  <Save size={16} />
                  <span className="text-[10px] uppercase tracking-wider">{isEditMode ? 'Update Product' : 'Save Product'}</span>
                </button>
              </div>
            </motion.div>

              {/* OUTSIDE SEO PANEL */}
              <AnimatePresence>
                {isSeoPanelOpen && (
                  <motion.div
                    layout
                    initial={{ width: 0, opacity: 0, x: 20 }}
                    animate={{ width: 480, opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: 20 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    style={{ maxWidth: '100%' }}
                    className="absolute lg:static inset-0 z-[60] lg:z-auto flex flex-col bg-gray-50 rounded-2xl shadow-xl ring-1 ring-ink/5 overflow-hidden flex-shrink-0 lg:ml-2 max-h-[90vh]"
                  >
                     <div className="bg-white px-5 py-4 border-b border-ink/5 flex items-center justify-between z-10 flex-shrink-0">
                       <div className="flex flex-col">
                         <h3 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-2">
                           <Search size={14} className="text-rose" />
                           SEO & Discovery
                         </h3>
                         <p className="text-[10px] text-ink/50 uppercase tracking-wider mt-0.5">Optimize search ranking</p>
                       </div>
                       <button onClick={() => setIsSeoPanelOpen(false)} className="p-2 text-ink/50 hover:text-ink hover:bg-ink/5 rounded-full transition-colors">
                         <PanelRightClose size={16} />
                       </button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 lg:p-3 w-full lg:w-[480px]">
                        <SeoHelper
                          name={productForm.name}
                          slug={productForm.slug}
                          description={productForm.description}
                          category={productForm.category}
                          price={productForm.price}
                          imageUrl={productForm.image_url || ''}
                          seoKeywords={dbCategories.find(c => c.slug === productForm.category)?.seo_keywords}
                          seoTitleTemplate={dbCategories.find(c => c.slug === productForm.category)?.seo_title_template}
                          onApplyTitle={(title) => handleProductNameChange(title)}
                          onApplySlug={(s) => setProductForm(prev => ({ ...prev, slug: s }))}
                          onApplyDescription={(desc) => setProductForm(prev => ({ ...prev, description: desc }))}
                        />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
