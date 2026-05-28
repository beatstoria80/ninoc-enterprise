"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShoppingBag, ArrowLeft, Lock, Info } from 'lucide-react';
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

interface SnapOptions extends SnapCallbacks {
  embedId?: string;
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
  const { items, totalPrice } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  // Dynamic Shipping State
  const [dynamicShippingOptions, setDynamicShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState<boolean>(false);

  // Platform detection for mobile-specific UI
  const { isMobile, isIPhone } = useDevice();

  // Mark snap as loaded once window.snap is available (script loaded via layout.tsx)
  useEffect(() => {
    interface WindowWithSnap extends Window {
      snap?: { 
        pay: (token: string, options: SnapOptions) => void;
        embed: (token: string, options: SnapOptions) => void;
      };
    }
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    let timeoutId: NodeJS.Timeout;
    const checkSnap = () => {
      if (!isMounted) return;
      if (typeof window !== 'undefined' && (window as WindowWithSnap).snap) {
        setSnapLoaded(true);
        return;
      }
      if (retryCount < maxRetries) {
        retryCount++;
        timeoutId = setTimeout(checkSnap, 1000);
      } else {
        // Silent fail - handled by !snapLoaded check in CTA
      }
    };
    // Check immediately and poll briefly in case script loads after this effect
    checkSnap();
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
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
    // Reset shipping options when district changes (clear previous rates)
    if (!name) {
      setDynamicShippingOptions([]);
      setShippingMethod('');
      setShippingCost(0);
    }
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

  // Fetch dynamic rates when location is ready
  useEffect(() => {
    if (formData.kecamatan) {
      const fetchRates = async () => {
        setLoadingShipping(true);
        try {
          const res = await fetch('/api/shipping/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination_area_id: formData.kecamatan })
          });
          const data = await res.json();
          if (data.success && data.pricing) {
            setDynamicShippingOptions(data.pricing);
            // Optional: Auto-select if current method is invalid or reset
            setShippingMethod('');
            setShippingCost(0);
          }
        } catch (e) {
          console.error('Failed to fetch shipping rates', e);
        } finally {
          setLoadingShipping(false);
        }
      };
      fetchRates();
    }
  }, [formData.kecamatan]);

  // Fallback options in case API fails or hasn't loaded
  const fallbackShippingOptions = [
    { company: 'jne', courier_name: 'JNE', courier_service_name: 'REGULER', price: 15000, duration: '2-3 Days', description: 'Standard Network Distribution' },
    { company: 'jnt', courier_name: 'J&T', courier_service_name: 'EZ', price: 12000, duration: '1-2 Days', description: 'Express Transit Distribution' },
    { company: 'sicepat', courier_name: 'SiCepat', courier_service_name: 'BEST', price: 18000, duration: '1 Day', description: 'Priority Network Distribution' },
  ];

  const displayOptions = dynamicShippingOptions.length > 0 ? dynamicShippingOptions : fallbackShippingOptions;

  const handleShippingChange = (id: string, price: number) => {
    setShippingMethod(id);
    setShippingCost(price);
  };

  const subtotal = totalPrice();
  const tax = Math.round(subtotal * 0.11); // 11% VAT
  const platformFee = 2500; // Standard platform/gateway fee
  const finalTotal = subtotal + shippingCost + tax + platformFee;

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shippingMethod) return;

    // Ensure Midtrans script is loaded
    if (!snapLoaded || !(window as Window & { snap?: { pay: (token: string, callbacks: SnapCallbacks) => void } }).snap) {
      alert('Payment gateway is not ready. Please refresh the page.');
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
          fees: { tax, platformFee },
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

      setPaymentToken(data.token);

    } catch (err) {
      console.error('[handleCheckout] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setIsProcessing(false);
      alert(`Checkout failed: ${errorMessage}. Please check your details and try again.`);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Effect to trigger Snap Embed when paymentToken is available
  useEffect(() => {
    if (paymentToken && snapLoaded) {
      const snapObj = (window as unknown as Window & { snap: { embed: (token: string, options: SnapOptions) => void } }).snap;
      if (snapObj && typeof snapObj.embed === 'function') {
        snapObj.embed(paymentToken, {
          embedId: 'snap-container',
          onSuccess: (result: MidtransSnapResult) => {
            console.log('Payment successful:', result);
            router.push('/payment/success');
          },
          onError: (err: unknown) => {
            console.error('Midtrans payment error:', err);
            setIsProcessing(false);
            setPaymentToken(null);
            alert('Payment failed. Please try again or contact support.');
          },
          onClose: () => {
            console.log('Payment popup closed by user');
            // If they close the snap iframe inside the embed (sometimes possible), we just clean up
          }
        });
      }
    }
  }, [paymentToken, snapLoaded, router]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cr flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-display font-medium italic uppercase">Empty</h2>
        <Link href="/shop" className="bg-ink text-white px-8 py-3 rounded-lg text-xs tracking-widest" onClick={() => router.replace('/shop')}>Back to Shop</Link>
      </div>
    );
  }

  const inputClass = "w-full bg-white py-2.5 px-3 text-[10px] font-medium uppercase tracking-widest text-ink outline-none transition-all border border-ink/20 rounded-none placeholder:text-ink/30 focus:border-rose/40";
  const selectClass = "w-full bg-white py-2 px-2.5 text-[10px] font-medium uppercase tracking-widest text-ink outline-none transition-all cursor-pointer border border-ink/20 rounded-none disabled:opacity-50 disabled:cursor-not-allowed focus:border-rose/40 appearance-none";
  const labelClass = "text-[9px] font-medium uppercase tracking-[0.2em] text-ink/70 mb-1.5 block";

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
          onClick={() => {
            if (items.length > 0 && items[0].slug) {
              router.push(`/shop/${items[0].slug}`);
            } else {
              router.push('/shop');
            }
          }} 
          className="group flex items-center gap-3 text-ink transition-all"
        >
          <div className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center group-hover:border-rose group-hover:text-rose transition-colors">
            <ArrowLeft size={14} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">Return to</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink group-hover:text-rose transition-colors">Product</span>
          </div>
        </button>
        <div className="font-display font-medium text-2xl italic tracking-tighter text-rose absolute left-1/2 -translate-x-1/2 uppercase select-none hidden md:block">NINOC</div>
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
        isMobile ? "pt-20 pb-24 space-y-4" : "pt-36 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      )}>
        {/* ORDER SUMMARY - Top on mobile for transparency */}
        {isMobile && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-0.5">
              <span className="text-[9px] font-display font-medium italic text-ink/30">00</span>
              <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Financial Specification</h2>
            </div>
            
            <div className="bg-white border border-ink/5 p-4 space-y-4 shadow-sm">
              <div className="space-y-2 border-b border-ink/5 pb-3">
                <div className="flex justify-between items-center text-[9px] font-medium uppercase tracking-widest text-ink/40">
                  <span>Subtotal</span>
                  <span>IDR {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-medium uppercase tracking-widest text-ink/40">
                  <span>Logistics Fee</span>
                  <span className={shippingCost > 0 ? "text-ink" : "text-rose italic"}>
                    {shippingCost > 0 ? `+ IDR ${shippingCost.toLocaleString('id-ID')}` : 'Selection Required'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-medium uppercase tracking-widest text-ink/40">
                  <span>VAT (11%)</span>
                  <span>+ IDR {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-medium uppercase tracking-widest text-ink/40">
                  <span>Platform Fee</span>
                  <span>+ IDR {platformFee.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30 leading-none mb-1">Total Investment</span>
                  <span className="text-xl font-display font-medium italic text-rose leading-none">IDR {finalTotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('mobile-item-list');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="px-3 py-1.5 border border-ink/5 text-[8px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors"
                >
                  View Details
                </button>
              </div>

              {/* Collapsible Item List for Mobile */}
              <div id="mobile-item-list" className="hidden pt-4 space-y-3 border-t border-ink/5">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 items-center">
                    <div className="w-8 h-8 bg-ink/5 flex-shrink-0 relative border border-ink/5">
                      {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium uppercase truncate text-ink">{item.name}</p>
                      <p className="text-[7px] font-medium text-ink/30 uppercase">{item.color ? `Color ${item.color} / ` : ''}Size {item.size} • Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FORM AREA */}
        <div className={cn(isMobile ? "space-y-4" : "lg:col-span-6 space-y-6")}>
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6 relative z-10">
            
            {/* 01: IDENTITY */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-ink/10 pb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-display font-medium italic text-ink/30">01</span>
                  <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Origin Specification</h2>
                </div>
              </div>
              
              <div className={cn("grid gap-[1px] bg-ink/40 border border-ink/40 rounded-none", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                <div className={cn("bg-white", isMobile ? "p-4" : "p-4")}>
                  <label htmlFor="first_name" className={labelClass}>First Name</label>
                  <input id="first_name" required type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full bg-transparent text-[11px] font-medium uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none pt-1" placeholder="John" />
                </div>
                <div className={cn("bg-white border-l border-ink/40", isMobile ? "p-4" : "p-4")}>
                  <label htmlFor="last_name" className={labelClass}>Last Name</label>
                  <input id="last_name" required type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full bg-transparent text-[11px] font-medium uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none pt-1" placeholder="Doe" />
                </div>
                <div className={cn("bg-white border-t border-ink/40", isMobile ? "p-4" : "p-4")}>
                  <label htmlFor="email" className={labelClass}>Email</label>
                  <input id="email" required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-transparent text-[11px] font-medium uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none pt-1" placeholder="your@email.com" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/40", isMobile ? "p-4" : "p-4")}>
                  <label htmlFor="phone" className={labelClass}>Phone Reference</label>
                  <input id="phone" required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent text-[11px] font-medium uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none pt-1" placeholder="0812 3456 7890" />
                </div>
              </div>
            </section>

            {/* 02: ADDRESS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-ink/10 pb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-display font-medium italic text-ink/30">02</span>
                  <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Destination Specification</h2>
                </div>
              </div>

              <div className={cn("grid gap-[1px] bg-ink/5 border border-ink/5 rounded-none", isMobile ? "grid-cols-1" : "grid-cols-6")}>
                <div className={cn("bg-white", isMobile ? "col-span-1 p-3" : "col-span-6 p-3")}>
                  <label htmlFor="street" className={labelClass}>Street / Building / Precise Loc.</label>
                  <input id="street" required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className={inputClass} placeholder="Jl. Sudirman No. 1" />
                </div>

                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-2 p-3")}>
                  <label htmlFor="house_number" className={labelClass}>No</label>
                  <input id="house_number" required type="text" value={formData.house_number} onChange={(e) => setFormData({...formData, house_number: e.target.value})} className={inputClass} placeholder="10" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-2 p-3")}>
                  <label htmlFor="rt" className={labelClass}>RT</label>
                  <input id="rt" required type="text" value={formData.rt} onChange={(e) => setFormData({...formData, rt: e.target.value})} className={inputClass} placeholder="001" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-2 p-3")}>
                  <label htmlFor="rw" className={labelClass}>RW</label>
                  <input id="rw" required type="text" value={formData.rw} onChange={(e) => setFormData({...formData, rw: e.target.value})} className={inputClass} placeholder="005" />
                </div>

                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-3")}>
                  <label htmlFor="province" className={labelClass}>Province {loadingLoc.p && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="province" required value={formData.province} onChange={(e) => handleProvinceChange(e.target.value)} className={selectClass} disabled={loadingLoc.p}>
                    <option value="">SELECT PROVINCE</option>
                    {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-3")}>
                  <label htmlFor="city" className={labelClass}>City {loadingLoc.c && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="city" required value={formData.city} onChange={(e) => handleCityChange(e.target.value)} className={selectClass} disabled={!formData.province || loadingLoc.c}>
                    <option value="">SELECT CITY</option>
                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-3")}>
                  <label htmlFor="kecamatan" className={labelClass}>Kecamatan {loadingLoc.d && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="kecamatan" required value={formData.kecamatan} onChange={(e) => handleDistrictChange(e.target.value)} className={selectClass} disabled={!formData.city || loadingLoc.d}>
                    <option value="">SELECT KECAMATAN</option>
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t border-l border-ink/5", isMobile ? "col-span-1 p-3" : "col-span-3 p-3")}>
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
                <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Logistics Selection</h2>
              </div>

              <div className="grid grid-cols-3 gap-[1px] bg-ink/5 border border-ink/5 rounded-none relative">
                {loadingShipping && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink animate-pulse">Calculating Rates...</span>
                  </div>
                )}
                {displayOptions.map((option) => (
                  <button
                    key={option.company}
                    type="button"
                    onClick={() => handleShippingChange(option.company, option.price)}
                    className={cn(
                      "group relative flex flex-col items-center py-2.5 px-1 transition-all bg-white border-t-2",
                      shippingMethod === option.company ? "bg-rose/[0.02] border-rose" : "border-transparent hover:bg-ink/[0.01]"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn("text-[9px] font-medium uppercase tracking-widest", shippingMethod === option.company ? "text-rose" : "text-ink/60")}>{option.courier_name}</span>
                      <div className="text-ink/30 hover:text-ink transition-colors relative z-20" onClick={(e) => { e.stopPropagation(); /* Only to allow tap target for tooltip on mobile */ }}>
                        <Info size={10} />
                      </div>
                    </div>
                    <span className={cn("text-[11px] font-display font-medium italic", shippingMethod === option.company ? "text-ink" : "text-ink")}>
                      IDR {option.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>

                    {/* Pop-up Info (Tooltip) */}
                    <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[180px] bg-ink border border-ink shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 origin-bottom scale-95 group-hover:scale-100 pointer-events-none flex flex-col gap-1.5 text-left">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-rose">{option.courier_name}</span>
                        <span className="text-[7px] border border-white/20 px-1 py-0.5 text-white/80 uppercase tracking-widest">{option.courier_service_name}</span>
                      </div>
                      <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/60">EST: <span className="text-white">{option.duration}</span></span>
                      <span className="text-[8px] font-medium tracking-[0.02em] text-white/50 leading-relaxed">{option.description}</span>
                      
                      {/* Triangle Arrow */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-ink rotate-45 border-b border-r border-ink"></div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </form>
        </div>        {/* ORDER SUMMARY - Sidebar on desktop only */}
        {!isMobile && (
          <div className="lg:col-span-4 lg:pl-12">
            <div className="sticky top-20 space-y-4">
              <div className="flex items-center gap-2 border-b border-ink/10 pb-0.5">
                <span className="text-[9px] font-display font-medium italic text-ink/30">00</span>
                <h2 className="text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Financial Specification</h2>
              </div>
              
              <div className="bg-white border border-ink/5 rounded-none p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-ink/5 pb-2">
                  <div className="flex items-center gap-3">
                     <ShoppingBag size={12} className="text-ink/20" />
                     <h3 className="text-[9px] font-medium uppercase tracking-widest text-ink">Final Selection</h3>
                  </div>
                  <span className="text-[8px] font-medium text-ink/40 italic">{items.length} Pieces</span>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 items-center group">
                      <div className="w-10 h-10 bg-ink/5 rounded-none overflow-hidden flex-shrink-0 border border-ink/5 group-hover:border-rose/20 transition-colors relative">
                        {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium uppercase truncate text-ink">{item.name}</p>
                        <p className="text-[9px] font-medium text-ink/40 uppercase tracking-tight">{item.color ? `Color ${item.color} / ` : ''}Size {item.size} • Qty {item.quantity}</p>
                      </div>
                      <p className="text-sm font-display font-medium italic text-ink/80">IDR {(item.price * item.quantity).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-ink/20">
                  <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
                    <span>Value Subtotal</span>
                    <span>IDR {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
                    <span>Logistics</span>
                    <span className={cn("italic", shippingCost > 0 ? "text-ink" : "text-rose")}>
                       {shippingCost > 0 ? `+ IDR ${shippingCost.toLocaleString('id-ID')}` : 'Action Required'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
                    <span>VAT (11%)</span>
                    <span className="italic text-ink">+ IDR {tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
                    <span>Platform Fee</span>
                    <span className="italic text-ink">+ IDR {platformFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-6 flex flex-col items-center border-t border-ink/20">
                  <span className="text-[8px] font-medium uppercase tracking-[0.5em] text-ink/40 mb-1">Total Investment</span>
                  <span className="text-3xl font-display font-medium italic text-rose leading-none">IDR {finalTotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>

                {/* CATALOG */}
                <div className="pt-6">
                  <button
                    form="checkout-form"
                    disabled={isProcessing || !shippingMethod || !snapLoaded}
                    className={cn(
                      "w-full py-4 rounded-none text-[11px] font-medium uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3",
                      isProcessing || !shippingMethod || !snapLoaded
                        ? "bg-ink/5 text-ink/20 cursor-not-allowed border border-ink/10"
                        : "bg-ink text-white hover:bg-rose active:scale-[0.98] shadow-lg shadow-ink/5"
                    )}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : !snapLoaded ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin" />
                        <span>Preparing Gateway...</span>
                      </div>
                    ) : !shippingMethod ? (
                      <div className="flex items-center gap-2">
                        <Lock size={12} strokeWidth={1.5} />
                        <span>Select Courier</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock size={12} strokeWidth={1.5} />
                        <span>Authorize Payment</span>
                      </div>
                    )}
                  </button>
                </div>
                
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    onClick={() => router.push('/payment/success')}
                    className="w-full mt-2 bg-emerald-50 border border-emerald-200 text-emerald-600 py-3 px-6 text-[9px] font-medium uppercase tracking-[0.1em] hover:bg-emerald-100 transition-all flex items-center justify-center"
                  >
                    [DEV] Bypass to Payment Success
                  </button>
                )}
              </div>

              {/* SECURITY SPECS */}
              <div className="flex flex-col items-center gap-4 opacity-70">
                 <div className="flex items-center justify-center gap-10 grayscale brightness-90">
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Visa_2021.svg" alt="Visa" width={40} height={14} className="h-3.5 w-auto object-contain" unoptimized />
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={40} height={22} className="h-4.5 w-auto object-contain" unoptimized />
                    <Image src="https://midtrans.com/assets/img/midtrans-logo.svg" alt="Midtrans" width={60} height={20} className="h-3.5 w-auto object-contain" unoptimized />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-center text-ink/50 leading-relaxed">Secured by 256-bit SSL Encryption</p>
                    <p className="text-[7px] font-medium uppercase tracking-[0.1em] text-center text-ink/30">Official NINOC Merchant Partner</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile BottomCTA - Show on ALL mobile devices (iOS + Android) */}
      {isMobile && (
        <BottomCTA
          text="Checkout"
          isLoading={isProcessing}
          disabled={!shippingMethod || !snapLoaded}
          formId="checkout-form"
        />
      )}

      {/* CUSTOM MIDTRANS EMBED OVERLAY */}
      {paymentToken && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-cr/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white border border-ink/10 shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-500 h-[90vh] md:h-auto md:min-h-[600px]">
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-ink/5 bg-ink/[0.02]">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-ink">Payment Authorization</span>
                  <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">Secured by Midtrans</span>
                </div>
              </div>
              <div className="flex gap-2">
                {process.env.NODE_ENV === 'development' && (
                  <button 
                    onClick={() => {
                      setPaymentToken(null);
                      setIsProcessing(false);
                      router.push('/payment/success');
                    }} 
                    className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-medium uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                  >
                    [DEV] Bypass
                  </button>
                )}
                <button 
                  onClick={() => {
                    setPaymentToken(null);
                    setIsProcessing(false);
                  }} 
                  className="px-4 py-2 border border-ink/10 text-[9px] font-medium uppercase tracking-widest text-ink hover:bg-rose hover:text-white hover:border-rose transition-colors"
                >
                  Abort
                </button>
              </div>
            </div>
            {/* Snap Container */}
            <div id="snap-container" className="w-full flex-1 md:h-[600px] overflow-hidden bg-white"></div>
          </div>
        </div>
      )}
    </div>
  );
}
