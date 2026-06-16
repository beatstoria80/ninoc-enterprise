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
          "w-full flex items-center justify-between bg-white border rounded-lg py-2.5 px-3 text-sm md:text-[11px] transition-colors",
          open ? "border-rose ring-2 ring-rose/10" : "border-ink/10 hover:border-ink/20",
          disabled && "opacity-50 cursor-not-allowed",
          !selected && "text-ink/30"
        )}
      >
        <span className={cn(selected ? "text-ink font-medium" : "text-ink/30")}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={13} className={cn("text-ink/20 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-ink/10 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-ink/5">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/20" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Ketik untuk cari..."
                    className="w-full pl-8 pr-3 py-2 text-sm md:text-[11px] border border-ink/10 rounded-md outline-none focus:border-rose/40 placeholder:text-ink/20"
                  />
                </div>
              </div>
            )}
            <div className="max-h-40 overflow-y-auto minimal-scroll">
              {filtered.length === 0 ? (
                <div className="px-4 py-4 text-center"><p className="text-sm md:text-[11px] text-ink/30">Tidak ditemukan</p></div>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id, opt.name); setOpen(false); setSearch(''); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm md:text-[11px] flex items-center justify-between hover:bg-rose/5 transition-colors",
                      opt.id === value && "bg-rose/5"
                    )}
                  >
                    <span className={cn(opt.id === value ? "text-rose font-medium" : "text-ink")}>{opt.name}</span>
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
  return <label className="text-xs md:text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1 block">{children}</label>;
}

// ─── Input ────────────────────────────────────────────────────────────────
const ip = "w-full bg-white border border-ink/10 focus:border-rose rounded-lg py-2.5 px-3 text-sm md:text-[11px] font-medium text-ink outline-none placeholder:text-ink/20 transition-colors";

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
      "min-h-[100dvh] w-full bg-cr selection:bg-ink selection:text-white flex flex-col lg:grid lg:grid-cols-3 lg:h-[100dvh] lg:overflow-hidden",
      isIPhone && "pt-[env(safe-area-inset-top)] lg:pt-0"
    )}>
      
      {/* ─── LEFT COLUMN: Branding & Welcome (Desktop Only) ─── */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-12 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-rose blur-[120px]" />
        </div>
        
        <div className="relative z-10">
          <div className="font-display font-medium text-3xl italic tracking-tighter text-white mb-8">NINOC.</div>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
            Bergabung dengan<br />Eksklusivitas.
          </h1>
          <p className="text-white/60 text-sm max-w-sm leading-relaxed">
            Lengkapi profil Anda untuk mendapatkan akses penuh ke koleksi terbaru, penawaran khusus anggota, dan pengalaman berbelanja yang personal.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-ink bg-white/10" />
            ))}
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">10K+ Member Bergabung</p>
        </div>
      </div>

      {/* ─── CENTER COLUMN: The Form ─── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto minimal-scroll relative">
        <div className="w-full max-w-lg mx-auto my-auto p-4 md:p-8 flex flex-col min-h-full lg:min-h-0 justify-center">
          
          {/* Mobile Only Header (Logo) */}
          <div className="lg:hidden flex items-center justify-center mb-8 mt-4">
            <div className="font-display font-medium text-2xl italic tracking-tighter text-ink">NINOC.</div>
          </div>

          {/* Form Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center shrink-0">
                <Package size={18} className="text-rose" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-ink tracking-tight">Lengkapi Data</h2>
                <p className="text-xs text-ink/40 uppercase tracking-widest font-medium mt-0.5">Step {activeStep} of 2</p>
              </div>
            </div>
            <button onClick={logout} className="text-[10px] md:text-[9px] font-semibold text-ink/30 hover:text-rose uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-ink/5">
              <LogOut size={12} /> Batal
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted = completedSteps.includes(step.id);
              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isActive || isCompleted ? '#e11c28' : 'white',
                      borderColor: isActive || isCompleted ? '#e11c28' : '#e5e7eb',
                      color: isActive || isCompleted ? 'white' : '#9ca3af'
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0"
                  >
                    {isCompleted ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={1.5} />}
                  </motion.div>
                  <span className={cn("text-[10px] md:text-[9px] font-bold uppercase tracking-widest hidden sm:block", isActive || isCompleted ? "text-rose" : "text-ink/30")}>
                    {step.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={cn("flex-1 h-px max-w-[40px]", isCompleted ? "bg-rose" : "bg-ink/10")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Email Badge */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5"
          >
            <CheckCircle size={15} className="text-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600/70 mb-0.5">Terverifikasi</span>
              <span className="text-xs md:text-[11px] font-medium text-emerald-800 truncate">{userEmail}</span>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-ink/5 shadow-sm overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Identitas ── */}
              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 md:p-6"
                >
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-[10px] font-bold text-rose bg-rose/10 px-2 py-0.5 rounded uppercase tracking-widest">01</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-ink">Identitas Diri</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <FL>Nama Depan</FL>
                      <input value={f.fn} onChange={e => set('fn', e.target.value)} className={ip} placeholder="John" />
                    </div>
                    <div>
                      <FL>Nama Belakang</FL>
                      <input value={f.ln} onChange={e => set('ln', e.target.value)} className={ip} placeholder="Doe" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <FL>Nomor Telepon</FL>
                    <input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} className={ip} placeholder="0812..." />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <FL>Tanggal Lahir</FL>
                      <input type="date" value={f.birth_date} onChange={e => set('birth_date', e.target.value)} className={ip} />
                    </div>
                    <div>
                      <FL>Jenis Kelamin</FL>
                      <select value={f.gender} onChange={e => set('gender', e.target.value)} className={ip}>
                        <option value="">Pilih</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={goToStep2}
                    className="w-full bg-ink text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose transition-colors"
                  >
                    <span>Lanjut ke Alamat</span>
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: Alamat ── */}
              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/5 pb-4 mb-5 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-rose bg-rose/10 px-2 py-0.5 rounded uppercase tracking-widest">02</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-ink">Alamat Pengiriman</span>
                    </div>
                    <div className="flex bg-ink/5 p-1 rounded-lg">
                      <button 
                        type="button"
                        onClick={() => setF(p => ({ ...p, address_type: 'Home' }))}
                        className={cn("px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all rounded-md", f.address_type === 'Home' ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink")}
                      >
                        Rumah
                      </button>
                      <button 
                        type="button"
                        onClick={() => setF(p => ({ ...p, address_type: 'Office' }))}
                        className={cn("px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all rounded-md", f.address_type === 'Office' ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink")}
                      >
                        Kantor
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="sm:col-span-2">
                      <FL>Nama Jalan</FL>
                      <input value={f.street} onChange={e => set('street', e.target.value)} className={ip} placeholder="Jl. Asia Afrika" />
                    </div>
                    <div>
                      <FL>No. Rumah</FL>
                      <input value={f.house_number} onChange={e => set('house_number', e.target.value)} className={ip} placeholder="No. 22" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <FL>Provinsi</FL>
                    <CustomDropdown value={f.prov} options={provinces} onChange={(id) => set('prov', id)} placeholder="Pilih Provinsi" searchable />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <FL>Kota / Kabupaten</FL>
                      <CustomDropdown value={f.city} options={regencies} onChange={(id) => set('city', id)} placeholder="Pilih Kota" disabled={!f.prov} searchable />
                    </div>
                    <div>
                      <FL>Kecamatan</FL>
                      <CustomDropdown value={f.dist} options={districts} onChange={(id) => set('dist', id)} placeholder="Pilih Kecamatan" disabled={!f.city} searchable />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <FL>Kel / Desa</FL>
                      <CustomDropdown
                        value={f.villId}
                        options={villages}
                        onChange={(id, name) => { set('villId', id); }}
                        placeholder={f.dist ? "Pilih Kel/Desa" : "Pilih Kecamatan dulu"}
                        disabled={!f.dist}
                        searchable
                      />
                    </div>
                    <div>
                      <FL>Kode Pos</FL>
                      <input value={f.postal} onChange={e => setF(p => ({ ...p, postal: e.target.value }))} className={ip} placeholder="40111" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <FL>RT</FL>
                      <input value={f.rt} onChange={e => set('rt', e.target.value)} className={ip} placeholder="001" />
                    </div>
                    <div>
                      <FL>RW</FL>
                      <input value={f.rw} onChange={e => set('rw', e.target.value)} className={ip} placeholder="005" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="w-full sm:w-1/3 bg-ink/5 text-ink py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink/10 transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={isSaving}
                      className="w-full sm:w-2/3 bg-ink text-white py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose disabled:opacity-50 transition-colors"
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

          <div className="lg:hidden flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-rose/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Aman</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-rose/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Enkripsi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: Benefits & Trust (Desktop Only) ─── */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-rose/5 p-12 border-l border-ink/5">
        <div className="max-w-xs text-center space-y-12">
          
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-rose">
              <Shield size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-ink">Privasi Terjamin</h3>
            <p className="text-xs text-ink/50 leading-relaxed">
              Data Anda dienkripsi dengan standar keamanan industri tingkat tinggi dan tidak akan dibagikan ke pihak manapun.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-rose">
              <Package size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-ink">Pengiriman Cepat</h3>
            <p className="text-xs text-ink/50 leading-relaxed">
              Alamat yang akurat memastikan pesanan Anda tiba tepat waktu tanpa kendala di jalan.
            </p>
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
              <h3 className="text-sm font-semibold text-center mb-1 text-ink">Data Belum Lengkap</h3>
              <p className="text-xs md:text-[10px] text-ink/50 text-center mb-4">Pastikan semua field terisi</p>
              <ul className="space-y-1 mb-4">
                {errors.map(e => (
                  <li key={e} className="text-xs md:text-[10px] text-ink/60 flex items-center gap-2">
                    <div className="w-1 h-1 bg-rose rounded-full shrink-0" />{e}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowError(false)}
                className="w-full py-2.5 bg-ink text-white rounded-lg text-xs md:text-[10px] font-semibold uppercase tracking-wider hover:bg-rose transition-colors"
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