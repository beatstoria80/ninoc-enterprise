"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Package, CheckCircle, AlertTriangle, Shield, Lock, LogOut, ChevronDown, Check, User, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Province { id: string; name: string; }
interface Regency { id: string; name: string; }
interface District { id: string; name: string; }
interface Village { id: string; name: string; }

// ─── Custom Dropdown ────────────────────────────────────────────────────────
function CustomDropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  searchable = false,
}: {
  value: string;
  options: { id: string; name: string }[];
  onChange: (id: string, name: string) => void;
  placeholder: string;
  disabled?: boolean;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);
  const filtered = searchable && search
    ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(o => !o); setSearch(''); }}
        className={cn(
          "w-full flex items-center justify-between bg-white border py-3 px-4 text-xs font-semibold uppercase tracking-wider transition-all rounded-none",
          open ? "border-ink" : "border-ink/20 hover:border-ink/40",
          disabled && "opacity-50 cursor-not-allowed",
          !selected && "text-ink/40"
        )}
      >
        <span className={cn(selected ? "text-ink font-medium" : "text-ink/40")}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={12} className={cn("text-ink/40 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-ink/20 rounded-none shadow-2xl z-50 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-ink/10">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="CARILOKASI..."
                    className="w-full pl-8 pr-3 py-2 text-xs border border-ink/20 rounded-none outline-none focus:border-ink/60 placeholder:text-ink/30 font-medium uppercase tracking-wider"
                  />
                </div>
              </div>
            )}
            <div className="max-h-40 overflow-y-auto minimal-scroll">
              {filtered.length === 0 ? (
                <div className="px-4 py-4 text-center"><p className="text-xs font-bold uppercase tracking-widest text-ink/40">Tidak ditemukan</p></div>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id, opt.name); setOpen(false); setSearch(''); }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider flex items-center justify-between hover:bg-ink/[0.03] transition-colors",
                      opt.id === value && "bg-ink/5"
                    )}
                  >
                    <span className={cn(opt.id === value ? "text-rose font-bold" : "text-ink")}>{opt.name}</span>
                    {opt.id === value && <Check size={12} className="text-rose shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Field Label ───────────────────────────────────────────────────────────
function FL({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-1.5 block">{children}</label>;
}

// ─── Input ────────────────────────────────────────────────────────────────
const ip = "w-full bg-white border border-ink/20 focus:border-ink rounded-none py-3 px-4 text-xs font-semibold text-ink outline-none placeholder:text-ink/30 transition-all uppercase tracking-wider";

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { isMobile, isIPhone } = useDevice();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [showError, setShowError] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [f, setF] = useState({
    fn: '', ln: '', phone: '',
    birth_date: '', gender: '',
    street: '', house_number: '',
    prov: '', provName: '', city: '', cityName: '', dist: '', distName: '',
    villId: '', vill: '', rt: '', rw: '', postal: '',
    address_type: 'Home'
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
    if (f.dist) {
      fetch(`/api/wilayah/villages?districtId=${f.dist}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setVillages(data); })
        .catch(() => {});
    }
  }, [f.dist]);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      setUserEmail(user.email || '');
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const parts = name.split(' ');
      setF(p => ({ ...p, fn: parts[0] || '', ln: parts.slice(1).join(' ') || '' }));
      const { data: ex } = await supabase.from('customer_profiles').select('user_id, is_verified').eq('user_id', user.id).single();
      if (ex?.is_verified) {
        router.push('/profile');
        return;
      }
      setIsLoading(false);
    };
    check();
  }, [router, supabase]);

  const logout = () => { supabase.auth.signOut(); router.push('/shop'); };

  const set = (k: string, v: string) => {
    setF(p => {
      const n = { ...p, [k]: v };
      if (k === 'prov') { n.city = ''; n.cityName = ''; n.dist = ''; n.distName = ''; n.villId = ''; n.vill = ''; }
      if (k === 'city') { n.dist = ''; n.distName = ''; n.villId = ''; n.vill = ''; }
      if (k === 'dist') { n.villId = ''; n.vill = ''; }
      if (k === 'prov') { const px = provinces.find(x => x.id === v); n.provName = px?.name || ''; }
      if (k === 'city') { const cx = regencies.find(x => x.id === v); n.cityName = cx?.name || ''; }
      if (k === 'dist') { const dx = districts.find(x => x.id === v); n.distName = dx?.name || ''; }
      if (k === 'villId') { const vx = villages.find(x => x.id === v); n.vill = vx?.name || ''; }
      return n;
    });
  };

  const validateStep1 = () => {
    const errs: string[] = [];
    if (!f.fn.trim()) errs.push('Nama depan');
    if (!f.ln.trim()) errs.push('Nama belakang');
    if (!f.phone.trim()) errs.push('Telepon');
    if (!f.birth_date.trim()) errs.push('Tanggal Lahir');
    if (!f.gender.trim()) errs.push('Jenis Kelamin');
    return errs;
  };

  const validateStep2 = () => {
    const errs: string[] = [];
    if (!f.street.trim()) errs.push('Nama jalan');
    if (!f.house_number.trim()) errs.push('Nomor rumah');
    if (!f.prov) errs.push('Provinsi');
    if (!f.city) errs.push('Kota');
    if (!f.dist) errs.push('Kecamatan');
    if (!f.villId.trim()) errs.push('Kel/Desa');
    if (!f.rt.trim()) errs.push('RT');
    if (!f.rw.trim()) errs.push('RW');
    if (!f.postal.trim()) errs.push('Kode Pos');
    return errs;
  };

  const goToStep2 = () => {
    const errs = validateStep1();
    if (errs.length > 0) { setErrors(errs); setShowError(true); return; }
    setCompletedSteps(prev => [...new Set([...prev, 1])]);
    setActiveStep(2);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep2();
    if (errs.length > 0) { setErrors(errs); setShowError(true); return; }
    setIsSaving(true);
    const addr = `[${f.address_type}] ${f.house_number} ${f.street}, ${f.vill}, RT ${f.rt}/RW ${f.rw}, Kec. ${f.distName}, ${f.cityName}, ${f.provName}`;
    supabase.from('customer_profiles').upsert({
      user_id: userId, email: userEmail, full_name: `${f.fn} ${f.ln}`,
      first_name: f.fn, last_name: f.ln, phone: f.phone,
      street: `${f.house_number} ${f.street}`,
      house_number: f.house_number,
      address: addr,
      city: f.cityName, province: f.provName, postal_code: f.postal,
      rt: f.rt, rw: f.rw,
      kecamatan: f.distName, kelurahan: f.vill,
      birth_date: f.birth_date, gender: f.gender,
      is_verified: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) { alert(error.message); setIsSaving(false); return; }
      router.push('/profile');
    });
  };

  if (isLoading) return (
    <main className="min-h-screen bg-cr flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-ink/10 border-t-rose rounded-full animate-spin" />
    </main>
  );

  const steps = [
    { id: 1, label: 'Identitas', icon: User },
    { id: 2, label: 'Alamat', icon: MapPin },
  ];

  return (
    <main className={cn(
      "min-h-screen bg-cr flex flex-col items-center justify-start pt-6 md:pt-16 px-4 pb-16 selection:bg-ink selection:text-white",
      isIPhone && "pt-[env(safe-area-inset-top)]"
    )}>
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 border-b border-ink/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ink flex items-center justify-center rounded-none text-white">
            <Package size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-ink">NINOC / ONBOARDING</h1>
            <p className="text-[10px] text-ink/50 uppercase tracking-wider font-semibold mt-0.5">Langkah {activeStep} dari 2</p>
          </div>
        </div>
        <button onClick={logout} className="text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-rose flex items-center gap-1.5 transition-colors">
          <LogOut size={13} />Batal
        </button>
      </div>

      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-start gap-4 mb-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isActive || isCompleted ? '#000000' : 'transparent',
                      borderColor: isActive || isCompleted ? '#000000' : '#e5e7eb',
                      color: isActive || isCompleted ? '#ffffff' : '#9ca3af'
                    }}
                    transition={{ duration: 0.15 }}
                    className="w-6 h-6 border flex items-center justify-center rounded-none text-[10px]"
                  >
                    {isCompleted ? <Check size={11} strokeWidth={3} /> : <Icon size={11} strokeWidth={2} />}
                  </motion.div>
                  <span className={cn("text-xs font-bold uppercase tracking-widest", isActive || isCompleted ? "text-ink" : "text-ink/40")}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("flex-1 h-px max-w-[40px]", isCompleted ? "bg-ink" : "bg-ink/10")} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Email Badge */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-ink/5 border border-ink/10 rounded-none px-4 py-2.5 mb-4 justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-ink/60" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink/80">{userEmail}</span>
          </div>
          <span className="text-[9px] font-bold bg-ink text-white px-2 py-0.5 rounded-none tracking-widest uppercase">TERVERIFIKASI</span>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-ink/15 rounded-none shadow-sm overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Identitas ── */}
            {activeStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.1 }}
                className="p-6 md:p-10"
              >
                {/* Section label */}
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-xs font-bold text-white bg-ink px-2.5 py-1 rounded-none tracking-wider">01</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-ink">Identitas Diri</span>
                </div>

                {/* 3-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <FL>Nama Depan</FL>
                    <input value={f.fn} onChange={e => set('fn', e.target.value)} className={ip} placeholder="John" />
                  </div>
                  <div>
                    <FL>Nama Belakang</FL>
                    <input value={f.ln} onChange={e => set('ln', e.target.value)} className={ip} placeholder="Doe" />
                  </div>
                  <div>
                    <FL>Nomor Telepon</FL>
                    <input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} className={ip} placeholder="0812..." />
                  </div>
                </div>

                {/* 3-column grid: Tanggal Lahir + Jenis Kelamin */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div>
                    <FL>Tanggal Lahir</FL>
                    <input type="date" value={f.birth_date} onChange={e => set('birth_date', e.target.value)} className={ip} />
                  </div>
                  <div>
                    <FL>Jenis Kelamin</FL>
                    <select value={f.gender} onChange={e => set('gender', e.target.value)} className={ip}>
                      <option value="">Pilih</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end border-t border-ink/10 pt-6 mt-4">
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="w-full md:w-auto bg-ink text-white py-3.5 px-8 rounded-none text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose transition-all cursor-pointer"
                  >
                    <span>Lanjut ke Alamat</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Alamat ── */}
            {activeStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.1 }}
                className="p-6 md:p-10"
              >
                {/* Section label */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-ink/10 pb-4 mb-6 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white bg-ink px-2.5 py-1 rounded-none tracking-wider">02</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-ink">Alamat Lengkap</span>
                  </div>
                  {/* Address Type Selector */}
                  <div className="flex bg-ink/5 p-1 rounded-none border border-ink/10 w-full md:w-auto">
                    <button 
                      type="button"
                      onClick={() => setF(p => ({ ...p, address_type: 'Home' }))}
                      className={cn("flex-1 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-none truncate cursor-pointer", f.address_type === 'Home' ? "bg-ink text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                    >
                      Rumah / Home
                    </button>
                    <button 
                      type="button"
                      onClick={() => setF(p => ({ ...p, address_type: 'Office' }))}
                      className={cn("flex-1 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-none truncate cursor-pointer", f.address_type === 'Office' ? "bg-ink text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                    >
                      Kantor / Office
                    </button>
                  </div>
                </div>

                {/* 3-column grid for address fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <FL>Nama Jalan</FL>
                    <input value={f.street} onChange={e => set('street', e.target.value)} className={ip} placeholder="JL. ASIA AFRIKA" />
                  </div>
                  <div>
                    <FL>No. Rumah</FL>
                    <input value={f.house_number} onChange={e => set('house_number', e.target.value)} className={ip} placeholder="NO. 22" />
                  </div>
                  <div>
                    <FL>Provinsi</FL>
                    <CustomDropdown value={f.prov} options={provinces} onChange={(id) => set('prov', id)} placeholder="PILIH PROVINSI" searchable />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <FL>Kota / Kabupaten</FL>
                    <CustomDropdown value={f.city} options={regencies} onChange={(id) => set('city', id)} placeholder="PILIH KOTA" disabled={!f.prov} searchable />
                  </div>
                  <div>
                    <FL>Kecamatan</FL>
                    <CustomDropdown value={f.dist} options={districts} onChange={(id) => set('dist', id)} placeholder="PILIH KECAMATAN" disabled={!f.city} searchable />
                  </div>
                  <div>
                    <FL>Kel / Desa</FL>
                    <CustomDropdown
                      value={f.villId}
                      options={villages}
                      onChange={(id) => { set('villId', id); }}
                      placeholder={f.dist ? "PILIH KEL/DESA" : "PILIH KECAMATAN DULU"}
                      disabled={!f.dist}
                      searchable
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <FL>Kode Pos</FL>
                    <input value={f.postal} onChange={e => setF(p => ({ ...p, postal: e.target.value }))} className={ip} placeholder="40111" />
                  </div>
                  <div>
                    <FL>RT</FL>
                    <input value={f.rt} onChange={e => set('rt', e.target.value)} className={ip} placeholder="001" />
                  </div>
                  <div>
                    <FL>RW</FL>
                    <input value={f.rw} onChange={e => set('rw', e.target.value)} className={ip} placeholder="005" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 border-t border-ink/10 pt-6 mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="w-full md:w-auto bg-ink/5 text-ink/75 py-3 px-8 rounded-none text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink/10 transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={isSaving}
                    className="w-full md:w-auto bg-ink text-white py-3.5 px-10 rounded-none text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><span>Simpan & Selesai</span><ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-5 mt-4 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Shield size={12} strokeWidth={2} className="text-rose/80" />
            </div>
            <span className="text-sm font-bold tracking-normal text-slate-600">Aman</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Lock size={12} strokeWidth={2} className="text-rose/80" />
            </div>
            <span className="text-sm font-bold tracking-normal text-slate-600">Enkripsi</span>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowError(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-11 h-11 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={18} className="text-rose" />
              </div>
              <h3 className="text-base font-semibold text-center mb-1 text-slate-800">Data Belum Lengkap</h3>
              <p className="text-sm text-slate-500 text-center mb-4 font-medium">Pastikan semua field terisi</p>
              <ul className="space-y-2 mb-6 bg-slate-50 p-4 rounded-lg">
                {errors.map(e => (
                  <li key={e} className="text-sm text-slate-700 font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-rose rounded-full shrink-0" />{e}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowError(false)}
                className="w-full py-3 bg-slate-800 text-white rounded-lg text-sm font-bold tracking-normal hover:bg-rose transition-colors shadow-sm"
              >
                Mengerti
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}