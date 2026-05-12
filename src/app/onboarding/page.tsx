"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Package, CheckCircle, AlertTriangle, X, Shield, Lock, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Province { id: string; name: string; }
interface Regency { id: string; name: string; }
interface District { id: string; name: string; }

export default function OnboardingPage() {
  const router = useRouter();
  const { isMobile, isIPhone } = useDevice();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [showError, setShowError] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [f, setF] = useState({
    fn: '', ln: '', phone: '', prov: '', provName: '', city: '', cityName: '', dist: '', distName: '', vill: '', rt: '', rw: '', postal: ''
  });

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json').then(r => r.json()).then(setProvinces).catch(() => {});
  }, []);

  useEffect(() => {
    if (f.prov) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${f.prov}.json`).then(r => r.json()).then(d => { setRegencies(d); setDistricts([]); }).catch(() => {});
    }
  }, [f.prov]);

  useEffect(() => {
    if (f.city) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${f.city}.json`).then(r => r.json()).then(setDistricts).catch(() => {});
    }
  }, [f.city]);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      setUserEmail(user.email || '');
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const parts = name.split(' ');
      setF(p => ({ ...p, fn: parts[0] || '', ln: parts.slice(1).join(' ') || '' }));
      const { data: ex } = await supabase.from('customer_profiles').select('user_id').eq('user_id', user.id).single();
      if (ex) router.push('/profile');
      setIsLoading(false);
    };
    check();
  }, [router]);

  const logout = () => { supabase.auth.signOut(); router.push('/shop'); };

  const set = (k: string, v: string) => {
    setF(p => {
      const n = { ...p, [k]: v };
      if (k === 'prov') { n.city = ''; n.cityName = ''; n.dist = ''; n.distName = ''; }
      if (k === 'city') { n.dist = ''; n.distName = ''; }
      if (k === 'prov') { const px = provinces.find(x => x.id === v); n.provName = px?.name || ''; }
      if (k === 'city') { const cx = regencies.find(x => x.id === v); n.cityName = cx?.name || ''; }
      if (k === 'dist') { const dx = districts.find(x => x.id === v); n.distName = dx?.name || ''; }
      return n;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!f.fn.trim()) errs.push('Nama depan');
    if (!f.ln.trim()) errs.push('Nama belakang');
    if (!f.phone.trim()) errs.push('Telepon');
    if (!f.prov) errs.push('Provinsi');
    if (!f.city) errs.push('Kota');
    if (!f.dist) errs.push('Kecamatan');
    if (!f.vill.trim()) errs.push('Kelurahan');
    if (!f.rt.trim()) errs.push('RT');
    if (!f.rw.trim()) errs.push('RW');
    if (!f.postal.trim()) errs.push('Kode Pos');
    if (errs.length > 0) { setErrors(errs); setShowError(true); return; }
    setIsSaving(true);
    const addr = `${f.vill}, RT ${f.rt}/RW ${f.rw}, Kec. ${f.distName}, ${f.cityName}, ${f.provName}`;
    supabase.from('customer_profiles').upsert({
      user_id: userId, email: userEmail, full_name: `${f.fn} ${f.ln}`,
      first_name: f.fn, last_name: f.ln, phone: f.phone, address: addr,
      street: addr, city: f.cityName, province: f.provName, postal_code: f.postal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) { alert(error.message); setIsSaving(false); return; }
      router.push('/profile');
    });
  };

  if (isLoading) return <main className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ink/10 border-t-rose rounded-full animate-spin" /></main>;

  const ip = "w-full bg-ink/[0.03] border border-ink/10 focus:border-rose rounded-lg py-3 px-4 text-sm text-ink outline-none";
  const sl = "w-full bg-ink/[0.03] border border-ink/10 focus:border-rose rounded-lg py-3 px-4 text-sm text-ink outline-none appearance-none cursor-pointer";
  const lb = "text-xs font-medium text-ink/50 mb-1";
  const bd = "bg-white border-b border-ink/5 px-5 py-3 flex items-center justify-between";
  const cd = "px-5 py-4 space-y-3";
  const gr = "grid grid-cols-2 gap-3";
  const cr = "text-xs font-medium text-rose bg-rose/10 px-2 py-1 rounded";

  return (
    <main className={cn(
      "min-h-screen bg-cr selection:bg-ink selection:text-white flex flex-col",
      isIPhone && "pt-[env(safe-area-inset-top)]"
    )}>
      {/* MOBILE NAV BAR */}
      {isMobile && (
        <nav className={cn(
          "fixed top-0 inset-x-0 z-[150] bg-white/95 backdrop-blur-xl border-b border-ink/5",
          isIPhone && "pt-[env(safe-area-inset-top)]"
        )}>
          <div className="flex items-center justify-center py-3">
            <div className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">NINOC</div>
          </div>
        </nav>
      )}

      {/* Header - Desktop only */}
      {!isMobile && (
      <header className={bd}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center"><Package size={18} className="text-rose" /></div>
          <span className="text-sm font-medium text-ink">Lengkapi Data Diri</span>
        </div>
        <button onClick={logout} className="text-sm text-ink/30 hover:text-rose flex items-center gap-2"><LogOut size={16} />Batal</button>
      </header>
      )}

      {/* Mobile Header - Show title and back button */}
      {isMobile && (
        <div className={cn(
          "flex items-center justify-between px-4 py-3 bg-white border-b border-ink/5",
          isIPhone && "pt-10"
        )}>
          <button onClick={logout} className="text-ink/40 hover:text-rose flex items-center gap-2">
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-ink">Lengkapi Data</span>
          <div className="w-8" />
        </div>
      )}

      {/* Email badge */}
      <div className={bd + " bg-emerald-50"}>
        <CheckCircle size={16} className="text-emerald-500" />
        <span className="text-sm font-medium text-emerald-700">{userEmail}</span>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-xl mx-auto px-5 py-4 space-y-3">
          {/* 01 Identitas */}
          <div className={cd}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cr}>01</span><span className="text-sm font-medium uppercase text-rose">Identitas Diri</span>
            </div>
            <div className={gr}>
              <div><label className={lb}>Nama Depan</label><input value={f.fn} onChange={e => set('fn', e.target.value)} className={ip} placeholder="John" /></div>
              <div><label className={lb}>Nama Belakang</label><input value={f.ln} onChange={e => set('ln', e.target.value)} className={ip} placeholder="Doe" /></div>
            </div>
            <div><label className={lb}>Nomor Telepon</label><input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} className={ip} placeholder="081234567890" /></div>
          </div>

          {/* 02 Alamat */}
          <div className={cd}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cr}>02</span><span className="text-sm font-medium uppercase text-rose">Alamat Lengkap</span>
            </div>
            {/* Provinsi */}
            <div className="relative">
              <select value={f.prov} onChange={e => set('prov', e.target.value)} className={sl}>
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none" />
            </div>
            {/* Kota */}
            <div className="relative">
              <select value={f.city} onChange={e => set('city', e.target.value)} disabled={!f.prov} className={sl}>
                <option value="">Pilih Kota/Kabupaten</option>
                {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none" />
            </div>
            {/* Kecamatan */}
            <div className="relative">
              <select value={f.dist} onChange={e => set('dist', e.target.value)} disabled={!f.city} className={sl}>
                <option value="">Pilih Kecamatan</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none" />
            </div>
            {/* Fields */}
            <div className={gr + " grid-cols-4"}>
              <div><label className={lb}>Kel/Desa</label><input value={f.vill} onChange={e => set('vill', e.target.value)} className={ip} placeholder="Sukajadi" /></div>
              <div><label className={lb}>RT</label><input value={f.rt} onChange={e => set('rt', e.target.value)} className={ip} placeholder="001" /></div>
              <div><label className={lb}>RW</label><input value={f.rw} onChange={e => set('rw', e.target.value)} className={ip} placeholder="005" /></div>
              <div><label className={lb}>Kode Pos</label><input value={f.postal} onChange={e => set('postal', e.target.value)} className={ip} placeholder="40111" /></div>
            </div>
          </div>

          {/* Submit */}
          {!isMobile ? (
          <button type="submit" disabled={isSaving} className="w-full bg-ink text-white py-3.5 rounded-xl text-sm font-medium uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose disabled:opacity-50">
            {isSaving ? 'Menyimpan...' : <><span>Simpan & Lanjutkan</span><ArrowRight size={16} /></>}
          </button>
          ) : null}
        </div>
      </form>

      {/* MOBILE STICKY SUBMIT BUTTON */}
      {isMobile && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-ink/10 p-4",
          isIPhone && "pb-[env(safe-area-inset-bottom)]"
        )}>
          <button type="submit" disabled={isSaving} className="w-full bg-ink text-white py-4 rounded-xl text-sm font-medium uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose disabled:opacity-50">
            {isSaving ? 'Menyimpan...' : <><span>Simpan & Lanjutkan</span><ArrowRight size={16} /></>}
          </button>
        </div>
      )}

      {/* Trust Security Bar - PLACED BELOW FORM */}
      <div className="flex justify-center gap-12 pb-10 pt-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white border border-ink/5 flex items-center justify-center shadow-sm">
            <Shield size={14} strokeWidth={1.5} className="text-rose/60" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink">Aman</span>
            <span className="text-[8px] font-medium uppercase tracking-widest text-ink/20">Proteksi Data</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white border border-ink/5 flex items-center justify-center shadow-sm">
            <Lock size={14} strokeWidth={1.5} className="text-rose/60" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink">Enkripsi</span>
            <span className="text-[8px] font-medium uppercase tracking-widest text-ink/20">SSL Terjamin</span>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center" onClick={() => setShowError(false)}>
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <button onClick={() => setShowError(false)} className="absolute top-4 right-4 text-ink/30"><X size={20} /></button>
            <div className="w-14 h-14 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-rose" /></div>
            <h3 className="text-base font-medium text-center mb-3">Data Belum Lengkap</h3>
            <ul className="space-y-2 mb-5">
              {errors.map(e => <li key={e} className="text-sm text-ink/50">• {e}</li>)}
            </ul>
            <button onClick={() => setShowError(false)} className="w-full py-3 bg-ink text-white rounded-lg text-sm font-medium">Mengerti</button>
          </div>
        </div>
      )}
    </main>
  );
}