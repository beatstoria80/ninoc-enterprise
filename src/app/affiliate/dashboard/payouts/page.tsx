"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Building, FileText, Upload, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function PayoutsPage() {
  const [bankSaved, setBankSaved] = useState(false);
  const [idUploaded, setIdUploaded] = useState(false);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-medium italic uppercase tracking-tighter text-ink">
          Penarikan <span className="text-rose">Dana</span>
        </h1>
        <p className="text-xs md:text-sm text-ink/60 mt-1">Kelola rekening tujuan dan verifikasi identitas Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: BALANCE & HISTORY */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-ink text-white p-6 rounded-2xl shadow-sm relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 text-white/5">
              <Wallet size={120} />
            </div>

            <p className="text-xs font-medium uppercase tracking-wider text-white/60 mb-2">Saldo Tersedia</p>
            <p className="text-3xl font-display font-medium">Rp 4.250.000</p>
            
            <button className="mt-6 w-full bg-white text-ink py-3 rounded-lg text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose hover:text-white transition-colors">
              Tarik Dana Sekarang
            </button>
          </motion.div>

          {/* HISTORY */}
          <div className="bg-white rounded-2xl border border-ink/5 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-ink/5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Riwayat Penarikan</h2>
            </div>
            <div className="divide-y divide-ink/5">
              {[
                { date: '12 Mei 2026', amount: 'Rp 2.500.000', status: 'Selesai', color: 'emerald' },
                { date: '10 Apr 2026', amount: 'Rp 1.200.000', status: 'Selesai', color: 'emerald' },
              ].map((item, idx) => (
                <div key={idx} className="p-5 flex justify-between items-center hover:bg-ink/[0.02] transition-colors">
                  <div>
                    <p className="font-medium text-sm text-ink">{item.amount}</p>
                    <p className="text-xs text-ink/40 mt-1">{item.date}</p>
                  </div>
                  <span className={`text-xs md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm text-${item.color}-600 bg-${item.color}-50`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORMS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* BANK DETAILS FORM */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-ink/5 shadow-sm p-6 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-ink/5 pb-4">
              <div className="p-2 bg-ink/5 rounded-lg text-ink">
                <Building size={18} />
              </div>
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Rekening Pencairan</h2>
                <p className="text-xs text-ink/40 mt-0.5">Komisi akan ditransfer ke rekening ini</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setBankSaved(true); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-2">Nama Bank</label>
                  <select className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-2.5 px-4 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20">
                    <option value="">Pilih Bank...</option>
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60 block mb-2">Nomor Rekening</label>
                  <input type="text" placeholder="1234567890" className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-2.5 px-4 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink/60 block mb-2">Nama Pemilik Rekening</label>
                <input type="text" placeholder="Sesuai KTP" className="w-full bg-ink/[0.03] border border-ink/5 rounded-lg py-2.5 px-4 text-sm font-medium text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" />
              </div>
              
              <div className="pt-2">
                <button type="submit" className="bg-ink text-white px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-rose transition-colors flex items-center gap-2">
                  {bankSaved ? <CheckCircle size={14} /> : null}
                  {bankSaved ? 'Tersimpan' : 'Simpan Rekening'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* VERIFICATION FORM */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-ink/5 shadow-sm p-6 space-y-6"
          >
            <div className="flex justify-between items-start border-b border-ink/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose/5 rounded-lg text-rose">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Verifikasi Identitas</h2>
                  <p className="text-xs text-ink/40 mt-0.5">Wajib untuk mencegah penipuan / pencucian uang</p>
                </div>
              </div>
              {!idUploaded && (
                <span className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-rose bg-rose/10 px-2 py-1 rounded-sm">
                  Belum Lengkap
                </span>
              )}
            </div>

            <div className="bg-rose/5 border border-rose/10 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle size={16} className="text-rose shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-rose leading-relaxed">
                Penarikan dana tidak dapat diproses jika dokumen verifikasi belum diunggah dan disetujui oleh tim kami. Harap lampirkan KTP dan Bukti Rekening Koran/Buku Tabungan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* KTP UPLOAD */}
              <div className="border-2 border-dashed border-ink/10 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-rose transition-colors bg-ink/[0.02]">
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <Upload size={18} className="text-ink/60" />
                </div>
                <h3 className="text-sm font-medium text-ink mb-1">Upload KTP Asli</h3>
                <p className="text-xs md:text-[10px] text-ink/40 uppercase tracking-wider">Format: JPG/PNG/PDF (Maks 2MB)</p>
              </div>

              {/* REKENING KORAN UPLOAD */}
              <div className="border-2 border-dashed border-ink/10 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-rose transition-colors bg-ink/[0.02]">
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <Upload size={18} className="text-ink/60" />
                </div>
                <h3 className="text-sm font-medium text-ink mb-1">Upload Mutasi / Rek. Koran</h3>
                <p className="text-xs md:text-[10px] text-ink/40 uppercase tracking-wider">Halaman depan buku tabungan</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setIdUploaded(true)} className="bg-ink text-white px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-rose transition-colors flex items-center gap-2">
                Kirim Dokumen Verifikasi <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
