"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Package, CheckCircle, AlertTriangle, X, Shield, Lock, LogOut, ChevronDown, User, Phone, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ValidationError {
  field: string;
  message: string;
}

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  province_id: string;
  name: string;
}

interface District {
  id: string;
  regency_id: string;
  name: string;
}

function validateForm(data: Record<string, string>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.first_name.trim()) errors.push({ field: 'first_name', message: 'Nama Depan wajib diisi' });
  if (!data.last_name.trim()) errors.push({ field: 'last_name', message: 'Nama Belakang wajib diisi' });
  if (!data.phone.trim()) errors.push({ field: 'phone', message: 'Nomor Telepon wajib diisi' });
  if (!data.province.trim()) errors.push({ field: 'province', message: 'Provinsi wajib dipilih' });
  if (!data.city.trim()) errors.push({ field: 'city', message: 'Kota wajib dipilih' });
  if (!data.district.trim()) errors.push({ field: 'district', message: 'Kecamatan wajib dipilih' });
  if (!data.village.trim()) errors.push({ field: 'village', message: 'Kelurahan/Desa wajib diisi' });
  if (!data.rt.trim()) errors.push({ field: 'rt', message: 'RT wajib diisi' });
  if (!data.rw.trim()) errors.push({ field: 'rw', message: 'RW wajib diisi' });
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

  // Regions data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', phone: '',
    province: '', province_name: '',
    city: '', city_name: '',
    district: '', district_name: '',
    village: '', rt: '', rw: '', postal_code: '',
  });

  // Fetch provinces on mount
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(console.error);
  }, []);

  // Fetch regencies when province changes
  useEffect(() => {
    if (formData.province) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.province}.json`)
        .then(res => res.json())
        .then(data => { setRegencies(data); setDistricts([]); })
        .catch(console.error);
    }
  }, [formData.province]);

  // Fetch districts when regency changes
  useEffect(() => {
    if (formData.city) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${formData.city}.json`)
        .then(res => res.json())
        .then(data => setDistricts(data))
        .catch(console.error);
    }
  }, [formData.city]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = provinces.find(p => p.id === e.target.value);
    setFormData(prev => ({
      ...prev,
      province: e.target.value,
      province_name: selected?.name || '',
      city: '', city_name: '',
      district: '', district_name: ''
    }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = regencies.find(r => r.id === e.target.value);
    setFormData(prev => ({
      ...prev,
      city: e.target.value,
      city_name: selected?.name || '',
      district: '', district_name: ''
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = districts.find(d => d.id === e.target.value);
    setFormData(prev => ({
      ...prev,
      district: e.target.value,
      district_name: selected?.name || ''
    }));
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
    const fullAddress = `${formData.village}, RT ${formData.rt}/RW ${formData.rw}, Kec. ${formData.district_name}, ${formData.city_name}, ${formData.province_name}`;
    try {
      const { error } = await supabase.from('customer_profiles').upsert({
        user_id: userId, email: userEmail, full_name: fullName,
        first_name: formData.first_name, last_name: formData.last_name,
        phone: formData.phone, address: fullAddress,
        street: fullAddress,
        city: formData.city_name, province: formData.province_name,
        postal_code: formData.postal_code,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      router.push('/profile');
    } catch (err) {
      alert('Gagal menyimpan: ' + (err instanceof Error ? err.message : 'Error'));
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <main className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-ink/10 border-t-rose rounded-full animate-spin" /></main>;
  }

  const inputClass = "w-full bg-ink/[0.03] border border-ink/10 focus:border-rose rounded-lg py-3 px-4 text-base text-ink outline-none";
  const selectClass = "w-full bg-ink/[0.03] border border-ink/10 focus:border-rose rounded-lg py-3 px-4 text-base text-ink outline-none appearance-none cursor-pointer";
  const labelClass = "text-sm font-medium text-ink/60 mb-2 block";

  return (
    <main className="min-h-screen bg-cr selection:bg-ink selection:text-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-ink/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center">
            <Package size={18} className="text-rose" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/30">NINOC Archive</p>
            <p className="text-sm font-medium text-ink">Lengkapi Data Diri</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink/40 hover:text-rose hover:bg-rose/5 rounded-lg transition-all">
          <LogOut size={16} /> Batal
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Auth Badge */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Terverifikasi</p>
              <p className="text-sm font-medium text-emerald-700">{userEmail}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section: Identitas */}
            <div className="bg-white rounded-xl border border-ink/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-rose bg-rose/10 px-2 py-1 rounded">01</span>
                <p className="text-sm font-medium uppercase tracking-wider text-rose">Identitas Diri</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nama Depan</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25" />
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} placeholder="John" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Nama Belakang</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Nomor Telepon</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="081234567890" />
                </div>
              </div>
            </div>

            {/* Section: Alamat */}
            <div className="bg-white rounded-xl border border-ink/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-rose bg-rose/10 px-2 py-1 rounded">02</span>
                <p className="text-sm font-medium uppercase tracking-wider text-rose">Alamat Lengkap</p>
              </div>

              {/* Province Dropdown */}
              <div>
                <label className={labelClass}>Provinsi</label>
                <div className="relative">
                  <select value={formData.province} onChange={handleProvinceChange} className={selectClass}>
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                </div>
              </div>

              {/* City Dropdown */}
              <div>
                <label className={labelClass}>Kota / Kabupaten</label>
                <div className="relative">
                  <select value={formData.city} onChange={handleCityChange} disabled={!formData.province} className={selectClass}>
                    <option value="">Pilih Kota/Kabupaten</option>
                    {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                </div>
              </div>

              {/* District Dropdown */}
              <div>
                <label className={labelClass}>Kecamatan</label>
                <div className="relative">
                  <select value={formData.district} onChange={handleDistrictChange} disabled={!formData.city} className={selectClass}>
                    <option value="">Pilih Kecamatan</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
                </div>
              </div>

              {/* Village, RT, RW */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>Kelurahan / Desa</label>
                  <input type="text" name="village" value={formData.village} onChange={handleChange} className={inputClass} placeholder="Sukajadi" />
                </div>
                <div>
                  <label className={labelClass}>RT</label>
                  <input type="text" name="rt" value={formData.rt} onChange={handleChange} className={inputClass} placeholder="001" />
                </div>
                <div>
                  <label className={labelClass}>RW</label>
                  <input type="text" name="rw" value={formData.rw} onChange={handleChange} className={inputClass} placeholder="005" />
                </div>
              </div>

              {/* Postal Code */}
              <div className="max-w-[200px]">
                <label className={labelClass}>Kode Pos</label>
                <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className={inputClass} placeholder="40123" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSaving} className="w-full bg-ink text-white py-4 rounded-xl text-sm font-medium uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose transition-all disabled:opacity-50">
              <span>{isSaving ? 'Menyimpan...' : 'Simpan & Lanjutkan'}</span>
              {!isSaving && <ArrowRight size={16} />}
            </button>

            {/* Trust Badge */}
            <div className="flex justify-center gap-6 py-4">
              <div className="flex items-center gap-2 text-ink/25">
                <Shield size={14} /><span className="text-xs font-medium">Aman</span>
              </div>
              <div className="flex items-center gap-2 text-ink/25">
                <Lock size={14} /><span className="text-xs font-medium">Enkripsi</span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Error Popup */}
      <AnimatePresence>
        {showErrorPopup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowErrorPopup(false)} className="fixed inset-0 bg-ink/50 z-[200]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-xl p-6 z-[201] shadow-2xl">
              <button onClick={() => setShowErrorPopup(false)} className="absolute top-4 right-4 text-ink/30 hover:text-ink"><X size={18} /></button>
              <div className="w-14 h-14 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-rose" />
              </div>
              <h3 className="text-lg font-medium text-ink text-center mb-4">Data Belum Lengkap</h3>
              <ul className="space-y-2 mb-6">
                {validationErrors.map(err => (
                  <li key={err.field} className="text-sm text-ink/60">• {err.message}</li>
                ))}
              </ul>
              <button onClick={() => setShowErrorPopup(false)} className="w-full py-3 bg-ink text-white rounded-lg text-sm font-medium">Mengerti</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}