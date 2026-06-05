"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Package, CheckCircle, AlertTriangle, Shield, Lock, LogOut, ChevronDown, Check, User, MapPin, Search, ChevronUp, Home, MapPinned } from 'lucide-react';
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
          "w-full flex items-center justify-between bg-white border rounded-lg py-2.5 px-3.5 text-xs transition-colors",
          open ? "border-rose ring-2 ring-rose/10" : "border-ink/10 hover:border-ink/20",
          disabled && "opacity-50 cursor-not-allowed",
          !selected && "text-ink/30"
        )}
      >
        <span className={cn(selected ? "text-ink font-medium" : "text-ink/30")}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={14} className={cn("text-ink/20 shrink-0 transition-transform", open && "rotate-180")} />
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
                    className="w-full pl-7 pr-3 py-2 text-xs border border-ink/10 rounded-md outline-none focus:border-rose/40 placeholder:text-ink/20"
                  />
                </div>
              </div>
            )}
            <div className="max-h-44 overflow-y-auto minimal-scroll">
              {filtered.length === 0 ? (
                <div className="px-4 py-5 text-center"><p className="text-xs text-ink/30">Tidak ditemukan</p></div>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id, opt.name); setOpen(false); setSearch(''); }}
                    className={cn(
                      "w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-rose/5 transition-colors",
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

// ─── Collapsible Section ───────────────────────────────────────────────────
function Section({ icon: Icon, label, children, defaultOpen = false }: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-ink/5 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-ink/[0.02] hover:bg-ink/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-rose" strokeWidth={1.5} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink">{label}</span>
        </div>
       <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-ink/30" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
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
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [f, setF] = useState({
    fn: '', ln: '', phone: '',
    street: '', house_number: '',
    prov: '', provName: '', city: '', cityName: '', dist: '', distName: '',
    vill: '', rt: '', rw: '', postal: ''
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

  const validateStep1 = () => {
    const errs: string[] = [];
    if (!f.fn.trim()) errs.push('Nama depan');
    if (!f.ln.trim()) errs.push('Nama belakang');
    if (!f.phone.trim()) errs.push('Telepon');
    return errs;
  };

  const validateStep2 = () => {
    const errs: string[] = [];
    if (!f.street.trim()) errs.push('Nama jalan');
    if (!f.house_number.trim()) errs.push('Nomor rumah');
    if (!f.prov) errs.push('Provinsi');
    if (!f.city) errs.push('Kota');
    if (!f.dist) errs.push('Kecamatan');
    if (!f.vill.trim()) errs.push('Kel/Desa');
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
    const addr = `${f.house_number} ${f.street}, ${f.vill}, RT ${f.rt}/RW ${f.rw}, Kec. ${f.distName}, ${f.cityName}, ${f.provName}`;
    supabase.from('customer_profiles').upsert({
      user_id: userId, email: userEmail, full_name: `${f.fn} ${f.ln}`,
      first_name: f.fn, last_name: f.ln, phone: f.phone,
      street: `${f.house_number} ${f.street}`,
      house_number: f.house_number,
      address: addr,
      city: f.cityName, province: f.provName, postal_code: f.postal,
      rt: f.rt, rw: f.rw,
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

  const inputStyle = "w-full bg-white border border-ink/10 focus:border-rose rounded-lg py-2.5 px-3.5 text-xs font-medium text-ink outline-none placeholder:text-ink/20 transition-colors";

  const steps = [
    { id: 1, label: 'Identitas Diri', icon: User },
    { id: 2, label: 'Alamat Lengkap', icon: MapPin },
  ];

  return (
    <main className={cn(
      "min-h-screen bg-cr selection:bg-ink selection:text-white flex flex-col items-center justify-start pt-8 md:pt-16 px-4 pb-6",
      isIPhone && "pt-[env(safe-area-inset-top)]"
    )}>
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose/10 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-rose" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-ink uppercase tracking-wider">Lengkapi Data</p>
            <p className="text-[9px] text-ink/30 uppercase tracking-widest">Step {activeStep} of 2</p>
          </div>
        </div>
        <button onClick={logout} className="text-[9px] text-ink/30 hover:text-rose uppercase tracking-wider flex items-center gap-1.5">
          <LogOut size={12} />Batal
        </button>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-5">
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
                  className="w-8 h-8 rounded-lg border-2 flex items-center justify-center"
                >
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={1.5} />}
                </motion.div>
                <span className={cn("text-[9px] font-medium uppercase tracking-wider", isActive || isCompleted ? "text-rose" : "text-ink/30")}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn("flex-1 h-px max-w-[32px]", isCompleted ? "bg-rose" : "bg-ink/10")} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Email Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-2.5 mb-4"
        >
          <CheckCircle size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[10px] font-medium text-emerald-700 truncate">{userEmail}</span>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {activeStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="p-4 space-y-3"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                  <span className="text-[8px] font-bold text-rose bg-rose/10 px-1.5 py-0.5 rounded uppercase tracking-widest">01</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ink">Identitas Diri</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Nama Depan</label>
                    <input value={f.fn} onChange={e => set('fn', e.target.value)} className={inputStyle} placeholder="John" />
                  </div>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Nama Belakang</label>
                    <input value={f.ln} onChange={e => set('ln', e.target.value)} className={inputStyle} placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Nomor Telepon</label>
                  <input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} className={inputStyle} placeholder="081234567890" />
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="w-full bg-ink text-white py-3 rounded-lg text-[10px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose transition-colors mt-1"
                >
                  <span>Lanjut ke Alamat</span>
                  <ArrowRight size={12} />
                </button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {activeStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="p-4 space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                  <span className="text-[8px] font-bold text-rose bg-rose/10 px-1.5 py-0.5 rounded uppercase tracking-widest">02</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ink">Alamat Lengkap</span>
                </div>

                {/* Section: Detail Jalan */}
                <Section icon={Home} label="Detail Jalan" defaultOpen>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Nama Jalan / Jalan</label>
                    <input value={f.street} onChange={e => set('street', e.target.value)} className={inputStyle} placeholder="Jl. Asia Afrika" />
                  </div>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Nomor Rumah</label>
                    <input value={f.house_number} onChange={e => set('house_number', e.target.value)} className={inputStyle} placeholder="No. 22" />
                  </div>
                </Section>

                {/* Section: Lokasi Wilayah */}
                <Section icon={MapPinned} label="Lokasi Wilayah" defaultOpen>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Provinsi</label>
                    <CustomDropdown value={f.prov} options={provinces} onChange={(id) => set('prov', id)} placeholder="Pilih Provinsi" searchable />
                  </div>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Kota / Kabupaten</label>
                    <CustomDropdown value={f.city} options={regencies} onChange={(id) => set('city', id)} placeholder="Pilih Kota/Kabupaten" disabled={!f.prov} searchable />
                  </div>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Kecamatan</label>
                    <CustomDropdown value={f.dist} options={districts} onChange={(id) => set('dist', id)} placeholder="Pilih Kecamatan" disabled={!f.city} searchable />
                  </div>
                </Section>

                {/* Section: Detail Lainnya */}
                <Section icon={MapPin} label="Detail Lainnya" defaultOpen>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Kel / Desa</label>
                    <input value={f.vill} onChange={e => set('vill', e.target.value)} className={inputStyle} placeholder="Sukajadi" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">RT</label>
                      <input value={f.rt} onChange={e => set('rt', e.target.value)} className={inputStyle} placeholder="001" />
                    </div>
                    <div>
                      <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">RW</label>
                      <input value={f.rw} onChange={e => set('rw', e.target.value)} className={inputStyle} placeholder="005" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-medium uppercase tracking-wider text-ink/50 mb-1.5 block">Kode Pos</label>
                    <input value={f.postal} onChange={e => set('postal', e.target.value)} className={inputStyle} placeholder="40111" />
                  </div>
                </Section>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="flex-1 bg-ink/5 text-ink py-3 rounded-lg text-[10px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink/10 transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-ink text-white py-3 rounded-lg text-[10px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><span>Simpan</span><ArrowRight size={12} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-white border border-ink/5 flex items-center justify-center shadow-sm">
              <Shield size={10} strokeWidth={1.5} className="text-rose/60" />
            </div>
            <span className="text-[8px] font-medium uppercase tracking-wider text-ink">Aman</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-white border border-ink/5 flex items-center justify-center shadow-sm">
              <Lock size={10} strokeWidth={1.5} className="text-rose/60" />
            </div>
            <span className="text-[8px] font-medium uppercase tracking-wider text-ink">Enkripsi</span>
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
              <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={20} className="text-rose" />
              </div>
              <h3 className="text-sm font-semibold text-center mb-1 text-ink">Data Belum Lengkap</h3>
              <p className="text-[10px] text-ink/50 text-center mb-4">Pastikan semua field terisi</p>
              <ul className="space-y-1 mb-4">
                {errors.map(e => (
                  <li key={e} className="text-[10px] text-ink/60 flex items-center gap-2">
                    <div className="w-1 h-1 bg-rose rounded-full shrink-0" />{e}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowError(false)}
                className="w-full py-2.5 bg-ink text-white rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-rose transition-colors"
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