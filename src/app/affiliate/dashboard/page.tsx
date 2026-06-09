"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MousePointerClick, DollarSign, ArrowUpRight, Copy, Share2 } from 'lucide-react';

export default function AffiliateDashboardOverview() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-medium italic uppercase tracking-tighter text-ink">
            Selamat Datang, <span className="text-rose">Kreator!</span>
          </h1>
          <p className="text-xs md:text-sm text-ink/60 mt-1">Ringkasan performa kampanye Anda bulan ini.</p>
        </div>
        <button className="flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-rose transition-colors w-fit">
          <Share2 size={14} />
          Buat Link Baru
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} /> 12.5%
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mb-1">Total Komisi</p>
            <p className="text-2xl font-display font-medium text-ink">Rp 4.250.000</p>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <MousePointerClick size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} /> 8.2%
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mb-1">Total Klik Link</p>
            <p className="text-2xl font-display font-medium text-ink">1,248</p>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose/5 text-rose rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mb-1">Konversi Penjualan</p>
            <p className="text-2xl font-display font-medium text-ink">3.4%</p>
          </div>
        </motion.div>
      </div>

      {/* QUICK LINKS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-ink/5">
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Aktivitas Terkini</h2>
          </div>
          <div className="p-0">
            {/* Mock Table */}
            <table className="w-full text-left text-sm">
              <thead className="bg-ink/5 text-ink/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Produk</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Komisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="px-6 py-4 text-ink/60">Hari ini, 14:30</td>
                    <td className="px-6 py-4 text-ink font-medium">Oversized Obsidian T-Shirt</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm">Berhasil</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-ink">Rp 45.000</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP PERFORMING LINK */}
        <div className="bg-white rounded-2xl border border-ink/5 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Link Tersukses Anda</h2>
          
          <div className="p-4 bg-ink/[0.03] rounded-xl border border-ink/5 relative group">
            <p className="text-xs text-ink/60 mb-2">Koleksi Summer Sale</p>
            <p className="text-sm font-medium text-rose truncate pr-8">ninoc.com/col/summer?ref=johndoe</p>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors">
              <Copy size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Klik</span>
              <span className="font-medium text-ink">842</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Penjualan</span>
              <span className="font-medium text-ink">24</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Pendapatan</span>
              <span className="font-medium text-emerald-600">Rp 1.080.000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
