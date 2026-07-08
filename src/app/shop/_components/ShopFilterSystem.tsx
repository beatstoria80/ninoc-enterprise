"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Check, Sparkles, Tag, DollarSign, Ruler, ChevronDown, Layers, Filter, Minus, RotateCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getProductViews } from '@/lib/utils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  price_tag?: string | null;
  badge_text?: string | null;
  variants?: Array<{
    id?: string;
    size?: string;
    color?: string;
    stock?: number;
  }>;
}

export function matchesCategoryPillar(productCategory: string, pillar: string): boolean {
  if (pillar === 'All') return true;
  if (!productCategory) return false;
  const cat = productCategory.toLowerCase().trim();
  if (pillar === 'Apparel') {
    return ['pakaian', 'apparel', 'fashion', 'garment', 'footwear', 'archive', 'shirts', 'outerwear', 'bottoms', 'accessories', 'tops', 'jacket', 'coat', 'pants', 'shoes', 'baju', 'celana', 'sepatu', 'topi', 'unisex', 'rok', 'skirt', 'dress', 'bawahan', 'jeans', 'trousers', 'shorts', 'cargo', 'kulot'].some(k => cat.includes(k));
  }
  if (pillar === 'Objects') {
    return ['utilities', 'home', 'kitchen', 'ceramics', 'collectibles', 'objects', 'goods', 'homeware', 'lifestyle', 'keramik', 'piring', 'gelas', 'botol', 'alat', 'rumah'].some(k => cat.includes(k));
  }
  if (pillar === 'Pantry') {
    return ['coffee', 'pastry', 'rtd', 'snack', 'beverage', 'pantry', 'cafe', 'roastery', 'food', 'drinks', 'kopi', 'kue', 'makanan', 'minuman', 'beans', 'roast'].some(k => cat.includes(k));
  }
  return cat === pillar.toLowerCase();
}

export function getCategoryDisplayName(cat: string): string {
  if (cat === 'Objects') return 'Home & Living';
  if (cat === 'Pantry') return 'Pantry & Café';
  if (cat === 'All') return 'All';
  return cat;
}

export function getSubCategory(product: ShopProduct, pillar: string): string {
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const combined = `${cat} ${name} ${desc}`;

  if (pillar === 'Apparel' || pillar === 'All') {
    if (['kaos', 't-shirt', 'tee', 'shirt', 'top', 'tshirt'].some(k => combined.includes(k))) return 'T-Shirt / Kaos';
    if (['hoodie', 'outer', 'jacket', 'jaket', 'sweater', 'coat', 'cardigan', 'crewneck'].some(k => combined.includes(k))) return 'Outerwear / Hoodie';
    if (['celana', 'pants', 'jeans', 'trouser', 'trousers', 'shorts', 'bottom', 'bottoms', 'cargo', 'chores', 'rok', 'skirt', 'dress', 'bawahan', 'kulot'].some(k => combined.includes(k))) return 'Bottoms / Celana & Rok';
    if (['topi', 'cap', 'beanie', 'totebag', 'bag', 'tas', 'gelang', 'aksesoris', 'accessory'].some(k => combined.includes(k))) return 'Accessories';
  }
  if (pillar === 'Objects') {
    if (['keramik', 'ceramic', 'piring', 'gelas', 'mug', 'cup'].some(k => combined.includes(k))) return 'Ceramics / Tableware';
    if (['home', 'living', 'decor', 'dekorasi'].some(k => combined.includes(k))) return 'Homeware & Decor';
    return 'Utilities';
  }
  if (pillar === 'Pantry') {
    if (['kopi', 'coffee', 'beans', 'roast', 'arabica', 'robusta'].some(k => combined.includes(k))) return 'Coffee Beans / Roast';
    return 'Snack & RTD';
  }
  return 'Other';
}

export function matchesSize(product: ShopProduct, selectedSize: string): boolean {
  if (!selectedSize || selectedSize === 'All') return true;
  if (!product.variants || product.variants.length === 0) return false;
  return product.variants.some(v => {
    const vs = (v.size || '').toUpperCase().trim();
    if (selectedSize === 'XXL') return vs === 'XXL' || vs === '2XL';
    if (selectedSize === '3XL') return vs === 'XXXL' || vs === '3XL';
    if (selectedSize === 'All Size') return vs === 'OS' || vs === 'ALL SIZE' || vs === 'ALL' || vs === 'FREESIZE';
    return vs === selectedSize;
  });
}

export function useShopFilters(initialProducts: ShopProduct[], initialCategory: string = 'All') {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const handleSetCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSubCategory('All');
    if (cat === 'Objects' || cat === 'Pantry') {
      setSelectedSize('All');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSubCategory('All');
    setSelectedSize('All');
    setPriceRange('all');
    setSortBy('newest');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (subCategory !== 'All') count++;
    if (selectedSize !== 'All') count++;
    if (priceRange !== 'all') count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [searchQuery, subCategory, selectedSize, priceRange, sortBy]);

  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter(p => matchesCategoryPillar(p.category, selectedCategory))
      .filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.slug && p.slug.toLowerCase().includes(q))
        );
      })
      .filter(p => {
        if (subCategory === 'All') return true;
        return getSubCategory(p, selectedCategory) === subCategory;
      })
      .filter(p => {
        if (selectedSize === 'All') return true;
        return matchesSize(p, selectedSize);
      })
      .filter(p => {
        if (priceRange === 'all') return true;
        const pr = p.price || 0;
        if (priceRange === 'under_150') return pr < 150000;
        if (priceRange === '150_300') return pr >= 150000 && pr <= 300000;
        if (priceRange === 'above_300') return pr > 300000;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cheapest') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'most_expensive') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'popular') return getProductViews(b) - getProductViews(a);
        return 0;
      });
  }, [initialProducts, selectedCategory, searchQuery, subCategory, selectedSize, priceRange, sortBy]);

  const availableSubCategories = useMemo(() => {
    const pillarProducts = initialProducts.filter(p => matchesCategoryPillar(p.category, selectedCategory));
    const subs = new Set<string>();
    pillarProducts.forEach(p => {
      const sub = getSubCategory(p, selectedCategory);
      if (sub && sub !== 'Other') subs.add(sub);
    });
    return ['All', ...Array.from(subs)];
  }, [initialProducts, selectedCategory]);

  return {
    selectedCategory,
    setSelectedCategory: handleSetCategory,
    searchQuery,
    setSearchQuery,
    subCategory,
    setSubCategory,
    selectedSize,
    setSelectedSize,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    isFilterOpen,
    setIsFilterOpen,
    resetFilters,
    activeFilterCount,
    filteredProducts,
    availableSubCategories,
  };
}

export type FilterSystemType = ReturnType<typeof useShopFilters>;

const SIZES = ['All', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'All Size'];

const PRICE_RANGES = [
  { id: 'all', label: 'Semua Harga' },
  { id: 'under_150', label: '< Rp 150.000' },
  { id: '150_300', label: 'Rp 150.000 - Rp 300.000' },
  { id: 'above_300', label: '> Rp 300.000' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Terbaru & Eksklusif' },
  { id: 'cheapest', label: 'Harga: Terendah ke Tertinggi' },
  { id: 'most_expensive', label: 'Harga: Tertinggi ke Terendah' },
  { id: 'popular', label: 'Terpopuler & Banyak Dilihat' },
];

function ActiveFilterTags({ filterSystem }: { filterSystem: FilterSystemType }) {
  const {
    searchQuery, setSearchQuery,
    subCategory, setSubCategory,
    selectedSize, setSelectedSize,
    priceRange, setPriceRange,
    sortBy, setSortBy,
    activeFilterCount
  } = filterSystem;

  if (activeFilterCount === 0) return null;

  return (
    <div className="flex items-center flex-wrap gap-2 pt-3 border-t border-ink/5 mt-3 animate-fadeIn">
      <span className="text-[9px] font-mono uppercase tracking-widest text-ink/40 mr-1 flex items-center gap-1">
        <Tag size={10} className="text-rose" /> Filter Aktif:
      </span>

      {searchQuery.trim() !== '' && (
        <span className="inline-flex items-center gap-1.5 bg-ink text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full shadow-sm">
          <span>&ldquo;{searchQuery}&rdquo;</span>
          <button onClick={() => setSearchQuery('')} className="hover:text-rose transition-colors">
            <X size={10} />
          </button>
        </span>
      )}

      {subCategory !== 'All' && (
        <span className="inline-flex items-center gap-1.5 bg-ink text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full shadow-sm">
          <span>Model: {subCategory}</span>
          <button onClick={() => setSubCategory('All')} className="hover:text-rose transition-colors">
            <X size={10} />
          </button>
        </span>
      )}

      {selectedSize !== 'All' && (
        <span className="inline-flex items-center gap-1.5 bg-ink text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full shadow-sm">
          <span>Size: {selectedSize}</span>
          <button onClick={() => setSelectedSize('All')} className="hover:text-rose transition-colors">
            <X size={10} />
          </button>
        </span>
      )}

      {priceRange !== 'all' && (
        <span className="inline-flex items-center gap-1.5 bg-ink text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full shadow-sm">
          <span>Harga: {PRICE_RANGES.find(p => p.id === priceRange)?.label}</span>
          <button onClick={() => setPriceRange('all')} className="hover:text-rose transition-colors">
            <X size={10} />
          </button>
        </span>
      )}

      {sortBy !== 'newest' && (
        <span className="inline-flex items-center gap-1.5 bg-ink text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full shadow-sm">
          <span>Urutkan: {SORT_OPTIONS.find(s => s.id === sortBy)?.label}</span>
          <button onClick={() => setSortBy('newest')} className="hover:text-rose transition-colors">
            <X size={10} />
          </button>
        </span>
      )}
    </div>
  );
}

export function DesktopShopFilterBar({ filterSystem }: { filterSystem: FilterSystemType }) {
  const displayCategories = ['All', 'Apparel', 'Objects', 'Pantry'];
  const {
    selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery,
    subCategory, setSubCategory,
    selectedSize, setSelectedSize,
    priceRange, setPriceRange,
    sortBy, setSortBy,
    isFilterOpen, setIsFilterOpen,
    resetFilters,
    activeFilterCount,
    availableSubCategories,
    filteredProducts
  } = filterSystem;

  const showSizeFilter = selectedCategory === 'Apparel' || selectedCategory === 'All';

  return (
    <section 
      className={cn(
        "sticky z-[200] border-b border-ink/10 transition-all duration-500 ease-in-out",
        isFilterOpen 
          ? "top-0 shadow-2xl bg-white/100 py-1" 
          : "top-[68px] md:top-[76px] shadow-sm bg-white/95 backdrop-blur-md"
      )}
    >
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-3 relative">
        {/* Main Toolbar Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left: Category Pillars */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {displayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-display font-medium uppercase tracking-widest transition-all whitespace-nowrap",
                  selectedCategory === cat
                    ? "bg-ink text-white shadow-lg shadow-ink/15 scale-[1.02]"
                    : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                )}
              >
                {getCategoryDisplayName(cat)}
              </button>
            ))}
          </div>

          {/* Right: Search & Filter Trigger */}
          <div className="flex items-center gap-2.5">
            {/* Search Box */}
            <div className="relative flex-grow lg:flex-grow-0 lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk, model, atau kode..."
                className="w-full pl-9 pr-8 py-2 bg-ink/[0.03] border border-ink/10 rounded-full text-xs font-mono placeholder:text-ink/30 focus:outline-none focus:border-ink/30 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-rose transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap",
                isFilterOpen || activeFilterCount > 0
                  ? "bg-ink text-white border-ink shadow-md"
                  : "bg-white text-ink border-ink/15 hover:border-ink hover:bg-ink/[0.02]"
              )}
            >
              <SlidersHorizontal size={14} className={activeFilterCount > 0 ? "text-rose" : ""} />
              <span>Filter & Urutkan</span>
              {activeFilterCount > 0 && (
                <span className="bg-rose text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-none min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Tags displayed directly in the sticky header */}
        <ActiveFilterTags filterSystem={filterSystem} />

        {/* Expandable Filter Studio Drawer (Absolute Positioning keeps Product Cards from being pushed down) */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="absolute top-full left-0 right-0 w-full bg-white border-b border-ink/15 shadow-2xl z-[250] overflow-hidden"
            >
              <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-3.5 space-y-3">
                {/* Drawer Header with TWO DISTINCT ICON BUTTONS */}
                <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-ink/70 flex items-center gap-2">
                    <Filter size={13} className="text-rose" />
                    <span>Filter Aktif (<strong className="text-ink font-bold">{activeFilterCount}</strong>) — Menampilkan <strong className="text-ink font-bold">{filteredProducts.length}</strong> Produk</span>
                  </div>

                  {/* NAVIGASI BERBEDA PERAN (ICON SAJA TANPA TEKS) */}
                  <div className="flex items-center gap-2">
                    {/* 1. HIDE / MINIMALISIR: Tutup panel, filter TETAP AKTIF di header */}
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      title="Minimalisir / Sembunyikan Panel (Filter Tetap Aktif)"
                      className="w-7 h-7 rounded-full bg-ink/5 hover:bg-ink hover:text-white text-ink flex items-center justify-center transition-all duration-300 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Minus size={14} />
                    </button>

                    {/* 2. CLOSE & RESET: Tutup panel DAN RESET semua filter ke default */}
                    <button
                      onClick={() => {
                        resetFilters();
                        setIsFilterOpen(false);
                      }}
                      title="Tutup & Reset Semua Filter ke Default"
                      className="w-7 h-7 rounded-full bg-rose/10 hover:bg-rose hover:text-white text-rose flex items-center justify-center transition-all duration-300 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Compact Grid Without Wasted Whitespace */}
                <div className={cn(
                  "grid gap-4 pt-1 pb-1",
                  showSizeFilter ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
                )}>
                
                {/* Kolom 1: Sub Kategori */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-ink/80 flex items-center gap-1.5">
                    <Layers size={11} className="text-rose" /> Kategori & Model
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {availableSubCategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSubCategory(sub)}
                        className={cn(
                          "px-2.5 py-1 rounded-xs text-[10px] font-mono uppercase tracking-wider transition-all",
                          subCategory === sub
                            ? "bg-ink text-white font-semibold"
                            : "bg-ink/[0.03] text-ink/70 hover:bg-ink/10 hover:text-ink"
                        )}
                      >
                        {sub === 'All' ? 'Semua Model' : sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kolom 2: Ukuran (Khusus Apparel) */}
                {showSizeFilter && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-ink/80 flex items-center gap-1.5">
                      <Ruler size={11} className="text-rose" /> Ukuran Pakaian (Size)
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {SIZES.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={cn(
                            "px-2.5 py-1 rounded-xs text-[10px] font-mono uppercase tracking-wider transition-all min-w-[32px] text-center",
                            selectedSize === sz
                              ? "bg-ink text-white font-semibold shadow-2xs"
                              : "bg-ink/[0.03] text-ink/70 hover:bg-ink/10 hover:text-ink"
                          )}
                        >
                          {sz === 'All' ? 'Semua' : sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kolom 3: Rentang Harga (Horizontal Pills Compact!) */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-ink/80 flex items-center gap-1.5">
                    <DollarSign size={11} className="text-rose" /> Rentang Harga
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {PRICE_RANGES.map((pr) => (
                      <button
                        key={pr.id}
                        onClick={() => setPriceRange(pr.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-xs text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1",
                          priceRange === pr.id
                            ? "bg-ink text-white font-semibold"
                            : "bg-ink/[0.03] text-ink/70 hover:bg-ink/10 hover:text-ink"
                        )}
                      >
                        <span>{pr.label}</span>
                        {priceRange === pr.id && <Check size={10} className="text-rose shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kolom 4: Urutkan Produk (Horizontal Pills Compact!) */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-ink/80 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-rose" /> Urutkan Produk
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {SORT_OPTIONS.map((so) => (
                      <button
                        key={so.id}
                        onClick={() => setSortBy(so.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-xs text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1",
                          sortBy === so.id
                            ? "bg-ink text-white font-semibold"
                            : "bg-ink/[0.03] text-ink/70 hover:bg-ink/10 hover:text-ink"
                        )}
                      >
                        <span>{so.label}</span>
                        {sortBy === so.id && <Check size={10} className="text-rose shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function MobileShopFilterBar({ filterSystem }: { filterSystem: FilterSystemType }) {
  const displayCategories = ['All', 'Apparel', 'Objects', 'Pantry'];
  const {
    selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery,
    subCategory, setSubCategory,
    selectedSize, setSelectedSize,
    priceRange, setPriceRange,
    sortBy, setSortBy,
    isFilterOpen, setIsFilterOpen,
    activeFilterCount,
    availableSubCategories,
    filteredProducts,
    resetFilters
  } = filterSystem;

  const showSizeFilter = selectedCategory === 'Apparel' || selectedCategory === 'All';

  return (
    <>
      {/* Sticky Mobile Header (Elevates to top-0 when filter is open) */}
      <div 
        className={cn(
          "sticky left-0 right-0 border-b border-ink/10 transition-all duration-500 ease-in-out",
          isFilterOpen 
            ? "z-[550] bg-white shadow-2xl" 
            : "z-[350] bg-white/95 backdrop-blur-md shadow-sm"
        )}
        style={{ top: isFilterOpen ? '0px' : 'calc(56px + env(safe-area-inset-top))' }}
      >
        <div className="flex flex-col gap-2 px-3 pt-1 pb-2.5">
          {/* Row 1: Category Pillars */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {displayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] font-display font-medium uppercase tracking-wider whitespace-nowrap transition-all",
                  selectedCategory === cat
                    ? "bg-ink text-white shadow-sm"
                    : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                )}
              >
                {getCategoryDisplayName(cat)}
              </button>
            ))}
          </div>

          {/* Row 2: Search & Filter Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk apparel/kode..."
                className="w-full pl-8 pr-7 py-1.5 bg-ink/[0.04] border border-ink/10 rounded-full text-xs font-mono placeholder:text-ink/40 focus:outline-none focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-rose"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all shrink-0",
                activeFilterCount > 0
                  ? "bg-ink text-white font-semibold"
                  : "bg-white text-ink border border-ink/20"
              )}
            >
              <SlidersHorizontal size={13} className={activeFilterCount > 0 ? "text-rose" : ""} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="bg-rose text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Tags displayed directly in the sticky mobile header */}
          <ActiveFilterTags filterSystem={filterSystem} />
        </div>
      </div>

      {/* Bottom Sheet Modal for Mobile Filters */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[500] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-xs"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Sheet Header with TWO DISTINCT ICON BUTTONS */}
              <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-1.5">
                  <Filter size={14} className="text-rose" />
                  <h3 className="text-xs font-display font-bold uppercase tracking-widest text-ink">
                    Filter ({activeFilterCount}) · <span className="text-ink/60">{filteredProducts.length} Produk</span>
                  </h3>
                </div>

                {/* NAVIGASI BERBEDA PERAN (ICON SAJA TANPA TEKS) */}
                <div className="flex items-center gap-2">
                  {/* 1. HIDE / MINIMALISIR: Tutup sheet, filter TETAP AKTIF di header */}
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    title="Minimalisir / Sembunyikan (Filter Tetap Aktif)"
                    className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink hover:text-white text-ink flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <Minus size={16} />
                  </button>

                  {/* 2. CLOSE & RESET: Tutup sheet DAN RESET semua filter */}
                  <button
                    onClick={() => {
                      resetFilters();
                      setIsFilterOpen(false);
                    }}
                    title="Tutup & Reset Semua Filter ke Default"
                    className="w-8 h-8 rounded-full bg-rose/10 hover:bg-rose hover:text-white text-rose flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Sheet Scrollable Body - Minimalist & Compact */}
              <div className="p-4 space-y-6 overflow-y-auto flex-grow">
                {/* Section 1: Sub Kategori */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-display font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                    <Layers size={14} className="text-rose" /> Model / Kategori
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableSubCategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSubCategory(sub)}
                        className={cn(
                          "px-3.5 py-2 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all border",
                          subCategory === sub
                            ? "bg-ink text-white border-ink font-semibold shadow-md scale-[1.02]"
                            : "bg-white text-ink/70 border-ink/15 hover:bg-ink/5 hover:text-ink hover:border-ink/30"
                        )}
                      >
                        {sub === 'All' ? 'Semua Model' : sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2: Ukuran (Apparel Only) */}
                {showSizeFilter && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-display font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                      <Ruler size={14} className="text-rose" /> Ukuran Pakaian (Size)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {SIZES.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={cn(
                            "py-2 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all text-center border",
                            selectedSize === sz
                              ? "bg-ink text-white border-ink font-semibold shadow-md scale-[1.02]"
                              : "bg-white text-ink/70 border-ink/15 hover:bg-ink/5 hover:text-ink hover:border-ink/30"
                          )}
                        >
                          {sz === 'All' ? 'Semua' : sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Rentang Harga */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-display font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                    <DollarSign size={14} className="text-rose" /> Rentang Harga
                  </h4>
                  <div className="flex flex-col gap-2">
                    {PRICE_RANGES.map((pr) => (
                      <button
                        key={pr.id}
                        onClick={() => setPriceRange(pr.id)}
                        className={cn(
                          "px-4 py-2.5 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all flex items-center justify-between border w-full text-left",
                          priceRange === pr.id
                            ? "bg-ink text-white border-ink font-semibold shadow-md"
                            : "bg-white text-ink/70 border-ink/15 hover:bg-ink/5 hover:text-ink hover:border-ink/30"
                        )}
                      >
                        <span>{pr.label}</span>
                        {priceRange === pr.id && <Check size={14} className="text-rose shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 4: Urutkan */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-display font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                    <Sparkles size={14} className="text-rose" /> Urutkan Produk
                  </h4>
                  <div className="flex flex-col gap-2">
                    {SORT_OPTIONS.map((so) => (
                      <button
                        key={so.id}
                        onClick={() => setSortBy(so.id)}
                        className={cn(
                          "px-4 py-2.5 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all flex items-center justify-between border w-full text-left",
                          sortBy === so.id
                            ? "bg-ink text-white border-ink font-semibold shadow-md"
                            : "bg-white text-ink/70 border-ink/15 hover:bg-ink/5 hover:text-ink hover:border-ink/30"
                        )}
                      >
                        <span>{so.label}</span>
                        {sortBy === so.id && <Check size={14} className="text-rose shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sheet Sticky Footer dengan Tombol Standar UI */}
              <div className="px-4 py-3 border-t border-ink/10 bg-white flex items-center justify-between sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button
                  onClick={() => {
                    resetFilters();
                    setIsFilterOpen(false);
                  }}
                  className="px-2 py-2 text-[11px] font-mono uppercase tracking-widest text-ink/60 hover:text-rose transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="px-6 py-2.5 bg-ink text-white rounded-md text-[11px] font-mono uppercase tracking-widest font-semibold shadow-md active:scale-95 transition-all"
                >
                  Tampilkan ({filteredProducts.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
