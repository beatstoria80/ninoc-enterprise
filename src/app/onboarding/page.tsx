"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Building, Mail as MailIcon, ArrowRight, Package, CheckCircle, AlertTriangle, X, Home, Hash, Shield, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  if (!data.street.trim()) errors.push({ field: 'street', message: 'Nama Jalan wajib diisi (contoh: Jl. Merdeka)' });
  if (!data.house_number.trim()) errors.push({ field: 'house_number', message: 'Nomor Rumah wajib diisi (contoh: No. 10)' });
  if (!data.rt.trim()) errors.push({ field: 'rt', message: 'RT wajib diisi (contoh: 01)' });
  if (!data.rw.trim()) errors.push({ field: 'rw', message: 'RW wajib diisi (contoh: 05)' });
  if (!data.kelurahan.trim()) errors.push({ field: 'kelurahan', message: 'Kelurahan/Desa wajib diisi' });
  if (!data.kecamatan.trim()) errors.push({ field: 'kecamatan', message: 'Kecamatan wajib diisi' });
  if (!data.city.trim()) errors.push({ field: 'city', message: 'Kota/Kabupaten wajib diisi' });
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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    street: '',
    house_number: '',
    rt: '',
    rw: '',
    kelurahan: '',
    kecamatan: '',
    city: '',
    province: '',
    postal_code: '',
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || '');

      // Pre-fill name from Google
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const nameParts = googleName.split(' ');
      setFormData(prev => ({
        ...prev,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
      }));

      const { data: existingProfile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        router.push('/profile');
        return;
      }

      setIsLoading(false);
    };

    checkUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowErrorPopup(true);
      return;
    }

    setIsSaving(true);

    // Compose full address for backward compatibility & resi/invoice
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    const fullAddress = `${formData.street} No. ${formData.house_number}, RT ${formData.rt}/RW ${formData.rw}, Kel. ${formData.kelurahan}, Kec. ${formData.kecamatan}`;

    try {
      const { error } = await supabase.from('customer_profiles').upsert({
        user_id: userId,
        email: userEmail,
        avatar_url: avatarUrl,
        full_name: fullName,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: fullAddress,
        street: formData.street,
        house_number: formData.house_number,
        rt: formData.rt,
        rw: formData.rw,
        kelurahan: formData.kelurahan,
        kecamatan: formData.kecamatan,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postal_code,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      router.push('/profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to save profile: ' + message);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/10 border-t-rose rounded-full animate-spin" />
      </main>
    );
  }

  const inputClass = "w-full bg-ink/5 border-2 border-transparent focus:border-rose focus:bg-white rounded-[10px] py-3 pl-11 pr-4 text-sm font-medium text-ink outline-none transition-all placeholder:font-normal placeholder:text-ink/20 placeholder:normal-case";
  const labelClass = "text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 pl-4";

  return (
    <main className="min-h-screen bg-ink/[0.02] selection:bg-ink selection:text-white flex items-center justify-center px-6 py-12 relative overflow-hidden">
      
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-rose/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-ink/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-white rounded-[10px] p-8 md:p-10 shadow-2xl shadow-ink/10 relative z-10 border border-ink/5"
      >
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="w-12 h-12 bg-rose/10 rounded-[10px] flex items-center justify-center text-rose mx-auto">
            <Package size={22} />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-ink uppercase">
            Complete Your <span className="text-rose italic">Profile</span>
          </h1>
          <div className="flex justify-center">
            <Link 
              href="/" 
              className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 hover:text-rose transition-colors"
            >
              Skip for now
            </Link>
          </div>
        </div>

        {/* Auth indicator */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-[10px] p-3 mb-6">
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-emerald-600">Authenticated As</p>
            <p className="text-xs font-medium text-emerald-700">{userEmail}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* === SECTION: IDENTITAS === */}
          <div className="space-y-1 mb-2">
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-rose">01 — Identitas</p>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Nama Depan <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><User size={18} /></div>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} placeholder="john" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Nama Belakang <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><User size={18} /></div>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} placeholder="doe" />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className={labelClass}>Nomor Telepon <span className="text-rose">*</span></label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><Phone size={18} /></div>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="081234567890" />
            </div>
          </div>

          {/* === SECTION: ALAMAT PENGIRIMAN === */}
          <div className="space-y-1 mb-2 pt-4 border-t border-ink/5">
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-rose">02 — Alamat Pengiriman</p>
          </div>

          {/* Nama Jalan */}
          <div className="space-y-1">
            <label className={labelClass}>Nama Jalan <span className="text-rose">*</span></label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><MapPin size={18} /></div>
              <input type="text" name="street" value={formData.street} onChange={handleChange} className={inputClass} placeholder="jl. / komp. / gg. / perum." />
            </div>
          </div>

          {/* No. Rumah + RT + RW */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className={labelClass}>No. Rumah <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><Home size={18} /></div>
                <input type="text" name="house_number" value={formData.house_number} onChange={handleChange} className={inputClass} placeholder="10a" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>RT <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><Hash size={18} /></div>
                <input type="text" name="rt" value={formData.rt} onChange={handleChange} className={inputClass} placeholder="001" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>RW <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><Hash size={18} /></div>
                <input type="text" name="rw" value={formData.rw} onChange={handleChange} className={inputClass} placeholder="005" />
              </div>
            </div>
          </div>

          {/* Kelurahan + Kecamatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Kelurahan / Desa <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><Building size={18} /></div>
                <input type="text" name="kelurahan" value={formData.kelurahan} onChange={handleChange} className={inputClass} placeholder="sukajadi" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Kecamatan <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><Building size={18} /></div>
                <input type="text" name="kecamatan" value={formData.kecamatan} onChange={handleChange} className={inputClass} placeholder="coblong" />
              </div>
            </div>
          </div>

          {/* === SECTION: WILAYAH === */}
          <div className="space-y-1 mb-2 pt-4 border-t border-ink/5">
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-rose">03 — Wilayah</p>
          </div>

          {/* Kota + Provinsi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Kota / Kabupaten <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><Building size={18} /></div>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} placeholder="bandung" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Provinsi <span className="text-rose">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><MapPin size={18} /></div>
                <input type="text" name="province" value={formData.province} onChange={handleChange} className={inputClass} placeholder="jawa barat" />
              </div>
            </div>
          </div>

          {/* Kode Pos */}
          <div className="space-y-1 max-w-xs">
            <label className={labelClass}>Kode Pos <span className="text-rose">*</span></label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"><MailIcon size={18} /></div>
              <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className={inputClass} placeholder="40123" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-ink text-white py-5 rounded-[10px] text-[11px] font-medium uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-rose transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group mt-6"
          >
            <span>{isSaving ? 'Saving...' : 'Save & Continue'}</span>
            {!isSaving && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          {/* Security Trust Badge */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-ink/25">
                <Shield size={14} />
                <span className="text-[9px] font-medium uppercase tracking-[0.15em]">SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink/25">
                <Lock size={14} />
                <span className="text-[9px] font-medium uppercase tracking-[0.15em]">Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink/25">
                <CheckCircle size={14} />
                <span className="text-[9px] font-medium uppercase tracking-[0.15em]">Verified</span>
              </div>
            </div>
            <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-ink/15 text-center">
              Your data is protected with industry-standard encryption. We never share your information with third parties.
            </p>
          </div>
        </form>
      </motion.div>

      {/* ============================================== */}
      {/* VALIDATION POP-UP OVERLAY (ANIMATED)          */}
      {/* ============================================== */}
      <AnimatePresence>
        {showErrorPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowErrorPopup(false)}
              className="fixed inset-0 bg-ink/70 backdrop-blur-md z-[300]"
            />

            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white rounded-[10px] p-8 md:p-12 z-[301] shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <button
                onClick={() => setShowErrorPopup(false)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center hover:bg-ink/5 rounded-full transition-all text-ink/30 hover:text-ink"
              >
                <X size={20} />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
                className="w-16 h-16 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <AlertTriangle size={28} className="text-rose" />
              </motion.div>

              <h3 className="text-xl md:text-2xl font-display font-medium text-ink text-center uppercase tracking-tight">
                Data Belum <span className="text-rose italic">Lengkap</span>
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 text-center mt-2 mb-8">
                Lengkapi semua field berikut agar data resi & invoice akurat
              </p>

              <div className="space-y-3 mb-8">
                {validationErrors.map((err, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="flex items-center gap-3 bg-rose/5 border border-rose/10 rounded-[10px] p-4"
                  >
                    <div className="w-6 h-6 bg-rose/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <X size={12} className="text-rose" />
                    </div>
                    <span className="text-xs font-medium text-rose">{err.message}</span>
                  </motion.div>
                ))}
              </div>

              <div className="bg-ink/[0.03] border border-ink/5 rounded-[10px] p-6 mb-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Format Alamat untuk Resi & Invoice:</p>
                <div className="text-sm font-medium text-ink leading-relaxed space-y-1">
                  <p>Jl. Merdeka Raya <span className="text-ink/30">— Nama Jalan</span></p>
                  <p>No. 10A <span className="text-ink/30">— No. Rumah</span></p>
                  <p>RT 01 / RW 05 <span className="text-ink/30">— RT & RW</span></p>
                  <p>Kel. Sukajadi <span className="text-ink/30">— Kelurahan</span></p>
                  <p>Kec. Coblong <span className="text-ink/30">— Kecamatan</span></p>
                </div>
              </div>

              <button
                onClick={() => setShowErrorPopup(false)}
                className="w-full bg-ink text-white py-4 rounded-[10px] text-[11px] font-medium uppercase tracking-[0.3em] hover:bg-rose transition-all active:scale-95"
              >
                Perbaiki Data Saya
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
