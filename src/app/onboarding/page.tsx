"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Package, CheckCircle, AlertTriangle, X, Shield, Lock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ValidationError {
  field: string;
  message: string;
}

function validateForm(data: Record<string, string>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.first_name.trim()) errors.push({ field: 'first_name', message: 'Nama Depan wajib diisi' });
  if (!data.last_name.trim()) errors.push({ field: 'last_name', message: 'Nama Belakang wajib diisi' });
  if (!data.phone.trim()) errors.push({ field: 'phone', message: 'Nomor Telepon wajib diisi' });
  if (!data.street.trim()) errors.push({ field: 'street', message: 'Nama Jalan wajib diisi' });
  if (!data.house_number.trim()) errors.push({ field: 'house_number', message: 'No. Rumah wajib diisi' });
  if (!data.rt.trim()) errors.push({ field: 'rt', message: 'RT wajib diisi' });
  if (!data.rw.trim()) errors.push({ field: 'rw', message: 'RW wajib diisi' });
  if (!data.city.trim()) errors.push({ field: 'city', message: 'Kota wajib diisi' });
  if (!data.province.trim()) errors.push({ field: 'province', message: 'Provinsi wajib diisi' });
  if (!data.postal_code.trim()) errors.push({ field: 'postal_code', message: 'Kode Pos wajib diisi' });
  return errors;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '',
    street: '', house_number: '', rt: '', rw: '',
    kelurahan: '', kecamatan: '', city: '', province: '', postal_code: '',
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      setUserEmail(user.email || '');
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const nameParts = googleName.split(' ');
      setFormData(prev => ({
        ...prev,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
      }));
      const { data: existingProfile } = await supabase.from('customer_profiles').select('*').eq('user_id', user.id).single();
      if (existingProfile) { router.push('/profile'); return; }
      setIsLoading(false);
    };
    checkUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (errors.length > 0) { setValidationErrors(errors); setShowErrorPopup(true); return; }
    setIsSaving(true);
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    const fullAddress = `${formData.street} No. ${formData.house_number}, RT ${formData.rt}/RW ${formData.rw}, Kel. ${formData.kelurahan}, Kec. ${formData.kecamatan}`;
    try {
      const { error } = await supabase.from('customer_profiles').upsert({
        user_id: userId, email: userEmail, full_name: fullName,
        first_name: formData.first_name, last_name: formData.last_name,
        phone: formData.phone, address: fullAddress,
        street: formData.street, house_number: formData.house_number,
        rt: formData.rt, rw: formData.rw, kelurahan: formData.kelurahan,
        kecamatan: formData.kecamatan, city: formData.city,
        province: formData.province, postal_code: formData.postal_code,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      router.push('/profile');
    } catch (err: unknown) {
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <main className="min-h-screen bg-white flex items-center justify-center"><div className="w-6 h-6 border-2 border-ink/10 border-t-rose rounded-full animate-spin" /></main>;
  }

  const inputClass = "w-full bg-ink/[0.03] border border-ink/5 focus:border-rose rounded-lg py-2 px-3 text-[10px] font-medium text-ink outline-none placeholder:text-ink/20";
  const labelClass = "text-[7px] font-medium uppercase tracking-[0.15em] text-ink/30 mb-1";

  return (
    <main className="min-h-screen bg-cr selection:bg-ink selection:text-white flex flex-col">
      {/* HEADER - Compact */}
      <header className="bg-white/80 backdrop-blur-md border-b border-ink/5 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-rose/10 rounded-lg flex items-center justify-center">
            <Package size={12} className="text-rose" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-ink">NINOC Archive</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-[8px] font-medium uppercase tracking-widest text-ink/30 hover:text-rose">
          <LogOut size={11} /> Batal
        </button>
      </header>

      {/* FORM - Single screen, no scroll */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-3xl bg-white rounded-xl border border-ink/5 shadow-dashboard overflow-hidden">
          {/* Auth badge */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2 flex items-center gap-2">
            <CheckCircle size={11} className="text-emerald-500" />
            <span className="text-[9px] font-medium text-emerald-700">{userEmail}</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* 01 - Identitas */}
            <div>
              <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-rose mb-3">01 — Identitas</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Nama Depan</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} placeholder="john" />
                </div>
                <div>
                  <label className={labelClass}>Nama Belakang</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} placeholder="doe" />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Nomor Telepon</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="081234567890" />
                </div>
              </div>
            </div>

            {/* 02 - Alamat */}
            <div className="pt-3 border-t border-ink/5">
              <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-rose mb-3">02 — Alamat Pengiriman</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Nama Jalan</label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange} className={inputClass} placeholder="jl. / komp. / gg." />
                </div>
                <div className="grid grid-cols-6 gap-3">
                  <div>
                    <label className={labelClass}>No. Rumah</label>
                    <input type="text" name="house_number" value={formData.house_number} onChange={handleChange} className={inputClass} placeholder="10a" />
                  </div>
                  <div>
                    <label className={labelClass}>RT</label>
                    <input type="text" name="rt" value={formData.rt} onChange={handleChange} className={inputClass} placeholder="001" />
                  </div>
                  <div>
                    <label className={labelClass}>RW</label>
                    <input type="text" name="rw" value={formData.rw} onChange={handleChange} className={inputClass} placeholder="005" />
                  </div>
                  <div>
                    <label className={labelClass}>Kelurahan</label>
                    <input type="text" name="kelurahan" value={formData.kelurahan} onChange={handleChange} className={inputClass} placeholder="sukajadi" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Kecamatan</label>
                    <input type="text" name="kecamatan" value={formData.kecamatan} onChange={handleChange} className={inputClass} placeholder="coblong" />
                  </div>
                </div>
              </div>
            </div>

            {/* 03 - Wilayah */}
            <div className="pt-3 border-t border-ink/5">
              <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-rose mb-3">03 — Wilayah</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Kota</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} placeholder="bandung" />
                </div>
                <div>
                  <label className={labelClass}>Provinsi</label>
                  <input type="text" name="province" value={formData.province} onChange={handleChange} className={inputClass} placeholder="jawa barat" />
                </div>
                <div>
                  <label className={labelClass}>Kode Pos</label>
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className={inputClass} placeholder="40123" />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-3 text-ink/20">
                    <Shield size={11} /><Lock size={11} />
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <button type="submit" disabled={isSaving} className="w-full bg-ink text-white py-3.5 rounded-lg text-[9px] font-medium uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose transition-all disabled:opacity-50">
              <span>{isSaving ? 'Saving...' : 'Save & Continue'}</span>
              {!isSaving && <ArrowRight size={12} />}
            </button>
          </form>
        </div>
      </div>

      {/* ERROR POPUP */}
      <AnimatePresence>
        {showErrorPopup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowErrorPopup(false)} className="fixed inset-0 bg-ink/50 z-[200]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-xl p-5 z-[201] shadow-2xl">
              <button onClick={() => setShowErrorPopup(false)} className="absolute top-2 right-2 text-ink/30 hover:text-ink"><X size={14} /></button>
              <div className="w-10 h-10 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={16} className="text-rose" />
              </div>
              <h3 className="text-sm font-medium text-ink text-center uppercase mb-3">Validation Error</h3>
              <ul className="space-y-1.5 mb-4">
                {validationErrors.map(err => (
                  <li key={err.field} className="text-[9px] text-ink/60">• {err.message}</li>
                ))}
              </ul>
              <button onClick={() => setShowErrorPopup(false)} className="w-full py-2.5 bg-ink text-white rounded-lg text-[8px] font-medium uppercase tracking-widest">Got it</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}