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
import { useDevice } from './_components/useDevice';
import BottomCTA from './_components/BottomCTA';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LocationItem {
  id: string;
  name: string;
}

// Define Midtrans callback result type
interface MidtransSnapResult {
  transaction_id?: string;
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
}

// Define Snap callbacks
interface SnapCallbacks {
  onSuccess?: (result: MidtransSnapResult) => void;
  onError?: (err: unknown) => void;
  onClose?: () => void;
}

// Static fallback provinces
const FALLBACK_PROVINCES: LocationItem[] = [
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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);

  // Platform detection for mobile-specific UI
  const { isMobile, isIPhone } = useDevice();

  // Mark snap as loaded once window.snap is available (script loaded via layout.tsx)
  useEffect(() => {
    interface WindowWithSnap extends Window {
      snap?: { pay: (token: string, callbacks: unknown) => void };
    }
    const checkSnap = () => {
      if (typeof window !== 'undefined' && (window as WindowWithSnap).snap) {
        setSnapLoaded(true);
      }
    };
    // Check immediately and poll briefly in case script loads after this effect
    checkSnap();
    const timeout = setTimeout(checkSnap, 1000);
    return () => clearTimeout(timeout);
  }, []);

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

  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);

  const [loadingLoc, setLoadingLoc] = useState({ p: false, c: false, d: false, v: false });

  // Fetch Provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingLoc(prev => ({ ...prev, p: true }));
      try {
        const res = await fetch('/api/location/provinces');
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
  }, []);

  // Case-insensitive search to handle API vs Fallback differences
  const findLocationByName = (list: LocationItem[], name: string) => {
    if (!name) return null;
    return list.find(item => item.name.toUpperCase() === name.toUpperCase()) || null;
  };

  // Fetch Cities when Province changes
  const fetchCities = async (provinceName: string) => {
    const province = findLocationByName(provinces, provinceName);
    if (!province) return null;
    setLoadingLoc(prev => ({ ...prev, c: true }));
    try {
      const res = await fetch(`/api/location/regencies?province_id=${province.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCities(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      console.error('[fetchCities] Fetch failed:', e);
      return null;
    } finally {
      setLoadingLoc(prev => ({ ...prev, c: false }));
    }
  };

  const handleProvinceChange = async (name: string) => {
    setFormData(prev => ({ ...prev, province: name, city: '', kecamatan: '', kelurahan: '' }));
    setCities([]); setDistricts([]); setVillages([]);
    if (name) await fetchCities(name);
  };

  // Fetch Districts when City changes
  const fetchDistricts = async (cityName: string, currentCities: LocationItem[]) => {
    const city = findLocationByName(currentCities, cityName);
    if (!city) return null;
    setLoadingLoc(prev => ({ ...prev, d: true }));
    try {
      const res = await fetch(`/api/location/districts?city_id=${city.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDistricts(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      console.error('[fetchDistricts] Fetch failed:', e);
      return null;
    } finally {
      setLoadingLoc(prev => ({ ...prev, d: false }));
    }
  };

  const handleCityChange = async (name: string) => {
    setFormData(prev => ({ ...prev, city: name, kecamatan: '', kelurahan: '' }));
    setDistricts([]); setVillages([]);
    if (name) await fetchDistricts(name, cities);
  };

  // Fetch Villages when District changes
  const fetchVillages = async (districtName: string, currentDistricts: LocationItem[]) => {
    const district = findLocationByName(currentDistricts, districtName);
    if (!district) return null;
    setLoadingLoc(prev => ({ ...prev, v: true }));
    try {
      const res = await fetch(`/api/location/villages?district_id=${district.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVillages(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      console.error('[fetchVillages] Fetch failed:', e);
      return null;
    } finally {
      setLoadingLoc(prev => ({ ...prev, v: false }));
    }
  };

  const handleDistrictChange = async (name: string) => {
    setFormData(prev => ({ ...prev, kecamatan: name, kelurahan: '' }));
    setVillages([]);
    if (name) await fetchVillages(name, districts);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (provinces.length === 0) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('customer_profiles').select('*').eq('user_id', user.id).single();
        if (profile) {
          const newData = {
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
          };
          setFormData(newData);
          
          // Trigger cascading fetches sequentially with proper error handling
          if (newData.province) {
            const loadedCities = await fetchCities(newData.province);
            if (newData.city && Array.isArray(loadedCities)) {
              const loadedDistricts = await fetchDistricts(newData.city, loadedCities);
              if (newData.kecamatan && Array.isArray(loadedDistricts)) {
                await fetchVillages(newData.kecamatan, loadedDistricts);
              }
            }
          }
        } else {
          setFormData(prev => ({ ...prev, email: user.email || '' }));
        }
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces]);

  const shippingOptions = [
    { id: 'jne', name: 'JNE', price: 15000, etd: '2-3D' },
    { id: 'jnt', name: 'J&T', price: 12000, etd: '1-2D' },
    { id: 'sicepat', name: 'SiCepat', price: 18000, etd: '1D' },
  ];

  const handleShippingChange = (id: string, price: number) => {
    setShippingMethod(id);
    setShippingCost(price);
  };

  const subtotal = totalPrice();
  const finalTotal = subtotal + shippingCost;

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shippingMethod) return;

    // Ensure Midtrans script is loaded
    if (!snapLoaded || !(window as Window & { snap?: { pay: (token: string, callbacks: SnapCallbacks) => void } }).snap) {
      alert('Payment system is not ready. Please refresh the page.');
      return;
    }

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

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Validate token exists
      if (!data.token) {
        throw new Error(data.error || 'Payment token not received from server');
      }

      // Open Midtrans Snap popup
      // @ts-expect-error - Midtrans Snap global
      window.snap.pay(data.token, {
        onSuccess: (result: MidtransSnapResult) => {
          console.log('Payment success:', result);
          clearCart();
          router.push('/payment/success');
        },
        onError: (err: unknown) => {
          console.error('Midtrans payment error:', err);
          setIsProcessing(false);
          alert('Payment failed. Please try again or contact support.');
        },
        onClose: () => {
          // User closed popup without completing payment - this is NOT an error
          console.log('Payment popup closed by user');
          setIsProcessing(false);
        }
      });

    } catch (err) {
      console.error('[handleCheckout] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setIsProcessing(false);
      alert(`Checkout failed: ${errorMessage}. Please check your details and try again.`);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const inputClass = "w-full bg-white py-1.5 px-2 text-[10px] font-medium text-ink outline-none transition-all placeholder:text-ink/20";
  const selectClass = "w-full bg-white py-1.5 px-2 text-[10px] font-medium text-ink outline-none transition-all cursor-pointer border border-ink/5 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass = "text-[8px] font-medium uppercase tracking-[0.15em] text-ink/50 mb-0.5 block";

  return (
    <div className={cn(
      "w-full",
      isIPhone && "ios-mobile-layout"
    )}>
      {/* STUDIO EXIT NAV - iOS safe area aware */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-[150] px-6 md:px-12 py-4 md:py-5 flex items-center justify-between glass border-b border-ink/10",
        isIPhone && "pt-[calc(env(safe-area-inset-top,0px)+16px)]"
      )}>
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
              <span className="text-[7px] font-medium uppercase tracking-widest text-emerald-600">Secure Protocol</span>
              <span className="text-[9px] font-medium uppercase tracking-tighter text-ink/60">Transaction Specification</span>
           </div>
           <ShieldCheck size={18} className="text-emerald-500" />
        </div>
      </nav>

      <div className={cn(
        "px-6 md:px-12 w-full max-w-[1600px] mx-auto",
        // Mobile: stacked layout with bottom padding for CTA
        isMobile ? "pt-16 pb-24 space-y-4" : "pt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      )}>
        {/* FORM AREA */}
        <div className={cn(isMobile ? "space-y-4" : "lg:col-span-6 space-y-6")}>
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
            
            {/* 01: IDENTITY */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-ink/10 pb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-display font-medium italic text-ink/30">01</span>
                  <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Origin Specification</h2>
                </div>
              </div>
              
              <div className={cn("grid gap-[1px] bg-ink/5 border border-ink/5 rounded-none", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                <div className={cn("bg-white", isMobile ? "p-3" : "p-2")}>
                  <label htmlFor="first_name" className={labelClass}>First Name</label>
                  <input id="first_name" required type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className={inputClass} placeholder="John" />
                </div>
                <div className={cn("bg-white border-l border-ink/5", isMobile ? "p-3" : "p-2")}>
                  <label htmlFor="last_name" className={labelClass}>Last Name</label>
                  <input id="last_name" required type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className={inputClass} placeholder="Doe" />
                </div>
                <div className={cn("bg-white border-t border-ink/5", isMobile ? "p-3" : "p-2")}>
                  <label htmlFor="email" className={labelClass}>Email Archive</label>
                  <input id="email" required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="your@email.com" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "p-3" : "p-2")}>
                  <label htmlFor="phone" className={labelClass}>Phone Reference</label>
                  <input id="phone" required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="0812 3456 7890" />
                </div>
              </div>
            </section>

            {/* 02: ADDRESS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-ink/10 pb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-display font-medium italic text-ink/30">02</span>
                  <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Archive Destination</h2>
                </div>
              </div>

              <div className={cn("grid gap-[1px] bg-ink/5 border border-ink/5 rounded-none", isMobile ? "grid-cols-1" : "grid-cols-6")}>
                <div className={cn("bg-white", isMobile ? "col-span-1 p-3" : "col-span-6 p-2")}>
                  <label htmlFor="street" className={labelClass}>Street / Building / Archive Loc.</label>
                  <input id="street" required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className={inputClass} placeholder="Jl. Sudirman No. 1" />
                </div>

                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-2 p-2")}>
                  <label htmlFor="house_number" className={labelClass}>No</label>
                  <input id="house_number" required type="text" value={formData.house_number} onChange={(e) => setFormData({...formData, house_number: e.target.value})} className={inputClass} placeholder="10" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-2 p-2")}>
                  <label htmlFor="rt" className={labelClass}>RT</label>
                  <input id="rt" required type="text" value={formData.rt} onChange={(e) => setFormData({...formData, rt: e.target.value})} className={inputClass} placeholder="001" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-2 p-2")}>
                  <label htmlFor="rw" className={labelClass}>RW</label>
                  <input id="rw" required type="text" value={formData.rw} onChange={(e) => setFormData({...formData, rw: e.target.value})} className={inputClass} placeholder="005" />
                </div>

                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-2")}>
                  <label htmlFor="province" className={labelClass}>Province {loadingLoc.p && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="province" required value={formData.province} onChange={(e) => handleProvinceChange(e.target.value)} className={selectClass} disabled={loadingLoc.p}>
                    <option value="">SELECT PROVINCE</option>
                    {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-2")}>
                  <label htmlFor="city" className={labelClass}>City {loadingLoc.c && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="city" required value={formData.city} onChange={(e) => handleCityChange(e.target.value)} className={selectClass} disabled={!formData.province || loadingLoc.c}>
                    <option value="">SELECT CITY</option>
                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-2")}>
                  <label htmlFor="kecamatan" className={labelClass}>Kecamatan {loadingLoc.d && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="kecamatan" required value={formData.kecamatan} onChange={(e) => handleDistrictChange(e.target.value)} className={selectClass} disabled={!formData.city || loadingLoc.d}>
                    <option value="">SELECT KECAMATAN</option>
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-2")}>
                  <label htmlFor="kelurahan" className={labelClass}>Kelurahan {loadingLoc.v && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="kelurahan" required value={formData.kelurahan} onChange={(e) => setFormData({...formData, kelurahan: e.target.value})} className={selectClass} disabled={!formData.kecamatan || loadingLoc.v}>
                    <option value="">SELECT KELURAHAN</option>
                    {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 03: SHIPPING */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-ink/10 pb-0.5">
                <span className="text-[9px] font-display font-medium italic text-ink/30">03</span>
                <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Archive Logistics</h2>
              </div>

              <div className="grid grid-cols-3 gap-[1px] bg-ink/5 border border-ink/5 rounded-none">
                {shippingOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleShippingChange(option.id, option.price)}
                    className={cn(
                      "flex flex-col items-center py-2 px-1 transition-all bg-white",
                      shippingMethod === option.id ? "bg-rose/[0.02]" : "hover:bg-ink/[0.01]"
                    )}
                  >
                    <span className={cn("text-[8px] font-medium uppercase tracking-widest", shippingMethod === option.id ? "text-rose" : "text-ink/40")}>{option.name}</span>
                    <span className="text-[11px] font-display font-medium italic text-ink">Rp {option.price.toLocaleString('id-ID')}</span>
                  </button>
                ))}
              </div>
            </section>
          </form>
        </div>

        {/* ORDER SUMMARY - Sidebar on desktop, Bottom on mobile */}
        <div className={isMobile ? "lg:col-span-12" : "lg:col-span-4 lg:pl-12"}>
          {isMobile ? (
            /* Mobile: Compact summary card above CTA */
            <div className="bg-white border border-ink/5 rounded-none p-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-medium uppercase tracking-wider text-ink/60">Order ({items.length} items)</span>
                <span className="text-xs font-display font-medium italic text-rose">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ) : (
            /* Desktop: Full sidebar summary */
            <div className="sticky top-20 space-y-4">
            <div className="bg-white border border-ink/5 rounded-none p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-ink/5 pb-2">
                <div className="flex items-center gap-3">
                   <ShoppingBag size={12} className="text-ink/20" />
                   <h3 className="text-[9px] font-medium uppercase tracking-widest text-ink">Catalog Selection</h3>
                </div>
                <span className="text-[8px] font-medium text-ink/40 italic">{items.length} Pieces</span>
              </div>

              <div className="space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-3 items-center group">
                    <div className="w-10 h-10 bg-ink/5 rounded-none overflow-hidden flex-shrink-0 border border-ink/5 group-hover:border-rose/20 transition-colors relative">
                      {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium uppercase truncate text-ink">{item.name}</p>
                      <p className="text-[9px] font-medium text-ink/40 uppercase tracking-tight">Size {item.size} • Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-display font-medium italic text-ink/80">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-ink/5">
                <div className="flex justify-between text-[9px] font-medium uppercase tracking-[0.2em] text-ink/60">
                  <span>Value Subtotal</span>
                  <span className="text-ink">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[9px] font-medium uppercase tracking-[0.2em] text-ink/60">
                  <span>Logistics Archive</span>
                  <span className={cn("font-medium italic", shippingCost > 0 ? "text-ink" : "text-rose")}>
                     {shippingCost > 0 ? `+ Rp ${shippingCost.toLocaleString('id-ID')}` : 'Action Required'}
                  </span>
                </div>
              </div>

              <div className="pt-6 flex flex-col items-center border-t border-ink/5">
                <span className="text-[8px] font-medium uppercase tracking-[0.5em] text-ink/30 mb-1">Total Investment</span>
                <span className="text-2xl font-display font-medium italic text-rose leading-none">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="space-y-4">
                <button
                  form="checkout-form"
                  disabled={isProcessing || !shippingMethod || !snapLoaded}
                  className={cn(
                    "w-full py-3 rounded-none text-[10px] font-medium uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3",
                    isProcessing || !shippingMethod || !snapLoaded
                      ? "bg-ink/5 text-ink/20 cursor-not-allowed"
                      : "bg-ink text-white hover:bg-rose active:scale-[0.98]"
                  )}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 border border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : !snapLoaded ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 border border-ink/20 border-t-ink/40 rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : !shippingMethod ? (
                    <div className="flex items-center gap-2">
                      <Lock size={10} />
                      <span>Select Courier</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock size={10} />
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
          )}
        </div>
      </div>

      {isMobile && (
        <BottomCTA
          text="Checkout"
          isLoading={isProcessing}
          disabled={!shippingMethod || !snapLoaded}
          formId="checkout-form"
        />
      )}
    </div>
  );
}
