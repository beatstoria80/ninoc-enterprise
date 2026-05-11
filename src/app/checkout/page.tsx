"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShoppingBag, ArrowLeft, Lock, Verified, Shield } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    street: '',
    house_number: '',
    rt: '',
    rw: '',
    kelurahan: '',
    kecamatan: '',
    city: '',
    province: '',
    postal_code: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.id);
        setFormData(prev => ({ ...prev, email: user.email || '' }));
        const { data: profile } = await supabase.from('customer_profiles').select('*').eq('user_id', user.id).single();
        if (profile) {
          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: user.email || '',
            phone: profile.phone || '',
            street: profile.street || '',
            house_number: profile.house_number || '',
            rt: profile.rt || '',
            rw: profile.rw || '',
            kelurahan: profile.kelurahan || '',
            kecamatan: profile.kecamatan || '',
            city: profile.city || '',
            province: profile.province || '',
            postal_code: profile.postal_code || ''
          });
        }
      }
    };
    fetchProfile();
  }, []);

  const shippingOptions = [
    { id: 'jne', name: 'JNE', price: 15000, etd: '2-3D' },
    { id: 'jnt', name: 'J&T', price: 12000, etd: '1-2D' },
    { id: 'sicepat', name: 'SiCepat', price: 18000, etd: '1D' },
  ];

  const handleShippingChange = (id: string, price: number) => {
    setShippingMethod(id);
    setShippingCost(price);
  };

  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [villages, setVillages] = useState<{id: string, name: string}[]>([]);

  const [loadingLoc, setLoadingLoc] = useState({ p: false, c: false, d: false, v: false });

  // Static fallback provinces (defined before useEffect to avoid stale closure / ref-before-declare issues)
  const FALLBACK_PROVINCES = [
    { id: '31', name: 'DKI JAKARTA' },
    { id: '32', name: 'JAWA BARAT' },
    { id: '33', name: 'JAWA TENGAH' },
    { id: '35', name: 'JAWA TIMUR' },
    { id: '36', name: 'BANTEN' },
    { id: '51', name: 'BALI' },
    { id: '11', name: 'ACEH' },
    { id: '12', name: 'SUMATERA UTARA' },
    { id: '13', name: 'SUMATERA BARAT' },
    { id: '16', name: 'SUMATERA SELATAN' },
    { id: '73', name: 'SULAWESI SELATAN' }
  ];

  // Fetch Provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingLoc(prev => ({ ...prev, p: true }));
      try {
        const res = await fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setProvinces(data && data.length > 0 ? data : FALLBACK_PROVINCES);
      } catch (e) {
        console.error("Province fetch failed:", e);
        setProvinces(FALLBACK_PROVINCES);
      }
      setLoadingLoc(prev => ({ ...prev, p: false }));
    };
    fetchProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Cities when Province changes
  const handleProvinceChange = async (name: string) => {
    const province = provinces.find(p => p.name === name);
    // Reset semua downstream + update formData synchronously
    setFormData(prev => ({ ...prev, province: name, city: '', kecamatan: '', kelurahan: '' }));
    setCities([]); setDistricts([]); setVillages([]);

    if (!province) {
      console.warn('[handleProvinceChange] Province not found for name:', name);
      return;
    }

    console.log('[handleProvinceChange] Fetching regencies for province:', province.name, 'id:', province.id);
    setLoadingLoc(prev => ({ ...prev, c: true }));

    try {
      const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${province.id}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[handleProvinceChange] Received cities count:', data?.length);
      setCities(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[handleProvinceChange] Fetch failed:', e);
    } finally {
      setLoadingLoc(prev => ({ ...prev, c: false }));
    }
  };

  // Fetch Districts when City changes
  const handleCityChange = async (name: string) => {
    const city = cities.find(c => c.name === name);
    // Reset downstream + update formData synchronously
    setFormData(prev => ({ ...prev, city: name, kecamatan: '', kelurahan: '' }));
    setDistricts([]); setVillages([]);

    if (!city) {
      console.warn('[handleCityChange] City not found for name:', name);
      return;
    }

    console.log('[handleCityChange] Fetching districts for city:', city.name, 'id:', city.id);
    setLoadingLoc(prev => ({ ...prev, d: true }));

    try {
      const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${city.id}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[handleCityChange] Received districts count:', data?.length);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[handleCityChange] Fetch failed:', e);
    } finally {
      setLoadingLoc(prev => ({ ...prev, d: false }));
    }
  };

  // Fetch Villages when District changes
  const handleDistrictChange = async (name: string) => {
    const district = districts.find(d => d.name === name);
    // Reset downstream + update formData synchronously
    setFormData(prev => ({ ...prev, kecamatan: name, kelurahan: '' }));
    setVillages([]);

    if (!district) {
      console.warn('[handleDistrictChange] District not found for name:', name);
      return;
    }

    console.log('[handleDistrictChange] Fetching villages for district:', district.name, 'id:', district.id);
    setLoadingLoc(prev => ({ ...prev, v: true }));

    try {
      const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/villages/${district.id}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[handleDistrictChange] Received villages count:', data?.length);
      setVillages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[handleDistrictChange] Fetch failed:', e);
    } finally {
      setLoadingLoc(prev => ({ ...prev, v: false }));
    }
  };

  const subtotal = totalPrice();
  const finalTotal = subtotal + shippingCost;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingMethod) return;
    setIsProcessing(true);
    const fullAddress = `${formData.street} No. ${formData.house_number}, RT ${formData.rt}/RW ${formData.rw}, Kel. ${formData.kelurahan}, Kec. ${formData.kecamatan}, ${formData.city}, ${formData.province} ${formData.postal_code}`;
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerDetails: { ...formData, user_id: userId, name: fullName, address: fullAddress },
          shippingDetails: { method: shippingMethod, cost: shippingCost },
          totalPrice: finalTotal
        })
      });
      const data = await response.json();
      if (data.token) {
        // @ts-expect-error - Midtrans Snap
        window.snap.pay(data.token, {
          onSuccess: () => { clearCart(); router.push('/payment/success'); },
          onError: () => { setIsProcessing(false); alert('Payment failed.'); },
          onClose: () => { setIsProcessing(false); }
        });
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

   
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cr flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-display font-medium italic uppercase">Archive Empty</h2>
        <Link href="/shop" className="bg-ink text-white px-8 py-3 rounded-lg text-xs tracking-widest">Back to Shop</Link>
      </div>
    );
  }

  const inputClass = "w-full bg-white py-2 px-3 text-[10px] font-medium text-ink outline-none transition-all placeholder:text-ink/10 relative z-50";
  const selectClass = "w-full bg-white py-2 px-3 text-[10px] font-medium text-ink outline-none transition-all cursor-pointer border border-ink/10 rounded-md relative z-50";
  const labelClass = "text-[8px] font-medium uppercase tracking-[0.1em] text-ink/80 mb-1 block relative z-50";

  return (
    <main className="min-h-screen bg-cr">
      {/* STUDIO EXIT NAV - STATIC */}
      <nav className="fixed top-0 inset-x-0 z-[150] px-6 md:px-12 py-5 flex items-center justify-between glass border-b border-ink/10">
        <button 
          onClick={() => router.push('/shop')} 
          className="group flex items-center gap-3 text-ink transition-all"
        >
          <div className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center group-hover:border-rose group-hover:text-rose transition-colors">
            <ArrowLeft size={14} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">Return to</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink group-hover:text-rose transition-colors">Archive Catalog</span>
          </div>
        </button>
        <div className="font-display font-medium text-2xl italic tracking-tighter text-rose absolute left-1/2 -translate-x-1/2 uppercase select-none">NINOC</div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end leading-none mr-2">
              <span className="text-[7px] font-medium uppercase tracking-widest text-emerald-600">Auth Channel</span>
              <span className="text-[9px] font-medium uppercase tracking-tighter text-ink/60">Secure Payment</span>
           </div>
           <ShieldCheck size={18} className="text-emerald-500" />
        </div>
      </nav>

      <div className="pt-24 px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-[1600px] mx-auto relative z-10">
        {/* FORM AREA */}
        <div className="lg:col-span-6 space-y-8 relative z-10">
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8">
            
            {/* 01: IDENTITY */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-ink/10 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display font-medium italic text-ink/40">01</span>
                  <h2 className="text-[11px] font-display font-medium italic uppercase tracking-widest text-ink">Identity Authorization</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-[1px] bg-ink/10 border border-ink/10 overflow-hidden rounded-lg shadow-sm">
                <div className="bg-white p-3">
                  <label className={labelClass}>First Name</label>
                  <input required type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className={inputClass} placeholder="john" />
                </div>
                <div className="bg-white p-3 border-l border-ink/10">
                  <label className={labelClass}>Last Name</label>
                  <input required type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className={inputClass} placeholder="doe" />
                </div>
                <div className="bg-white p-3 border-t border-ink/10">
                  <label className={labelClass}>Email Archive</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="mail@archive.com" />
                </div>
                <div className="bg-white p-3 border-t border-l border-ink/10">
                  <label className={labelClass}>Phone Reference</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="08..." />
                </div>
              </div>
            </section>

            {/* 02: ADDRESS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-ink/10 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display font-medium italic text-ink/40">02</span>
                  <h2 className="text-[11px] font-display font-medium italic uppercase tracking-widest text-ink">Shipping Target</h2>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-[1px] bg-ink/10 border border-ink/10 overflow-hidden rounded-lg shadow-sm">
                <div className="col-span-6 bg-white p-3">
                  <label className={labelClass}>Street / Building / Archive Loc.</label>
                  <input required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className={inputClass} placeholder="jl. merdeka" />
                </div>
                
                <div className="col-span-2 bg-white p-3 border-t border-ink/10">
                  <label className={labelClass}>No</label>
                  <input required type="text" value={formData.house_number} onChange={(e) => setFormData({...formData, house_number: e.target.value})} className={inputClass} placeholder="10" />
                </div>
                <div className="col-span-2 bg-white p-3 border-t border-l border-ink/10">
                  <label className={labelClass}>RT</label>
                  <input required type="text" value={formData.rt} onChange={(e) => setFormData({...formData, rt: e.target.value})} className={inputClass} placeholder="01" />
                </div>
                <div className="col-span-2 bg-white p-3 border-t border-l border-ink/10">
                  <label className={labelClass}>RW</label>
                  <input required type="text" value={formData.rw} onChange={(e) => setFormData({...formData, rw: e.target.value})} className={inputClass} placeholder="05" />
                </div>

                <div className="col-span-3 bg-white p-3 border-t border-ink/10 relative group">
                  <label className={labelClass}>Province {loadingLoc.p && <span className="animate-pulse text-rose">...</span>}</label>
                  <select required value={formData.province} onChange={(e) => handleProvinceChange(e.target.value)} className={selectClass}>
                    <option value="">SELECT PROVINCE</option>
                    {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3 bg-white p-3 border-t border-l border-ink/10 relative group">
                  <label className={labelClass}>City {loadingLoc.c && <span className="animate-pulse text-rose">...</span>}</label>
                  <select required value={formData.city} onChange={(e) => handleCityChange(e.target.value)} className={selectClass} disabled={!formData.province}>
                    <option value="">SELECT CITY</option>
                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3 bg-white p-3 border-t border-ink/10 relative group">
                  <label className={labelClass}>Kecamatan {loadingLoc.d && <span className="animate-pulse text-rose">...</span>}</label>
                  <select required value={formData.kecamatan} onChange={(e) => handleDistrictChange(e.target.value)} className={selectClass} disabled={!formData.city}>
                    <option value="">SELECT KECAMATAN</option>
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3 bg-white p-3 border-t border-l border-ink/10 relative group">
                  <label className={labelClass}>Kelurahan {loadingLoc.v && <span className="animate-pulse text-rose">...</span>}</label>
                  <select required value={formData.kelurahan} onChange={(e) => setFormData({...formData, kelurahan: e.target.value})} className={selectClass} disabled={!formData.kecamatan}>
                    <option value="">SELECT KELURAHAN</option>
                    {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 03: SHIPPING */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-ink/10 pb-1">
                <span className="text-[10px] font-display font-medium italic text-ink/40">03</span>
                <h2 className="text-[11px] font-display font-medium italic uppercase tracking-widest text-ink">Logistics Partner</h2>
              </div>

              <div className="grid grid-cols-3 gap-[1px] bg-ink/10 border border-ink/10 overflow-hidden rounded-lg shadow-sm">
                {shippingOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleShippingChange(option.id, option.price)}
                    className={cn(
                      "flex flex-col items-center py-3 px-1 transition-all bg-white",
                      shippingMethod === option.id ? "bg-rose/[0.03]" : "hover:bg-ink/[0.02]"
                    )}
                  >
                    <span className={cn("text-[9px] font-medium uppercase tracking-widest", shippingMethod === option.id ? "text-rose" : "text-ink/60")}>{option.name}</span>
                    <span className="text-xs font-display font-medium italic text-ink">Rp {option.price.toLocaleString('id-ID')}</span>
                  </button>
                ))}
              </div>
            </section>
          </form>
        </div>

        {/* TRUSTED SUMMARY AREA */}
        <div className="lg:col-span-4 lg:pl-12">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white border border-ink/10 rounded-2xl p-8 space-y-8 shadow-2xl shadow-ink/5">
              <div className="flex justify-between items-center border-b border-ink/5 pb-3">
                <div className="flex items-center gap-3">
                   <ShoppingBag size={14} className="text-ink/30" />
                   <h3 className="text-[10px] font-medium uppercase tracking-widest text-ink">Order Archive</h3>
                </div>
                <span className="text-[9px] font-medium text-ink/60 italic">{items.length} Pieces</span>
              </div>

              <div className="space-y-4 max-h-[25vh] overflow-y-auto no-scrollbar pr-2">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center group">
                    <div className="w-10 h-10 bg-ink/5 rounded-lg overflow-hidden flex-shrink-0 border border-ink/5 group-hover:border-rose/20 transition-colors relative">
                      {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase truncate text-ink">{item.name}</p>
                      <p className="text-[8px] font-medium text-ink/30 uppercase tracking-tighter">Size {item.size} • Qty {item.quantity}</p>
                    </div>
                    <p className="text-xs font-display font-medium italic text-ink/80">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-ink/5">
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-ink/80">
                  <span>Value Subtotal</span>
                  <span className="text-ink">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-ink/80">
                  <span>Logistics Archive</span>
                  <span className={cn("font-medium italic", shippingCost > 0 ? "text-ink" : "text-rose")}>
                     {shippingCost > 0 ? `+ Rp ${shippingCost.toLocaleString('id-ID')}` : 'Action Required'}
                  </span>
                </div>
              </div>

              <div className="pt-8 flex flex-col items-center border-t border-ink/5">
                <span className="text-[9px] font-medium uppercase tracking-[0.6em] text-ink/60 mb-2">Total Investment</span>
                <span className="text-3xl font-display font-medium italic text-rose leading-none drop-shadow-sm">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="space-y-4">
                <button 
                  form="checkout-form"
                  disabled={isProcessing || !shippingMethod}
                  className={cn(
                    "w-full py-4 rounded-xl text-[10px] font-medium uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-3",
                    isProcessing || !shippingMethod 
                      ? "bg-ink/5 text-ink/20 cursor-not-allowed" 
                      : "bg-ink text-white hover:bg-rose shadow-xl shadow-ink/10 active:scale-95"
                  )}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock size={12} />
                      <span>Authorize Payment</span>
                    </div>
                  )}
                </button>

                {/* Professional Trust Bar */}
                <div className="flex justify-center gap-8 pt-2">
                  <div className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.2em] text-ink/30">
                    <Shield size={10} strokeWidth={1.5} className="text-rose/40" />
                    <span>Aman</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.2em] text-ink/30">
                    <Lock size={10} strokeWidth={1.5} className="text-rose/40" />
                    <span>Enkripsi</span>
                  </div>
                </div>
                
                {/* TRUST SIGNALS */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="flex flex-col items-center gap-2 border border-ink/5 rounded-lg py-3">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="text-[7px] font-medium uppercase tracking-widest text-ink/40">Encrypted</span>
                   </div>
                   <div className="flex flex-col items-center gap-2 border border-ink/5 rounded-lg py-3">
                      <Verified size={14} className="text-emerald-500" />
                      <span className="text-[7px] font-medium uppercase tracking-widest text-ink/40">Verified</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 opacity-40">
               <div className="flex items-center gap-6 grayscale">
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Visa_2021.svg" alt="Visa" width={40} height={10} className="h-2 w-auto" unoptimized />
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={40} height={20} className="h-4 w-auto" unoptimized />
                  <Image src="https://midtrans.com/assets/img/midtrans-logo.svg" alt="Midtrans" width={60} height={15} className="h-3 w-auto" unoptimized />
               </div>
               <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-center text-ink">
                  Secured by 256-bit SSL Encryption • Official Merchant Partner
               </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
