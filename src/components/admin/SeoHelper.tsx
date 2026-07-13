'use client';

import React, { useMemo, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Search, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp,
  Sparkles, Globe, Tag, Copy, Check
} from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SeoHelperProps {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string | number;
  imageUrl?: string;
  onApplyTitle: (title: string) => void;
  onApplySlug: (slug: string) => void;
  onApplyDescription: (desc: string) => void;
  seoKeywords?: string[];
  seoTitleTemplate?: string;
}

// ===== SEO KEYWORD DATABASE =====
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  pakaian: [
    'Kaos Oversize', 'T-Shirt Pria', 'Kaos Wanita', 'Graphic Tee',
    'Streetwear', 'Kaos Premium', 'Baju Distro', 'Oversize Tee',
    'Kaos Polos', 'Korean Style', 'Unisex', 'Cotton Combed'
  ],
  utilities: [
    'Topi Pria', 'Cap Premium', 'Utility Cap', 'Snapback',
    'Bucket Hat', 'Beanie', 'Tas Selempang', 'Sling Bag',
    'Totebag', 'Pouch', 'Aksesori Streetwear'
  ],
  aksesoris: [
    'Gelang Pria', 'Kalung Rantai', 'Ring Titanium', 'Bracelet',
    'Pendant Necklace', 'Sticker Pack', 'Pin Badge', 'Keychain',
    'Gantungan Kunci', 'Aksesori Premium'
  ],
  unisex: [
    'Kaos Unisex', 'Oversize Tee', 'Baju Pria Wanita', 'Streetwear Unisex',
    'Kaos Premium', 'Korean Style', 'Cotton Combed 24s', 'Graphic Tee Unisex'
  ],
  'pakaian-unisex': [
    'Kaos Unisex', 'Oversize Tee', 'Baju Pria Wanita', 'Streetwear Unisex',
    'Kaos Premium', 'Korean Style', 'Cotton Combed 24s', 'Graphic Tee Unisex'
  ],
  celana: [
    'Celana Panjang', 'Celana Pendek', 'Celana Cargo', 'Baggy Pants',
    'Cargo Pants', 'Trousers', 'Streetwear Pants', 'Celana Pria',
    'Celana Wanita', 'Celana Distro', 'Parachute Pants', 'Sweatpants', 'Shorts', 'Bawahan'
  ],
  bawahan: [
    'Celana Panjang', 'Celana Pendek', 'Celana Cargo', 'Baggy Pants',
    'Cargo Pants', 'Trousers', 'Streetwear Pants', 'Celana Pria',
    'Celana Wanita', 'Celana Distro', 'Parachute Pants', 'Sweatpants', 'Shorts', 'Bawahan'
  ],
  rok: [
    'Rok Wanita', 'Korean Skirt', 'Cargo Skirt', 'Maxi Skirt',
    'Mini Skirt', 'Pleated Skirt', 'Dress Casual', 'Rok Streetwear',
    'Rok Korean Style', 'A-Line Skirt', 'Bawahan Wanita'
  ],
};

// ===== TITLE TEMPLATES =====
const TITLE_TEMPLATES: Record<string, { label: string; template: (name: string) => string }[]> = {
  pakaian: [
    { label: 'Oversize Tee SEO', template: (n) => `Kaos Oversize Pria & Wanita "${n}" Graphic Tee | NINOC` },
    { label: 'Premium T-Shirt', template: (n) => `${n} — Premium Oversize T-Shirt Original | NINOC Store` },
    { label: 'Streetwear Style', template: (n) => `${n} | Kaos Streetwear Premium Cotton Combed 24s — NINOC` },
    { label: 'Korean Oversize', template: (n) => `Kaos Oversize Korean Style "${n}" Unisex | NINOC Indonesia` },
  ],
  unisex: [
    { label: 'Unisex Oversize', template: (n) => `Kaos Oversize Unisex "${n}" Streetwear Premium | NINOC` },
    { label: 'Unisex Graphic Tee', template: (n) => `${n} — Kaos Pria & Wanita Premium Cotton | NINOC Store` },
    { label: 'Korean Unisex Style', template: (n) => `Baju Oversize Korean Style "${n}" Unisex | NINOC Indonesia` },
  ],
  'pakaian-unisex': [
    { label: 'Unisex Oversize', template: (n) => `Kaos Oversize Unisex "${n}" Streetwear Premium | NINOC` },
    { label: 'Unisex Graphic Tee', template: (n) => `${n} — Kaos Pria & Wanita Premium Cotton | NINOC Store` },
    { label: 'Korean Unisex Style', template: (n) => `Baju Oversize Korean Style "${n}" Unisex | NINOC Indonesia` },
  ],
  celana: [
    { label: 'Cargo / Streetwear Pants', template: (n) => `Celana ${n} Streetwear Cargo Pants Premium | NINOC` },
    { label: 'Korean Baggy Style', template: (n) => `${n} — Celana Baggy Korean Style Original | NINOC Store` },
    { label: 'Premium Trousers', template: (n) => `Celana Panjang "${n}" Premium Quality Trousers | NINOC Indonesia` },
    { label: 'Casual Shorts / Celana Pendek', template: (n) => `Celana Pendek ${n} Casual Shorts Premium | NINOC` },
  ],
  bawahan: [
    { label: 'Cargo / Streetwear Pants', template: (n) => `Celana ${n} Streetwear Cargo Pants Premium | NINOC` },
    { label: 'Korean Baggy Style', template: (n) => `${n} — Celana Baggy Korean Style Original | NINOC Store` },
    { label: 'Premium Trousers', template: (n) => `Celana Panjang "${n}" Premium Quality Trousers | NINOC Indonesia` },
  ],
  rok: [
    { label: 'Korean Style Skirt', template: (n) => `Rok ${n} Korean Style Skirt Premium Wanita | NINOC` },
    { label: 'Streetwear Casual Skirt', template: (n) => `${n} — Rok Casual Streetwear Original | NINOC Store` },
    { label: 'Maxi / Pleated Skirt', template: (n) => `Rok Panjang "${n}" Premium Fashion Skirt | NINOC Indonesia` },
  ],
  utilities: [
    { label: 'Premium Cap', template: (n) => `${n} — Premium Archival Garment | NINOC STORE` },
    { label: 'Utility Accessory', template: (n) => `${n} | Utility Cap Premium Original — NINOC` },
    { label: 'Streetwear Cap', template: (n) => `Topi ${n} Streetwear Premium Unisex | NINOC Store` },
  ],
  aksesoris: [
    { label: 'Premium Accessory', template: (n) => `${n} — Aksesori Premium Original | NINOC Store` },
    { label: 'Streetwear Acc', template: (n) => `${n} | Aksesori Streetwear Premium — NINOC Indonesia` },
  ],
};

// ===== CATEGORY NORMALIZER =====
function normalizeCategoryKey(rawCat?: string | null): string {
  if (!rawCat || typeof rawCat !== 'string') return 'pakaian';
  const clean = rawCat.toLowerCase().trim().replace(/\s+/g, '-');
  if (clean === 'apparel' || clean === 'fashion' || clean === 'garment' || clean === 'clothes' || clean === 'clothing') return 'pakaian';
  if (clean === 'unisex' || clean === 'pakaian-unisex' || clean === 'baju-unisex') return 'unisex';
  if (clean === 'celana' || clean === 'celana-panjang' || clean === 'celana-pendek' || clean === 'celana-cargo' || clean === 'pants' || clean === 'trousers' || clean === 'jeans' || clean === 'shorts' || clean === 'sweatpants' || clean === 'bottoms' || clean === 'bawahan' || clean === 'kulot' || clean === 'cargo') return 'celana';
  if (clean === 'rok' || clean === 'skirt' || clean === 'dress' || clean === 'cargo-skirt' || clean === 'maxi-skirt' || clean === 'mini-skirt') return 'rok';
  if (clean === 'utilities' || clean === 'utility' || clean === 'gear' || clean === 'objects') return 'utilities';
  if (clean === 'aksesoris' || clean === 'accessory' || clean === 'accessories' || clean === 'accesories' || clean === 'acc') return 'aksesoris';
  return clean;
}

// ===== SEO SCORING ENGINE =====
function calculateSeoScore(
  name?: string | null,
  slug?: string | null,
  description?: string | null,
  category?: string | null,
  dynamicKeywords?: string[] | null
) {
  const safeName = (name || '').trim();
  const safeSlug = (slug || '').trim().toLowerCase();
  const safeDesc = (description || '').trim();
  const normCat = normalizeCategoryKey(category);

  const checks: { label: string; passed: boolean; tip: string; weight: number }[] = [];

  // 1. Title Length (50-65 chars ideal for Google)
  const titleLen = safeName.length;
  checks.push({
    label: 'Panjang Judul (50-65 karakter)',
    passed: titleLen >= 40 && titleLen <= 75,
    tip: titleLen < 40
      ? `Judul terlalu pendek (${titleLen}). Tambahkan kata kunci seperti "Kaos Oversize" atau "Premium".`
      : titleLen > 75
        ? `Judul terlalu panjang (${titleLen}). Google memotong di ~65 karakter. Persingkat.`
        : `Panjang ideal (${titleLen} karakter). Google menampilkan penuh.`,
    weight: 20,
  });

  // 2. Title contains keywords (safely filter out empty/invalid strings)
  const validDynamic = Array.isArray(dynamicKeywords)
    ? dynamicKeywords.filter(k => typeof k === 'string' && k.trim().length > 0)
    : [];
  const baseKeywords = validDynamic.length > 0
    ? validDynamic
    : (CATEGORY_KEYWORDS[normCat] || CATEGORY_KEYWORDS['pakaian'] || []);

  const productWords = safeName.split(/\s+/).filter(w => w.length > 3);
  const allKeywords = Array.from(new Set([
    ...baseKeywords,
    ...(category ? [category] : []),
    ...productWords
  ]));

  const titleLower = safeName.toLowerCase();
  const hasKeyword = allKeywords.length > 0 && allKeywords.some(k => titleLower.includes(k.toLowerCase().trim()));
  checks.push({
    label: 'Judul mengandung kata kunci relevan',
    passed: hasKeyword,
    tip: hasKeyword
      ? 'Bagus! Judul sudah mengandung kata kunci relevan.'
      : `Tambahkan kata kunci deskriptif (misal: nama kategori atau bahan).`,
    weight: 20,
  });

  // 3. Title contains brand
  const hasBrand = titleLower.includes('ninoc');
  checks.push({
    label: 'Judul mengandung brand "NINOC"',
    passed: hasBrand,
    tip: hasBrand
      ? 'Brand NINOC terdeteksi di judul.'
      : 'Tambahkan "| NINOC" di akhir judul untuk brand awareness.',
    weight: 10,
  });

  // 4. Slug is clean
  const slugClean = /^[a-z0-9-]+$/.test(safeSlug) && safeSlug.length > 3 && safeSlug.length <= 50;
  checks.push({
    label: 'Slug URL bersih & SEO-friendly',
    passed: slugClean,
    tip: slugClean
      ? `Slug "${safeSlug}" sudah SEO-friendly.`
      : 'Slug harus huruf kecil, angka, dan strip saja. Panjang 4-50 karakter.',
    weight: 15,
  });

  // 5. Description exists & length
  const descLen = safeDesc.length;
  checks.push({
    label: 'Deskripsi produk terisi (min 50 karakter)',
    passed: descLen >= 50,
    tip: descLen < 50
      ? `Deskripsi terlalu pendek (${descLen}). Google membutuhkan minimal 50 karakter untuk meta description.`
      : `Deskripsi terisi (${descLen} karakter). Google menggunakan ini untuk snippet.`,
    weight: 15,
  });

  // 6. Description contains keywords
  const descLower = safeDesc.toLowerCase();
  const descHasKeyword = allKeywords.length > 0 && allKeywords.some(k => descLower.includes(k.toLowerCase().trim()));
  checks.push({
    label: 'Deskripsi mengandung kata kunci',
    passed: descHasKeyword,
    tip: descHasKeyword
      ? 'Deskripsi sudah mengandung kata kunci.'
      : `Sisipkan kata kunci relevan dengan produk/kategori Anda di deskripsi.`,
    weight: 10,
  });

  // 7. Title uses separator
  const hasSeparator = safeName.includes('|') || safeName.includes('—') || safeName.includes('-');
  checks.push({
    label: 'Judul menggunakan pemisah (| atau —)',
    passed: hasSeparator,
    tip: hasSeparator
      ? 'Pemisah terdeteksi. Struktur judul sudah profesional.'
      : 'Gunakan format: "Nama Produk | Brand" untuk tampil profesional di Google.',
    weight: 10,
  });

  const maxScore = checks.reduce((sum, c) => sum + c.weight, 0);
  const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return { checks, score, maxScore, percentage };
}

// ===== MAIN COMPONENT =====
export function SeoHelper({
  name,
  slug,
  description,
  category,
  price,
  imageUrl,
  seoKeywords,
  seoTitleTemplate,
  onApplyTitle,
  onApplySlug,
  onApplyDescription,
}: SeoHelperProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showKeywords, setShowKeywords] = useState(false);
  const [previewTab, setPreviewTab] = useState<'google' | 'social'>('google');
  const [originalTitle, setOriginalTitle] = useState<string | null>(null);
  const [originalDesc, setOriginalDesc] = useState<string | null>(null);

  const safeName = (name || '').trim();
  const safeSlug = (slug || '').trim().toLowerCase();
  const safeDesc = (description || '').trim();
  const normCat = normalizeCategoryKey(category);

  const validDynamicKeywords = useMemo(() => {
    return Array.isArray(seoKeywords)
      ? seoKeywords.filter((k) => typeof k === 'string' && k.trim().length > 0)
      : [];
  }, [seoKeywords]);

  const templates = useMemo(() => {
    if (seoTitleTemplate && typeof seoTitleTemplate === 'string' && seoTitleTemplate.trim().length > 0) {
      const tmpl = seoTitleTemplate.trim();
      return [
        {
          label: 'Template SEO Kategori (DB)',
          template: (n: string) => {
            const cleanN = n || 'Produk';
            if (/\{(name|title|product)\}/i.test(tmpl)) {
              return tmpl.replace(/\{(name|title|product)\}/gi, cleanN);
            }
            return `${tmpl} — ${cleanN}`;
          },
        },
      ];
    }
    return TITLE_TEMPLATES[normCat] || TITLE_TEMPLATES['pakaian'];
  }, [seoTitleTemplate, normCat]);

  const keywords = useMemo(() => {
    return validDynamicKeywords.length > 0
      ? validDynamicKeywords
      : CATEGORY_KEYWORDS[normCat] || CATEGORY_KEYWORDS['pakaian'] || [];
  }, [validDynamicKeywords, normCat]);

  const seo = useMemo(
    () => calculateSeoScore(safeName, safeSlug, safeDesc, normCat, keywords),
    [safeName, safeSlug, safeDesc, normCat, keywords]
  );

  // Extract core product name safely
  const coreName = useMemo(() => {
    const cleaned = safeName
      .replace(/\|.*$/, '')
      .replace(/—.*$/, '')
      .replace(/NINOC/gi, '')
      .replace(/Kaos Oversize Pria & Wanita/gi, '')
      .replace(/Graphic Tee/gi, '')
      .replace(/Premium.*$/gi, '')
      .replace(/[""]/g, '')
      .trim();
    return cleaned || safeName || 'Produk Original';
  }, [safeName]);

  const formattedPrice = useMemo(() => {
    if (price === null || price === undefined || price === '') return '';
    if (typeof price === 'number') {
      return !isNaN(price) && price > 0 ? `IDR ${price.toLocaleString('id-ID')}` : '';
    }
    const cleanStr = String(price).replace(/[^\d.]/g, '');
    const num = parseFloat(cleanStr);
    return !isNaN(num) && num > 0 ? `IDR ${num.toLocaleString('id-ID')}` : '';
  }, [price]);

  // Google preview title (truncated safely)
  const googleTitle = safeName.length > 60 ? safeName.slice(0, 57) + '...' : safeName || 'Product Name — Premium Archival Garment';
  const googleDesc = safeDesc.length > 160 ? safeDesc.slice(0, 157) + '...' : safeDesc || 'Deskripsi produk belum diisi.';
  const googleUrl = `ninoc.store › shop › ${safeSlug || 'product-slug'}`;

  const scoreColor = seo.percentage >= 80 ? 'text-emerald-600' : seo.percentage >= 50 ? 'text-amber-500' : 'text-red-500';
  const scoreBg = seo.percentage >= 80 ? 'bg-emerald-50 border-emerald-200' : seo.percentage >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const scoreBarColor = seo.percentage >= 80 ? 'bg-emerald-500' : seo.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';

  const handleCopyTemplate = (text: string, idx: number) => {
    if (originalTitle === null) setOriginalTitle(safeName);
    onApplyTitle(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleUndoTitle = () => {
    if (originalTitle !== null) {
      onApplyTitle(originalTitle);
      setOriginalTitle(null);
    }
  };

  const generateMetaDescription = () => {
    if (originalDesc === null) setOriginalDesc(safeDesc);
    const catLabel = normCat === 'pakaian' || normCat === 'unisex' ? 'Kaos' : normCat === 'utilities' ? 'Aksesori' : 'Produk';
    const priceText = formattedPrice ? ` ${formattedPrice}.` : '';
    const desc = `Beli ${coreName} dari NINOC — Premium Archival Garment Studio. ${catLabel} premium berkualitas tinggi dengan desain original.${priceText} Pengiriman cepat ke seluruh Indonesia. ✓ Original ✓ Premium Quality ✓ COD Available`;
    onApplyDescription(desc);
  };

  const handleUndoDesc = () => {
    if (originalDesc !== null) {
      onApplyDescription(originalDesc);
      setOriginalDesc(null);
    }
  };

  return (
    <div className="border border-indigo-200 rounded-lg overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">SEO Helper</span>
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", scoreBg, scoreColor)}>
            {seo.percentage}%
          </span>
        </div>
        {isExpanded ? <ChevronUp size={16} className="text-indigo-400" /> : <ChevronDown size={16} className="text-indigo-400" />}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">

          {/* ===== LIVE PREVIEW TABS ===== */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Globe size={12} className="text-indigo-500" />
              <span className="text-xs md:text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Live Preview</span>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
              <button 
                type="button"
                onClick={() => setPreviewTab('google')}
                className={cn("flex-1 text-xs md:text-[10px] py-1.5 rounded-md font-medium transition-colors cursor-pointer", previewTab === 'google' ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-700")}
              >
                Google
              </button>
              <button 
                type="button"
                onClick={() => setPreviewTab('social')}
                className={cn("flex-1 text-xs md:text-[10px] py-1.5 rounded-md font-medium transition-colors cursor-pointer", previewTab === 'social' ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-700")}
              >
                WhatsApp / Social
              </button>
            </div>

            {previewTab === 'google' ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] md:text-[8px] font-bold text-indigo-600">N</div>
                  <div>
                    <p className="text-xs md:text-[10px] text-gray-500">{googleUrl}</p>
                  </div>
                </div>
                <h3 className="text-base text-blue-700 hover:underline cursor-default leading-snug font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {googleTitle}
                </h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {googleDesc}
                </p>
              </div>
            ) : (
              <div className="bg-[#EFEFEF] rounded-lg border border-gray-200 p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200 flex justify-center">
                <div className="w-full max-w-[280px] bg-white rounded-xl rounded-tl-sm overflow-hidden shadow-sm border border-gray-100">
                  <div className="h-[140px] bg-gray-100 relative">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="OG Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Tag size={24} className="mb-2 opacity-20" />
                        <span className="text-xs md:text-[10px]">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[#F0F2F5]">
                    <h3 className="font-semibold text-[13px] text-gray-900 line-clamp-1 leading-snug">{googleTitle}</h3>
                    <p className="text-sm md:text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">{googleDesc}</p>
                    <p className="text-xs md:text-[9px] text-gray-400 mt-1.5 uppercase font-medium">NINOC.STORE</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== SEO SCORE ===== */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Search size={12} className="text-indigo-500" />
              <span className="text-xs md:text-[10px] font-semibold uppercase tracking-wider text-indigo-600">SEO Score</span>
            </div>

            {/* Score Bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", scoreBarColor)}
                  style={{ width: `${seo.percentage}%` }}
                />
              </div>
              <span className={cn("text-sm font-bold", scoreColor)}>{seo.percentage}/100</span>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              {seo.checks.map((check, idx) => (
                <div key={idx} className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-md text-sm md:text-[11px] border",
                  check.passed ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                )}>
                  {check.passed ? (
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={cn("font-medium", check.passed ? "text-emerald-700" : "text-red-700")}>
                      {check.label}
                    </p>
                    <p className="text-gray-500 mt-0.5">{check.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== TITLE GENERATOR ===== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Tag size={12} className="text-indigo-500" />
                <span className="text-xs md:text-[10px] font-semibold uppercase tracking-wider text-indigo-600">SEO Title Generator</span>
              </div>
              {originalTitle !== null && (
                <button 
                  type="button"
                  onClick={handleUndoTitle}
                  className="text-xs md:text-[9px] text-rose font-bold hover:underline transition-all bg-rose/10 px-2 py-0.5 rounded cursor-pointer"
                >
                  Undo (Kembalikan Manual)
                </button>
              )}
            </div>
            <p className="text-xs md:text-[10px] text-gray-400 mb-2 italic">Klik untuk langsung menerapkan template ke Product Name</p>
            <div className="space-y-1.5">
              {templates.map((t, idx) => {
                const generated = t.template(coreName);
                const charCount = generated.length;
                const isGoodLength = charCount >= 40 && charCount <= 75;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCopyTemplate(generated, idx)}
                    className="w-full text-left px-3 py-2.5 rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs md:text-[9px] uppercase tracking-wider font-semibold text-indigo-500">{t.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs md:text-[9px]", isGoodLength ? "text-emerald-500" : "text-amber-500")}>
                          {charCount} chars
                        </span>
                        {copiedIdx === idx ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} className="text-gray-300 group-hover:text-indigo-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm md:text-[11px] text-gray-700 leading-relaxed">{generated}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== AUTO META DESCRIPTION ===== */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs md:text-[10px] text-gray-400 italic">Generate berdasarkan produk</p>
              {originalDesc !== null && (
                <button 
                  type="button"
                  onClick={handleUndoDesc}
                  className="text-xs md:text-[9px] text-rose font-bold hover:underline transition-all bg-rose/10 px-2 py-0.5 rounded cursor-pointer"
                >
                  Undo (Kembalikan Manual)
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={generateMetaDescription}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs md:text-[10px] uppercase tracking-wider font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles size={12} />
              Generate Meta Description Otomatis
            </button>
          </div>

          {/* ===== KEYWORD SUGGESTIONS ===== */}
          <div>
            <button
              type="button"
              onClick={() => setShowKeywords(!showKeywords)}
              className="flex items-center gap-1.5 text-xs md:text-[10px] font-semibold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              <AlertCircle size={12} />
              {showKeywords ? 'Sembunyikan' : 'Tampilkan'} Kata Kunci Populer ({normCat})
            </button>
            {showKeywords && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords.map((kw) => {
                  const isMatch = (safeName + ' ' + safeDesc).toLowerCase().includes(kw.toLowerCase().trim());
                  return (
                    <span
                      key={kw}
                      className={cn(
                        "px-2 py-1 text-xs md:text-[9px] rounded-full border transition-all",
                        isMatch
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium"
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      )}
                    >
                      {isMatch && '✓ '}{kw}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
