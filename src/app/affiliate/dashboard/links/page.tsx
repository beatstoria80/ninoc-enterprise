"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, Copy, Plus, CheckCircle, ExternalLink, Scissors } from 'lucide-react';

export default function LinksPage() {
  const [urlInput, setUrlInput] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    
    // Mock logic: simply append ?ref=johndoe
    const base = urlInput.includes('?') ? '&' : '?';
    setGeneratedLink(`${urlInput}${base}ref=johndoe`);
    setIsCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-medium italic uppercase tracking-tighter text-ink">
          Link <span className="text-rose">Generator</span>
        </h1>
        <p className="text-xs md:text-sm text-ink/60 mt-1">Ubah tautan produk apapun menjadi tautan komisi milik Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: GENERATOR */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-ink/5 shadow-sm p-6 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-ink/5 pb-4">
              <div className="p-2 bg-ink/5 rounded-lg text-ink">
                <Scissors size={18} />
              </div>
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Buat Tracking Link Baru</h2>
                <p className="text-xs text-ink/40 mt-0.5">Tempel tautan produk atau kategori dari website NINOC.</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-ink/60 block mb-2">Tautan Target (Target URL)</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input 
                    type="url" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://ninoc.com/shop/..." 
                    required
                    className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-3 px-10 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" 
                  />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-ink text-white px-5 py-3 rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-rose transition-colors flex justify-center items-center gap-2">
                <Plus size={14} /> Generate Link Afiliasi
              </button>
            </form>

            {generatedLink && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 border-t border-ink/5"
              >
                <label className="text-xs font-medium text-emerald-600 block mb-2">Berhasil Dibuat!</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-3 overflow-hidden">
                    <p className="text-sm font-medium text-emerald-800 truncate">{generatedLink}</p>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="shrink-0 bg-white border border-ink/10 text-ink p-3 rounded-lg hover:bg-ink hover:text-white transition-colors"
                  >
                    {isCopied ? <CheckCircle size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ACTIVE LINKS TABLE */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-ink/5 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-ink/5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Link Aktif Anda</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink/5 text-ink/60 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Link Tujuan</th>
                    <th className="px-6 py-4 font-medium text-right">Total Klik</th>
                    <th className="px-6 py-4 font-medium text-right">Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {[
                    { target: '/collections/summer-sale', clicks: 842, sales: 24 },
                    { target: '/shop/oversized-tshirt', clicks: 124, sales: 3 },
                    { target: '/category/outerwear', clicks: 89, sales: 0 },
                  ].map((item, idx) => (
                    <tr key={idx} className="hover:bg-ink/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-ink font-medium truncate max-w-[200px]">{item.target}</span>
                          <span className="text-[10px] text-ink/40 mt-1">ninoc.com{item.target}?ref=johndoe</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-ink">{item.clicks}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">{item.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: TIPS */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-ink text-white p-6 rounded-2xl shadow-sm space-y-4"
          >
            <h3 className="text-sm font-medium uppercase tracking-wider">Tips Promosi</h3>
            <ul className="space-y-3 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">🔥</span>
                <span>Buat link terpisah untuk setiap produk spesifik agar konversi lebih tinggi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📱</span>
                <span>Letakkan link di Bio Instagram atau gunakan stiker link di IG Story.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">🛍️</span>
                <span>Gunakan fitur <b>Media Kit</b> untuk mengambil gambar produk HD.</span>
              </li>
            </ul>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
