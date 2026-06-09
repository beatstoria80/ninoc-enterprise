"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Download, Copy, Instagram, PlaySquare, CheckCircle, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export default function AssetsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const assets = [
    {
      id: 'summer-sale',
      title: 'Summer Eclipse 2026',
      type: 'Collection',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      copywrite: "Tampil stand out di musim panas ini dengan koleksi 'Summer Eclipse' dari NINOC. Desain avant-garde yang ringan dan tetap mempertahankan estetika gelap yang misterius. Cek link di bio untuk diskon eksklusif! 🖤✨ #Ninoc #SummerEclipse #DarkAesthetic"
    },
    {
      id: 'obsidian-tee',
      title: 'Oversized Obsidian T-Shirt',
      type: 'Product',
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1974&auto=format&fit=crop',
      copywrite: "Kaos andalan buat gaya effortless. 'Oversized Obsidian T-Shirt' dari NINOC ini bahannya super premium dan jatuhnya pas banget di badan. Wajib punya buat daily wear kalian! Dapatkan potongan harga dengan klik link di bio. 🛒👕"
    },
    {
      id: 'midnight-jacket',
      title: 'Midnight Bomber Jacket',
      type: 'Product',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1935&auto=format&fit=crop',
      copywrite: "Layering season is here! Sempurnakan outfit kalian dengan 'Midnight Bomber Jacket' yang super sleek ini. Jahitan rapi, detail premium. Klik link di bio buat order sekarang sebelum kehabisan! 🔥 #NinocBomber #Streetwear"
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-medium italic uppercase tracking-tighter text-ink">
          Media <span className="text-rose">Kit</span>
        </h1>
        <p className="text-xs md:text-sm text-ink/60 mt-1">Unduh materi promosi HD dan gunakan *swipe copy* untuk jualan lebih cepat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {assets.map((asset, idx) => (
          <motion.div 
            key={asset.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-ink/5 shadow-sm overflow-hidden flex flex-col"
          >
            {/* IMAGE PREVIEW */}
            <div className="relative aspect-[4/5] bg-ink/5 group overflow-hidden">
              <Image 
                src={asset.image} 
                alt={asset.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <button className="w-full bg-white text-ink py-3 rounded-lg text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose hover:text-white transition-colors">
                  <Download size={14} /> Download HD (Tanpa Watermark)
                </button>
              </div>
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-white/90 text-ink shadow-sm backdrop-blur-sm">
                  {asset.type}
                </span>
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-sm font-medium text-ink mb-4">{asset.title}</h3>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-ink/50">Suggested Copywriting</label>
                  <div className="flex gap-2">
                    <Instagram size={12} className="text-ink/40" />
                    <PlaySquare size={12} className="text-ink/40" />
                  </div>
                </div>
                <div className="relative">
                  <p className="text-xs text-ink/70 bg-ink/[0.02] border border-ink/5 p-3 rounded-xl leading-relaxed italic">
                    "{asset.copywrite}"
                  </p>
                  <button 
                    onClick={() => handleCopy(asset.id, asset.copywrite)}
                    className="absolute bottom-2 right-2 p-2 bg-white border border-ink/10 rounded-lg text-ink/60 hover:text-ink hover:border-ink shadow-sm transition-all"
                    title="Copy Text"
                  >
                    {copiedId === asset.id ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-ink/5">
                <button className="text-[10px] font-medium uppercase tracking-wider text-rose hover:text-ink transition-colors flex items-center gap-1">
                  Lihat Produk di Web <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
