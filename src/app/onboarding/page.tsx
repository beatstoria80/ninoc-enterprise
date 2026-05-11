"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, Package, CheckCircle, AlertTriangle, X, Shield, Lock, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Province { id: string; name: string; }
interface Regency { id: string; name: string; }
interface District { id: string; name: string; }

export default function OnboardingPage() {
  const router = useRouter();
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

  if (isLoading) return <main className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-ink/10 border-t-rose rounded-full animate-spin" /></main>;

  const ip = "w-full bg-ink/[0.03] border border-ink/5 focus:border-rose rounded-lg py-2 px-3 text-xs text-ink outline-none";
  const sl = "w-full bg-ink/[0.03] border border-ink/5 focus:border-rose rounded-lg py-2 px-3 text-xs text-ink outline-none appearance-none cursor-pointer";
  const lb = "text-[10px] font-medium text-ink/40 mb-0.5";
  const bd = "bg-white border-b border-ink/5 px-4 py-2 flex items-center justify-between";
  const cd = "px-4 py-3 space-y-2";
  const gr = "grid grid-cols-2 gap-2";
  const cr = "text-xs font-medium text-rose bg-rose/10 px-1 py-0.5 rounded";

  return (
    <main className="min-h-screen bg-cr selection:bg-ink selection:text-white flex flex-col">
      {/* Header */}
      <header className={bd}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose/10 rounded-lg flex items-center justify-center"><Package size={14} className="text-rose" /></div>
          <span className="text-xs font-medium text-ink">Lengkapi Data</span>
        </div>
        <button onClick={logout} className="text-[10px] text-ink/30 hover:text-rose flex items-center gap-1"><LogOut size={12} />Batal</button>
      </header>

      {/* Email badge */}
      <div className={bd + " bg-emerald-50"}>
        <CheckCircle size={12} className="text-emerald-500" />
        <span className="text-[10px] font-medium text-emerald-700">{userEmail}</span>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-2">
          {/* 01 Identitas */}
          <div className={cd}>
            <div className="flex items-center gap-1 mb-1">
              <span className={cr}>01</span><span className="text-[10px] font-medium uppercase text-rose">Identitas</span>
            </div>
            <div className={gr}>
              <div><label className={lb}>Nama Depan</label><input value={f.fn} onChange={e => set('fn', e.target.value)} className={ip} placeholder="John" /></div>
              <div><label className={lb}>Nama Belakang</label><input value={f.ln} onChange={e => set('ln', e.target.value)} className={ip} placeholder="Doe" /></div>
            </div>
            <div><label className={lb}>Telepon</label><input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} className={ip} placeholder="081234567890" /></div>
          </div>

          {/* 02 Alamat */}
          <div className={cd}>
            <div className="flex items-center gap-1 mb-1">
              <span className={cr}>02</span><span className="text-[10px] font-medium uppercase text-rose">Alamat</span>
            </div>
            {/* Provinsi */}
            <div className="relative">
              <select value={f.prov} onChange={e => set('prov', e.target.value)} className={sl}>
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none" />
            </div>
            {/* Kota */}
            <div className="relative">
              <select value={f.city} onChange={e => set('city', e.target.value)} disabled={!f.prov} className={sl}>
                <option value="">Pilih Kota/Kab</option>
                {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none" />
            </div>
            {/* Kecamatan */}
            <div className="relative">
              <select value={f.dist} onChange={e => set('dist', e.target.value)} disabled={!f.city} className={sl}>
                <option value="">Pilih Kecamatan</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none" />
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
          <button type="submit" disabled={isSaving} className="w-full bg-ink text-white py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose disabled:opacity-50">
            {isSaving ? 'Menyimpan...' : <><span>Simpan</span><ArrowRight size={12} /></>}
          </button>
          <div className="flex justify-center gap-4 text-[9px] text-ink/20"><Shield size={10} />Aman <Lock size={10} />Enkripsi</div>
        </div>
      </form>

      {/* Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-ink/50 z-50" onClick={() => setShowError(false)}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-xl p-5 shadow-xl">
            <button onClick={() => setShowError(false)} className="absolute top-3 right-3 text-ink/30"><X size={16} /></button>
            <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-3"><AlertTriangle size={20} className="text-rose" /></div>
            <h3 className="text-sm font-medium text-center mb-3">Data Belum Lengkap</h3>
            <ul className="space-y-1 mb-4">
              {errors.map(e => <li key={e} className="text-[10px] text-ink/50">• {e}</li>)}
            </ul>
            <button onClick={() => setShowError(false)} className="w-full py-2 bg-ink text-white rounded-lg text-xs font-medium">Mengerti</button>
          </div>
        </div>
      )}
    </main>
  );
}