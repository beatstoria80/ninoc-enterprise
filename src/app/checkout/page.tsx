"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShoppingBag, ArrowLeft, Lock, Info, CheckCircle, AlertTriangle, User, Trash2, ChevronDown } from 'lucide-react';
import { useCart, useHydratedCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { useDevice } from './_components/useDevice';
import BottomCTA from './_components/BottomCTA';
import { useDictionary } from '@/hooks/useDictionary';
import CourierLogo from '@/components/CourierLogo';
import { toast } from 'sonner';
import { useRef } from 'react';

import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./_components/LocationPicker').then(mod => mod.LocationPicker), { 
  ssr: false, 
  loading: () => <div className="h-[250px] w-full bg-ink/5 animate-pulse rounded-sm border border-ink/10 flex items-center justify-center"><span className="text-[10px] uppercase tracking-widest text-ink/40">Memuat Peta...</span></div> 
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function CheckoutCartItemImage({ item }: { item: { id: string; name: string; color?: string; size?: string; image_url?: string | null } }) {
  const [fetchedOverride, setFetchedOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!item.color || !item.id) return;

    let isMounted = true;
    const fetchColorPhoto = async () => {
      try {
        const safeColor = item.color!.trim().toUpperCase();
        const { data } = await supabase
          .from('specifications')
          .select('label, value')
          .eq('product_id', item.id);

        if (!isMounted || !data) return;

        const specMatch = data.find(spec => {
          if (!spec.label || !spec.value) return false;
          const m = spec.label.match(/^color\s*(image)?\s*:\s*(.+)$/i);
          return m && m[2].trim().toUpperCase() === safeColor && spec.value.trim();
        });

        if (specMatch && specMatch.value?.trim()) {
          const img = specMatch.value.trim();
          setFetchedOverride(img);
          const currentItems = useCart.getState().items;
          const needsUpdate = currentItems.some(i => i.id === item.id && i.size === item.size && i.color === item.color && i.image_url !== img);
          if (needsUpdate) {
            useCart.setState(state => ({
              items: state.items.map(i => (i.id === item.id && i.size === item.size && i.color === item.color) ? { ...i, image_url: img } : i)
            }));
          }
          return;
        }

        const { data: varData } = await supabase
          .from('variants')
          .select('image_url')
          .eq('product_id', item.id)
          .ilike('color', safeColor)
          .limit(1);

        if (isMounted && varData && varData[0]?.image_url) {
          const img = varData[0].image_url;
          setFetchedOverride(img);
          const currentItems = useCart.getState().items;
          const needsUpdate = currentItems.some(i => i.id === item.id && i.size === item.size && i.color === item.color && i.image_url !== img);
          if (needsUpdate) {
            useCart.setState(state => ({
              items: state.items.map(i => (i.id === item.id && i.size === item.size && i.color === item.color) ? { ...i, image_url: img } : i)
            }));
          }
        }
      } catch (err) {
        console.error('CheckoutCartItemImage resolve error:', err);
      }
    };

    fetchColorPhoto();
    return () => { isMounted = false; };
  }, [item.id, item.color, item.size]);

  const src = fetchedOverride || item.image_url;
  return src ? <Image src={src} alt={item.name} fill className="object-contain" /> : null;
}

// ═══════════════════════════════════════════════════════════════
// EMIL KOWALSKI ANIMATION ENGINE — CHECKOUT
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
};

const DURATION = {
  micro: 0.05,
  fast: 0.08,
  normal: 0.12,
  medium: 0.18,
  slow: 0.3,
};

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
  onPending?: (result: MidtransSnapResult) => void;
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

interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  house_number: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postal_code: string;
  referral_code: string;
  address_type: string;
  latitude?: number;
  longitude?: number;
}

function getEstimatedDeliveryDate(durationStr: string, isLateForInstant: boolean, courierName: string): string {
  if (!durationStr) return '';
  const lower = durationStr.toLowerCase();
  const cName = courierName.toLowerCase();
  
  const today = new Date();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };
  
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isInstantSameday = lower.includes('hour') || lower.includes('same day') || lower.includes('instant') || cName.includes('gosend') || cName.includes('grab');

  if (isInstantSameday) {
    if (isLateForInstant) {
      return `Diterima Besok (${formatDate(addDays(today, 1))})`;
    }
    return `Diterima Hari Ini (${formatDate(today)})`;
  }
  
  const rangeMatch = durationStr.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const minDays = parseInt(rangeMatch[1]);
    const maxDays = parseInt(rangeMatch[2]);
    const minDate = addDays(today, minDays);
    const maxDate = addDays(today, maxDays);
    if (minDate.getMonth() === maxDate.getMonth()) {
        return `Diterima ${minDate.getDate()} - ${formatDate(maxDate)}`;
    }
    return `Diterima ${formatDate(minDate)} - ${formatDate(maxDate)}`;
  }
  
  const singleMatch = durationStr.match(/(\d+)/);
  if (singleMatch) {
    const days = parseInt(singleMatch[1]);
    if (days === 1) return `Diterima Besok (${formatDate(addDays(today, 1))})`;
    const estDate = addDays(today, days);
    return `Diterima ${formatDate(estDate)}`;
  }
  
  return durationStr;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, removeItem, isHydrated } = useHydratedCart();
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; size?: string; color?: string } | null>(null);
  const dict = useDictionary();
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  // Promo Code State
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState<{ type: string; code: string; discountAmount: number; message: string; affiliateId?: string; } | null>(null);
  const [promoError, setPromoError] = useState('');

  // Dynamic Shipping State
  const [dynamicShippingOptions, setDynamicShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState<boolean>(false);
  const [fnbNotice, setFnbNotice] = useState<string | null>(null);

  // Email Check State
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'registered' | 'unregistered'>('idle');

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

  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('ninoc_checkout_form');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved checkout form data', e);
        }
      }
    }
    return {
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
      postal_code: '',
      referral_code: '',
      address_type: 'Home'
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ninoc_checkout_form', JSON.stringify(formData));
    }
  }, [formData]);

  // Set flag to skip entrance animation on product page when going back
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('skip_product_animation', 'true');
    }
  }, []);

  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);
  
  // State for multiple saved addresses
  const [savedAddresses, setSavedAddresses] = useState<CheckoutFormData[]>([]);

  const [loadingLoc, setLoadingLoc] = useState({ p: false, c: false, d: false, v: false });

  // Watch Email for validation
  useEffect(() => {
    if (!formData.email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmailCheckStatus('idle');
      return;
    }
    
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
       
      setEmailCheckStatus('idle');
      return;
    }

    // Don't check if user is already logged in with this email
    if (userId) {
       
      setEmailCheckStatus('idle');
      return;
    }

     
    setEmailCheckStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        if (res.ok) {
          const data = await res.json();
          setEmailCheckStatus(data.isRegistered ? 'registered' : 'unregistered');
        } else {
          setEmailCheckStatus('idle');
        }
      } catch (err) {
        setEmailCheckStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, userId]);

  // Fetch Provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingLoc(prev => ({ ...prev, p: true }));
      try {
        const res = await fetch('/api/location/provinces');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        const sortedData = data && data.length > 0 ? data : FALLBACK_PROVINCES;
        sortedData.sort((a: LocationItem, b: LocationItem) => a.name.localeCompare(b.name));
        setProvinces(sortedData);
      } catch (e) {
        console.error("Province fetch failed:", e);
        const sortedFallback = [...FALLBACK_PROVINCES].sort((a, b) => a.name.localeCompare(b.name));
        setProvinces(sortedFallback);
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
      const sortedData = Array.isArray(data) ? data.sort((a: LocationItem, b: LocationItem) => a.name.localeCompare(b.name)) : [];
      setCities(sortedData);
      return sortedData;
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
      const sortedData = Array.isArray(data) ? data.sort((a: LocationItem, b: LocationItem) => a.name.localeCompare(b.name)) : [];
      setDistricts(sortedData);
      return sortedData;
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
      const sortedData = Array.isArray(data) ? data.sort((a: LocationItem, b: LocationItem) => a.name.localeCompare(b.name)) : [];
      setVillages(sortedData);
      return sortedData;
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
        
        // Fetch base profile for name/phone fallback
        const { data: profile } = await supabase.from('customer_profiles').select('*').eq('user_id', user.id).single();
        
        // Fetch addresses from customer_addresses
        const { data: addresses } = await supabase.from('customer_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
        
        if (addresses && addresses.length > 0) {
          const parsedAddresses = addresses.map((addr: any) => ({
            first_name: addr.first_name || profile?.first_name || '',
            last_name: addr.last_name || profile?.last_name || '',
            email: user.email || '',
            phone: addr.phone || profile?.phone || '',
            street: addr.street || '',
            house_number: addr.house_number || '',
            rt: addr.rt || '',
            rw: addr.rw || '',
            kelurahan: addr.kelurahan || '',
            kecamatan: addr.kecamatan || '',
            city: addr.city || '',
            province: addr.province || '',
            postal_code: addr.postal_code || '',
            referral_code: '',
            address_type: addr.address_type || 'Home'
          }));
          
          setSavedAddresses(parsedAddresses);
          
          // Try to set current address to match the formData address_type, or use the default
          const targetType = formData.address_type || 'Home';
          const addrToUse = parsedAddresses.find((a: any) => a.address_type === targetType) || parsedAddresses[0];
          
          setFormData(prev => ({...prev, ...addrToUse, referral_code: prev.referral_code})); // keep current referral
          
          // Trigger cascading fetches sequentially for the selected address
          if (addrToUse.province) {
            const loadedCities = await fetchCities(addrToUse.province);
            if (addrToUse.city && Array.isArray(loadedCities)) {
              const loadedDistricts = await fetchDistricts(addrToUse.city, loadedCities);
              if (addrToUse.kecamatan && Array.isArray(loadedDistricts)) {
                await fetchVillages(addrToUse.kecamatan, loadedDistricts);
              }
            }
          }
        } else if (profile) {
          // Fallback to legacy customer_profiles structure if no addresses exist
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
            postal_code: profile.postal_code || '',
            referral_code: '',
            address_type: profile.address_type || 'Home'
          };
          setSavedAddresses([newData]);
          setFormData(newData);
          
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
      } else {
        // Guest mode hydration from sessionStorage
        if (formData.province) {
          const loadedCities = await fetchCities(formData.province);
          if (formData.city && Array.isArray(loadedCities)) {
            const loadedDistricts = await fetchDistricts(formData.city, loadedCities);
            if (formData.kecamatan && Array.isArray(loadedDistricts)) {
              await fetchVillages(formData.kecamatan, loadedDistricts);
            }
          }
        }
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces]);

  const switchAddressType = async (type: string) => {
    // If switching to the same type, do nothing
    if (formData.address_type === type) return;

    const existingAddr = savedAddresses.find(a => a.address_type === type);
    if (existingAddr) {
      setFormData(prev => ({ ...prev, ...existingAddr, address_type: type, referral_code: prev.referral_code }));
      
      // Load locations for the existing address
      setCities([]); setDistricts([]); setVillages([]);
      if (existingAddr.province) {
        const loadedCities = await fetchCities(existingAddr.province);
        if (existingAddr.city && Array.isArray(loadedCities)) {
          const loadedDistricts = await fetchDistricts(existingAddr.city, loadedCities);
          if (existingAddr.kecamatan && Array.isArray(loadedDistricts)) {
            await fetchVillages(existingAddr.kecamatan, loadedDistricts);
          }
        }
      }
    } else {
      // Clear address fields, but keep identity info
      setFormData(prev => ({
        ...prev,
        address_type: type,
        street: '',
        house_number: '',
        rt: '',
        rw: '',
        kelurahan: '',
        kecamatan: '',
        city: '',
        province: '',
        postal_code: ''
      }));
      setCities([]); setDistricts([]); setVillages([]);
    }
  };

  // Fetch dynamic rates when location is ready
  useEffect(() => {
    if (formData.kecamatan) {
      const fetchRates = async () => {
        setLoadingShipping(true);
        try {
          // Build cart items payload for Biteship
          const biteshipItems = items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            weight: (item as any).weight_grams || 100,
            department_id: (item as any).department_id,
            category: (item as any).category,
            is_perishable: (item as any).is_perishable,
          }));

          const res = await fetch('/api/biteship/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destination_area_name: `${formData.city} ${formData.kecamatan}`,
              destination_area_id: formData.kecamatan,
              destination_postal_code: formData.postal_code,
              origin_postal_code: items.length > 0 ? items[0].origin_postal_code : undefined,
              destination_latitude: formData.latitude,
              destination_longitude: formData.longitude,
              items: biteshipItems
            })
          });
          const data = await res.json();
          if (data.success && data.pricing) {
            setDynamicShippingOptions(data.pricing);
            setFnbNotice(data.fnb_notice || null);
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
  }, [formData.kecamatan, formData.city, items, formData.latitude, formData.longitude, formData.postal_code]);

  const displayOptions = dynamicShippingOptions;

  const handleShippingChange = (id: string, price: number) => {
    setShippingMethod(id);
    setShippingCost(price);
  };

  // --- SLA ENFORCEMENT ---
  // Detect if current time in WIB is >= 15:00
  const currentHourWIB = parseInt(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: '2-digit', hour12: false }));
  const isLateForInstant = currentHourWIB >= 15;

  const subtotal = totalPrice;
  const tax = 0; // VAT removed as prices are nett
  const platformFee = 2500; // Standard platform/gateway fee
  const finalTotal = Math.max(0, subtotal + shippingCost + platformFee - (promoApplied?.discountAmount || 0));

  const applyPromo = async () => {
    if (!formData.referral_code) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.referral_code, subtotal: subtotal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      
      setPromoApplied(data);
    } catch (err: any) {
      setPromoError(err.message);
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isProcessingRef.current) return;
    if (!shippingMethod) return;

    // Ensure Midtrans script is loaded
    if (!snapLoaded || !(window as Window & { snap?: { pay: (token: string, callbacks: SnapCallbacks) => void } }).snap) {
      toast.error('Payment gateway is not ready. Please refresh the page.');
      return;
    }

    // Input Validations
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Format email tidak valid. Pastikan penulisan benar dan tidak ada email berulang.');
      return;
    }
    if (!formData.first_name || !formData.first_name.trim()) {
      toast.error('Nama depan wajib diisi dengan benar.');
      return;
    }

    if (formData.first_name.length > 50 || formData.last_name.length > 50) {
      toast.error('Nama terlalu panjang. Mohon masukkan nama yang wajar.');
      return;
    }

    // Validate phone number length (10-13 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      toast.error('Nomor HP tidak valid. Masukkan 10 hingga 15 digit angka yang benar.');
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    let cleanStreet = formData.street.trim();
    const houseNumStr = formData.house_number.trim();
    if (houseNumStr) {
      // Remove house number if it was prefixed by autocomplete (e.g. "40 Jl. Jamika")
      const regexStart = new RegExp(`^${houseNumStr}\\s+`, 'i');
      cleanStreet = cleanStreet.replace(regexStart, '');
      // Remove house number if it was appended (e.g. "Jl. Jamika 40" or "Jl. Jamika No. 40")
      const regexEnd = new RegExp(`\\s*(no\\.?\\s*)?${houseNumStr}$`, 'i');
      cleanStreet = cleanStreet.replace(regexEnd, '');
    }

    const fullAddress = `${cleanStreet} No. ${houseNumStr}, RT ${formData.rt}/RW ${formData.rw}, Kel. ${formData.kelurahan}, Kec. ${formData.kecamatan}, ${formData.city}, ${formData.province}, ${formData.postal_code}`.trim().replace(/,\s*$/, '');
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
          promo: promoApplied,
          totalPrice: finalTotal
        })
      });

      // Handle non-OK responses
      if (!response.ok) {
        if (response.status === 409) {
          const errData = await response.json();
          alert(errData.error || 'Stok produk telah habis. Silakan perbarui keranjang Anda.');
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }
        
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Validate token exists
      if (!data.token) {
        throw new Error(data.error || 'Payment token not received from server');
      }

      setPaymentToken(data.token);
      if (data.orderId) setCreatedOrderId(data.orderId);
      if (data.orderNumber) setCreatedOrderNumber(data.orderNumber);

    } catch (err) {
      console.error('[handleCheckout] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      isProcessingRef.current = false;
      setIsProcessing(false);
      toast.error(`Checkout failed: ${errorMessage}. Please check your details and try again.`);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Effect to trigger Snap Embed when paymentToken is available
  useEffect(() => {
    if (paymentToken && snapLoaded) {

      const snapObj = (window as unknown as Window & { snap: { embed: (token: string, options: any) => void, pay: (token: string, options: any) => void } }).snap;
      if (snapObj) {
        const callbacks = {
          onSuccess: (result: MidtransSnapResult) => {
            console.log('Payment successful:', result);
            setIsRedirecting(true);
            setPaymentToken(null); // Close the Midtrans overlay
            clearCart();
            sessionStorage.removeItem('ninoc_checkout_form');
            const params = new URLSearchParams({ courier: shippingMethod });
            if (createdOrderId) params.set('order_id', createdOrderId);
            if (createdOrderNumber) params.set('order_number', createdOrderNumber);
            router.push(`/payment/success?${params.toString()}`);
          },
          onPending: (result: MidtransSnapResult) => {
            console.log('Payment pending:', result);
            setIsRedirecting(true);
            setPaymentToken(null);
            if (!userId) {
              clearCart();
            }
            sessionStorage.removeItem('ninoc_checkout_form');
            const params = new URLSearchParams({ courier: shippingMethod });
            if (createdOrderId) params.set('order_id', createdOrderId);
            if (createdOrderNumber) params.set('order_number', createdOrderNumber);
            router.push(`/payment/success?${params.toString()}`);
          },
          onError: (err: unknown) => {
            console.error('Midtrans payment error:', err);
            isProcessingRef.current = false;
            setIsProcessing(false);
            setPaymentToken(null);
            toast.error('Payment failed. Please try again or contact support.');
          },
          onClose: () => {
            console.log('Payment popup closed by user');
            setPaymentToken(null);
            isProcessingRef.current = false;
            setIsProcessing(false);
          }
        };

        try {
          if (typeof snapObj.embed === 'function') {
            snapObj.embed(paymentToken, { embedId: 'snap-container', ...callbacks });
          } else if (typeof snapObj.pay === 'function') {
            snapObj.pay(paymentToken, callbacks);
          }
        } catch (err) {
          console.error('[Snap SDK Error] Failed to initialize payment interface:', err);
          isProcessingRef.current = false;
          setTimeout(() => {
            setIsProcessing(false);
            setPaymentToken(null);
          }, 0);
          toast.error('Payment gateway interface failed to load. Please try again.');
        }
      }
    }
  }, [paymentToken, snapLoaded, router, createdOrderId, createdOrderNumber, shippingMethod, clearCart, userId]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <motion.div 
        className="min-h-screen bg-cr flex flex-col items-center justify-center p-6 text-center space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.medium, ease: EASING.out }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: DURATION.medium, ease: EASING.out }}
        >
          <ShoppingBag size={48} strokeWidth={1} className="text-ink/15 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-medium italic uppercase">{dict.checkout.empty}</h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: DURATION.medium, ease: EASING.out }}
        >
          <Link  href="/shop" className="bg-ink text-white px-8 py-3 rounded-lg text-xs tracking-widest hover:bg-rose transition-colors active:scale-[0.97]" onClick={() => router.replace('/shop')}>{dict.checkout.backToShop}</Link>
        </motion.div>
      </motion.div>
    );
  }

  const inputClass = "w-full bg-white py-1.5 px-2 text-xs font-medium uppercase tracking-widest text-ink outline-none transition-all border border-ink/20 rounded-none placeholder:text-ink/50 focus:border-rose/40";
  const selectClass = "w-full bg-white py-1 px-2 text-xs font-medium uppercase tracking-widest text-ink outline-none transition-all cursor-pointer border border-ink/20 rounded-none disabled:opacity-50 disabled:cursor-not-allowed focus:border-rose/40 appearance-none";
  const labelClass = "text-[10px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50 mb-1.5 block";

  return (
    <div className={cn(
      "w-full",
      isIPhone && "ios-mobile-layout"
    )}>
      {/* STUDIO EXIT NAV - iOS safe area aware */}
      <motion.nav 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: DURATION.slow, ease: EASING.out }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[150] px-6 md:px-12 py-4 md:py-5 flex items-center justify-between bg-white border-b border-ink/10",
          isIPhone && "pt-[calc(env(safe-area-inset-top,0px)+16px)]"
        )}
      >
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
            <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/60">{dict.checkout.returnTo}</span>
            <span className="text-xs md:text-[10px] font-medium uppercase tracking-[0.1em] text-ink group-hover:text-rose transition-colors">{dict.checkout.product}</span>
          </div>
        </button>
        <div className="font-display font-medium text-2xl italic tracking-tighter text-rose absolute left-1/2 -translate-x-1/2 uppercase select-none hidden md:block">NINOC</div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end leading-none mr-2">
              <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-widest text-emerald-600">{dict.checkout.secureProtocol}</span>
              <span className="text-xs md:text-[9px] font-medium uppercase tracking-tighter text-ink/60">{dict.checkout.transactionSpec}</span>
           </div>
           <ShieldCheck size={18} className="text-emerald-500" />
        </div>
      </motion.nav>

      <div className={cn(
        "px-3 md:px-8 lg:px-12 w-full max-w-[1600px]",
        // Mobile: stacked layout with bottom padding for CTA. Increased pt- to compensate for fixed header.
        isMobile ? "pt-24 pb-36 space-y-3" : "pt-24 pb-12 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-start"
      )}>
        {/* ORDER SUMMARY - Top on mobile for transparency */}
        {isMobile && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-0.5">
              <span className="text-xs md:text-[9px] font-display font-medium italic text-ink/50">00</span>
              <h2 className="text-xs md:text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">{dict.checkout.summary}</h2>
            </div>
            
            <div className="bg-white border border-ink/20 rounded-none p-4 space-y-4 shadow-sm">
              <div className="space-y-2 border-b border-ink/10 pb-3">
                <div className="flex justify-between items-center text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/60">
                  <span>{dict.checkout.subtotal}</span>
                  <span>IDR {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/60">
                  <span>{dict.checkout.logisticsFee}</span>
                  <span className={shippingCost > 0 ? "text-ink font-semibold" : "text-rose italic"}>
                    {shippingCost > 0 ? `+ IDR ${shippingCost.toLocaleString('id-ID')}` : dict.checkout.selectionRequired}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/60">
                  <span>{dict.checkout.platformFee}</span>
                  <span>+ IDR {platformFee.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b border-ink/10 pb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] text-ink/50 leading-none mb-1">{dict.checkout.totalInvestment}</span>
                  <span className="text-lg md:text-xl font-display font-semibold italic text-emerald-700 leading-none">IDR {finalTotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Collapsible Item List for Mobile */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                  className="w-full flex items-center justify-between text-[10px] md:text-[8px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink transition-colors py-2 border-b border-ink/5"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={12} />
                    {isMobileSummaryOpen ? 'Sembunyikan Item' : `Lihat ${items.length} Item`}
                  </span>
                  <motion.div animate={{ rotate: isMobileSummaryOpen ? 180 : 0 }}>
                    <ChevronDown size={14} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isMobileSummaryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div id="mobile-item-list" className="pt-3 space-y-3 pb-2">
                        {items.map((item) => (
                          <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 items-center justify-between">
                            <div className="flex gap-3 items-center flex-1 min-w-0">
                              <div className="w-8 h-8 bg-ink/5 flex-shrink-0 relative border border-ink/5">
                                <CheckoutCartItemImage item={item} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-[9px] font-medium uppercase line-clamp-1 text-ink">{item.name}</p>
                                <div className="flex items-center gap-1">
                                  <p className="text-[10px] md:text-[7px] font-medium text-ink/50 uppercase">{item.color ? `Color ${item.color} | ` : ''}Size {item.size} | Qty {item.quantity}</p>
                                  {(item.size_surcharge || 0) > 0 && (
                                    <span className="text-[6px] font-medium text-rose bg-rose/10 px-1 py-0.5 rounded-sm">+15K</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setItemToDelete({ id: item.id, name: item.name, size: item.size, color: item.color })}
                              className="p-1.5 text-ink/50 hover:text-rose transition-colors flex-shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* FORM AREA */}
        <div className={cn(isMobile ? "space-y-3" : "space-y-6 w-full")}>
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 lg:space-y-6 relative z-10">
            
            {/* 01: IDENTITY */}
            <motion.section 
              className="space-y-1.5 lg:space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: DURATION.medium, ease: EASING.out }}
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-[9px] font-display font-medium italic text-ink/50">01</span>
                  <h2 className="text-xs md:text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">{dict.checkout.identity}</h2>
                </div>
                {userId ? (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-sm">
                    <User size={10} className="text-emerald-600" />
                    <span className="text-[9px] md:text-[8px] font-semibold uppercase tracking-widest text-emerald-700">Member</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-ink/5 border border-ink/10 px-2.5 py-1 rounded-sm">
                    <User size={10} className="text-ink/60" />
                    <span className="text-[9px] md:text-[8px] font-semibold uppercase tracking-widest text-ink/60">Guest</span>
                  </div>
                )}
              </div>
              
              <div className={cn("grid gap-[1px] bg-ink/40 border border-ink/40 rounded-none", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                <div className={cn("bg-white", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="first_name" className={labelClass}>{dict.checkout.firstName}</label>
                  <input id="first_name" required type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full bg-transparent text-xs font-semibold uppercase tracking-widest text-ink placeholder:text-ink/50 outline-none" placeholder="John" />
                </div>
                <div className={cn("bg-white border-l border-ink/40", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="last_name" className={labelClass}>{dict.checkout.lastName}</label>
                  <input id="last_name" required type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full bg-transparent text-xs font-semibold uppercase tracking-widest text-ink placeholder:text-ink/50 outline-none" placeholder="Doe" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/40", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="email" className={labelClass}>{userId ? 'Email (Akun Member)' : 'Email (Opsional)'}</label>
                  <input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} readOnly={!!userId} className={cn("w-full bg-transparent text-xs font-semibold tracking-wider text-ink placeholder:text-ink/50 outline-none", userId && "text-ink/60 cursor-not-allowed")} placeholder="your@email.com" />
                  {!userId && emailCheckStatus === 'checking' && <p className="text-[9px] md:text-[10px] text-ink/50 mt-1 animate-pulse">Memeriksa email...</p>}
                  {!userId && emailCheckStatus === 'registered' && <p className="text-[9px] text-rose font-medium mt-1">Email ini telah terdaftar. <Link href="/login" className="underline hover:text-rose/80">Login</Link> untuk menggunakan akun ini.</p>}
                  {!userId && emailCheckStatus === 'unregistered' && formData.email.length > 0 && <p className="text-[9px] text-emerald-600 font-medium mt-1">Email tersedia untuk Guest.</p>}
                  {userId && <p className="text-[9px] text-emerald-600 font-medium mt-1 flex items-center gap-1"><CheckCircle size={9} /> Data terisi otomatis dari akun Anda</p>}
                </div>
                <div className={cn("bg-white border-t border-l border-ink/40", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="phone" className={labelClass}>{dict.checkout.phoneRef}</label>
                  <input id="phone" required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent text-xs font-semibold uppercase tracking-widest text-ink placeholder:text-ink/50 outline-none" placeholder="0812 3456 7890" />
                </div>
                <div className={cn("bg-white border-t border-ink/40 col-span-1 md:col-span-2", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="referral_code" className={labelClass}>Promo / Referral Code</label>
                  <div className="flex gap-2 items-center mt-1">
                    <input id="referral_code" type="text" value={formData.referral_code || ''} onChange={(e) => { setFormData({...formData, referral_code: e.target.value}); setPromoError(''); }} className="w-full bg-transparent text-xs font-medium uppercase tracking-widest text-ink placeholder:text-ink/50 outline-none" placeholder="Misal: NINOCPAYDAY" />
                    <button type="button" onClick={applyPromo} disabled={promoLoading || !formData.referral_code} className="px-3 py-1.5 bg-ink text-white text-xs md:text-[9px] uppercase tracking-wider disabled:opacity-50 rounded-sm">
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="text-xs md:text-[9px] text-red-500 mt-1.5 font-medium">{promoError}</p>}
                  {promoApplied && <p className="text-xs md:text-[9px] text-emerald-600 mt-1.5 font-medium">{promoApplied.message}</p>}
                </div>
              </div>
            </motion.section>

            {/* 02: ADDRESS */}
            <motion.section 
              className="space-y-1.5 lg:space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: DURATION.medium, ease: EASING.out }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-ink/10 pb-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-[9px] font-display font-medium italic text-ink/50">02</span>
                  <h2 className="text-xs md:text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">{dict.checkout.destination}</h2>
                </div>
                {/* Address Type Selector */}
                <div className="flex bg-ink/5 p-1">
                  <button 
                    type="button"
                    onClick={() => switchAddressType('Home')}
                    className={cn("px-4 py-1 text-[10px] md:text-[8px] font-semibold uppercase tracking-widest transition-colors", formData.address_type === 'Home' ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink")}
                  >
                    Rumah / Home
                  </button>
                  <button 
                    type="button"
                    onClick={() => switchAddressType('Office')}
                    className={cn("px-4 py-1 text-[10px] md:text-[8px] font-semibold uppercase tracking-widest transition-colors", formData.address_type === 'Office' ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink")}
                  >
                    Kantor / Office
                  </button>
                </div>
              </div>

              <div className={cn("grid gap-[1px] bg-ink/5 border border-ink/5 rounded-none", isMobile ? "grid-cols-1" : "grid-cols-6")}>
                <div className={cn("bg-white", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-6 p-2.5")}>
                  <label htmlFor="street" className={labelClass}>{dict.checkout.street}</label>
                  <input id="street" required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className={inputClass} placeholder="Jl. Sudirman No. 1" />
                </div>

                {/* Combined No, RT, RW into 1 row */}
                <div className={cn("grid bg-white border-t border-ink/5", isMobile ? "col-span-1 grid-cols-3" : "col-span-6 grid-cols-6")}>
                  <div className={cn(isMobile ? "col-span-1 px-2 py-1.5" : "col-span-2 p-2.5")}>
                    <label htmlFor="house_number" className={labelClass}>No</label>
                    <input id="house_number" required type="text" value={formData.house_number} onChange={(e) => setFormData({...formData, house_number: e.target.value})} className={inputClass} placeholder="10" />
                  </div>
                  <div className={cn("border-l border-ink/5", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-2 p-2.5")}>
                    <label htmlFor="rt" className={labelClass}>RT</label>
                    <input id="rt" required type="text" value={formData.rt} onChange={(e) => setFormData({...formData, rt: e.target.value})} className={inputClass} placeholder="001" />
                  </div>
                  <div className={cn("border-l border-ink/5", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-2 p-2.5")}>
                    <label htmlFor="rw" className={labelClass}>RW</label>
                    <input id="rw" required type="text" value={formData.rw} onChange={(e) => setFormData({...formData, rw: e.target.value})} className={inputClass} placeholder="005" />
                  </div>
                </div>

                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-3 p-2.5")}>
                  <label htmlFor="province" className={labelClass}>{dict.checkout.province} {loadingLoc.p && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="province" required value={formData.province} onChange={(e) => handleProvinceChange(e.target.value)} className={selectClass} disabled={loadingLoc.p}>
                    <option value="">SELECT PROVINCE</option>
                    {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-3 p-2.5 border-l border-ink/5")}>
                  <label htmlFor="city" className={labelClass}>{dict.checkout.city} {loadingLoc.c && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="city" required value={formData.city} onChange={(e) => handleCityChange(e.target.value)} className={selectClass} disabled={!formData.province || loadingLoc.c}>
                    <option value="">SELECT CITY</option>
                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t border-ink/5", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-3 p-2.5")}>
                  <label htmlFor="kecamatan" className={labelClass}>Kecamatan {loadingLoc.d && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="kecamatan" required value={formData.kecamatan} onChange={(e) => handleDistrictChange(e.target.value)} className={selectClass} disabled={!formData.city || loadingLoc.d}>
                    <option value="">SELECT KECAMATAN</option>
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t relative z-20", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-3 p-2.5 border-l border-ink/5")}>
                  <label htmlFor="kelurahan" className={labelClass}>Kelurahan {loadingLoc.v && <span className="animate-pulse text-rose">...</span>}</label>
                  <select id="kelurahan" required value={formData.kelurahan} onChange={(e) => setFormData({...formData, kelurahan: e.target.value})} className={cn(selectClass, "relative z-20")} disabled={!formData.kecamatan || loadingLoc.v}>
                    <option value="">SELECT KELURAHAN</option>
                    {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
                <div className={cn("bg-white border-t", isMobile ? "col-span-1 px-2 py-1.5" : "col-span-2 p-2.5 border-l border-ink/5")}>
                  <label htmlFor="postal_code" className={labelClass}>Kode Pos / Postal Code</label>
                  <input id="postal_code" required type="text" value={formData.postal_code} onChange={(e) => setFormData({...formData, postal_code: e.target.value.replace(/[^0-9]/g, '')})} className={inputClass} placeholder="12345" maxLength={5} />
                </div>
              </div>

              {/* LOCATION PICKER (Gojek/Grab requirement) */}
              <div className="mt-4">
                <LocationPicker 
                  initialLat={formData.latitude}
                  initialLng={formData.longitude}
                  addressParts={[formData.street, formData.kelurahan, formData.kecamatan, formData.city, formData.province, 'Indonesia'].filter(Boolean)}
                  searchQuery={[formData.street, formData.kelurahan, formData.kecamatan, formData.city, formData.province, 'Indonesia'].filter(Boolean).join(', ')}
                  onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                />
              </div>
            </motion.section>

            {/* 03: SHIPPING */}
            <motion.section 
              className="space-y-1.5 lg:space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: DURATION.medium, ease: EASING.out }}
            >
              <div className="flex items-center gap-2 border-b border-ink/10 pb-0.5">
                <span className="text-xs md:text-[9px] font-display font-medium italic text-ink/50">03</span>
                <h2 className="text-xs md:text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">{dict.checkout.logisticsSelection}</h2>
              </div>
              {items.length > 0 && items[0]?.warehouse_name && (
                <div className="px-3 py-2.5 bg-emerald-50/80 border border-emerald-200/60 rounded-lg flex items-start gap-2.5 mt-1.5">
                  <span className="text-emerald-600 text-sm mt-0.5">🚚</span>
                  <div className="flex-1">
                    <p className="text-[11px] md:text-[9px] font-medium text-emerald-800">
                      Pesanan ini akan dikirim dari <strong>{items[0].warehouse_name}</strong>
                    </p>
                    <p className="text-[10px] md:text-[8px] text-emerald-600/80 mt-0.5">
                      Produk dari lokasi lain perlu dipesan terpisah
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {loadingShipping && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink animate-pulse">{dict.checkout.calculating}</span>
                  </div>
                )}
                {displayOptions.length === 0 && !loadingShipping && formData.kecamatan && (
                  <div className="col-span-3 py-10 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border border-ink/20 rounded-full flex items-center justify-center mb-1">
                      <span className="text-ink/50 text-xs md:text-[10px]">!</span>
                    </div>
                    <span className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60 text-center px-4">{dict.checkout.completeLocation}</span>
                  </div>
                )}
                {fnbNotice && (
                  <div className="col-span-3 mb-2 p-3 bg-amber-50/95 border border-amber-300/80 rounded-lg flex items-start gap-2.5 shadow-sm">
                    <span className="text-amber-600 text-sm mt-0.5">☕</span>
                    <div className="flex-1">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-900 mb-0.5">Pengiriman Khusus F&B / Pantry (Bandung Area)</h5>
                      <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed">{fnbNotice}</p>
                    </div>
                  </div>
                )}
                {displayOptions.map((option) => {
                  const methodId = `${option.courier_name} ${option.courier_service_name}`;
                  const isSelected = shippingMethod === methodId;
                  return (
                    <React.Fragment key={`${option.company}-${option.courier_service_name}`}>
                      <button
                        type="button"
                        onClick={() => handleShippingChange(methodId, option.price)}
                        className={cn(
                          "relative p-4 transition-all duration-200 border text-left flex flex-col gap-2.5 justify-between min-h-[120px] rounded-none cursor-pointer w-full",
                          isSelected
                            ? "bg-ink border-ink text-white shadow-lg shadow-ink/10"
                            : "bg-white border-ink/15 text-ink hover:border-ink/40 hover:bg-ink/[0.01]"
                        )}
                      >
                        {/* Header: Logo, Name & Service Code */}
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2">
                            <CourierLogo courier={option.courier_name} className="h-4 bg-white px-1.5 py-0.5 rounded-[2px]" />
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", isSelected ? "text-white" : "text-ink/80")}>
                              {option.courier_name}
                            </span>
                          </div>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider", isSelected ? "bg-white/20 text-white" : "bg-ink/5 text-ink/70")}>
                            {option.courier_service_name}
                          </span>
                        </div>

                        {/* Middle: Clear & Transparent Logistics Information */}
                        <div className="flex flex-col gap-1 w-full">
                          <span className={cn("text-[11px] font-bold uppercase tracking-wider leading-snug", isSelected ? "text-white" : "text-ink")}>
                            {getEstimatedDeliveryDate(option.duration, isLateForInstant, option.courier_name)}
                          </span>
                          {option.description && (
                            <span className={cn("text-[9px] font-medium leading-relaxed", isSelected ? "text-white/60" : "text-ink/50")}>
                              {option.description}
                            </span>
                          )}
                        </div>

                        {/* Footer: Price & Selection Status */}
                        <div className="flex items-end justify-between w-full mt-1 pt-2 border-t border-dashed border-current/10">
                          <span className={cn("text-xs font-display font-medium italic", isSelected ? "text-rose-300" : "text-rose-600")}>
                            IDR {option.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          {isSelected && (
                            <CheckCircle size={10} className="text-white shrink-0" />
                          )}
                        </div>
                      </button>
                      {/* LATE SLA WARNING */}
                      {shippingMethod === methodId && (option.courier_name.toLowerCase().includes('gosend') || option.courier_name.toLowerCase().includes('grab') || option.duration.toLowerCase().includes('same day') || option.duration.toLowerCase().includes('instant')) && isLateForInstant && (
                        <div className="col-span-1 md:col-span-3 p-3 bg-rose-50 border border-rose-200 flex items-start gap-2.5 mt-1">
                          <AlertTriangle size={14} className="text-rose shrink-0 mt-0.5" />
                          <p className="text-[10px] md:text-[9px] font-medium text-rose-900 uppercase tracking-wide leading-tight">
                            Melewati batas operasional (15:00 WIB). Pesanan Instant/SameDay ini akan diproses & dikirim BESOK HARI.
                          </p>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.section>
          </form>
        </div>
        {/* ORDER SUMMARY - Sidebar on desktop only */}
        {!isMobile && (
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: DURATION.medium, ease: EASING.out }}
          >
            <div className="sticky top-20 space-y-4">
              <div className="flex items-center gap-2 border-b border-ink/20 pb-0.5">
                <span className="text-xs md:text-[9px] font-display font-medium italic text-ink/60">00</span>
                <h2 className="text-xs md:text-[10px] font-display font-medium italic uppercase tracking-widest text-ink">Summary</h2>
              </div>
              
              <div className="bg-white border border-ink/20 rounded-none p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-ink/20 pb-2">
                  <div className="flex items-center gap-3">
                     <ShoppingBag size={12} className="text-ink/60" />
                     <h3 className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink">{dict.checkout.finalSelection}</h3>
                  </div>
                  <span className="text-[11px] md:text-[8px] font-medium text-ink/50 italic">{items.length} {dict.checkout.pieces}</span>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 items-center group">
                      <div className="w-10 h-10 bg-ink/5 rounded-none overflow-hidden flex-shrink-0 border border-ink/5 group-hover:border-rose/20 transition-colors relative">
                        <CheckoutCartItemImage item={item} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-[11px] font-medium uppercase line-clamp-2 text-ink">{item.name}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs md:text-[9px] font-medium text-ink/60 uppercase tracking-tight">{item.color ? `Color ${item.color} | ` : ''}Size {item.size} | Qty {item.quantity}</p>
                          {(item.size_surcharge || 0) > 0 && (
                            <span className="text-[10px] md:text-[7px] font-medium text-rose bg-rose/10 px-1 py-0.5 rounded-sm">+15K</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-display font-medium italic text-ink/80">IDR {((item.price + (item.size_surcharge || 0)) * item.quantity).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                          {(item.size_surcharge || 0) > 0 && (
                            <span className="text-[10px] md:text-[7px] text-ink/50 font-medium">incl. +{(item.size_surcharge * item.quantity).toLocaleString('id-ID')} surcharge</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: item.id, name: item.name, size: item.size, color: item.color })}
                          className="p-1.5 text-ink/20 hover:text-rose hover:bg-rose/5 rounded-sm transition-all flex-shrink-0"
                          title="Remove from cart"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-ink/20">
                  <div className="flex justify-between text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
                    <span>{dict.checkout.subtotal}</span>
                    <span>IDR {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {promoApplied && promoApplied.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs md:text-[10px] uppercase tracking-widest text-emerald-600 mt-1">
                    <span>Promo ({promoApplied.code})</span>
                    <span className="font-medium">-IDR {promoApplied.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                  )}
                  <div className="flex justify-between text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
                    <span className="flex items-center gap-1.5">
                      Logistics
                      {shippingMethod && (
                        <span className="text-[10px] md:text-[7px] text-rose font-bold px-1.5 py-0.5 bg-rose/5 border border-rose/10 rounded-sm">
                          {shippingMethod.toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className={cn("italic", shippingCost > 0 ? "text-ink" : "text-rose")}>
                       {shippingCost > 0 ? `+ IDR ${shippingCost.toLocaleString('id-ID')}` : dict.checkout.actionRequired}
                    </span>
                  </div>



                  <div className="flex justify-between text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink">
                    <span>{dict.checkout.platformFee}</span>
                    <span className="italic text-ink">+ IDR {platformFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-6 flex flex-col items-center border-t border-ink/20">
                  <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.5em] text-ink/60 mb-1">{dict.checkout.totalInvestment}</span>
                  <span className="text-xl md:text-3xl font-display font-semibold italic text-rose leading-none">IDR {finalTotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>

                {/* CATALOG */}
                <div className="pt-6">
                  <button
                    form="checkout-form"
                    disabled={isProcessing || !shippingMethod || !snapLoaded}
                    className={cn(
                      "w-full py-4 rounded-none text-xs md:text-[11px] font-medium uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3",
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
                
              </div>

              {/* SECURITY SPECS */}
              <div className="flex flex-col items-center gap-4 opacity-70">
                 <div className="flex items-center justify-center gap-6">
                    <svg viewBox="0 0 24 24" className="h-5 w-auto text-ink/80" fill="currentColor">
                      <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>
                    </svg>
                    <svg viewBox="0 0 24 24" className="h-6 w-auto text-ink/80" fill="currentColor">
                      <path d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031zm5.241-13.447c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416zM12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z"/>
                    </svg>
                    <ShieldCheck size={28} className="text-ink/60" />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.25em] text-center text-ink/50 leading-relaxed">Secured by 256-bit SSL Encryption</p>
                    <p className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.1em] text-center text-ink/50">Official NINOC Merchant Partner</p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile BottomCTA - Show on ALL mobile devices (iOS + Android) */}
      {isMobile && (
        <BottomCTA
          text="Checkout"
          isLoading={isProcessing}
          disabled={!shippingMethod || !snapLoaded}
          formId="checkout-form"
          totalPrice={finalTotal}
        />
      )}

      {/* CUSTOM MIDTRANS EMBED OVERLAY */}
      {paymentToken && !isRedirecting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-cr/90 backdrop-blur-md p-2 sm:p-4 md:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-[420px] lg:max-w-[520px] bg-white border border-ink/10 shadow-2xl rounded-md flex flex-col relative animate-in zoom-in-95 duration-500 max-h-[92vh] sm:max-h-[90vh] lg:max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-3 md:p-4 border-b border-ink/5 bg-ink/[0.02] shrink-0">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs md:text-[10px] font-semibold uppercase tracking-widest text-ink">Payment</span>
                  <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/60">Secured by Midtrans</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setPaymentToken(null);
                    setIsProcessing(false);
                    isProcessingRef.current = false;
                  }} 
                  className="px-3 py-1.5 border border-ink/10 text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-ink hover:bg-rose hover:text-white hover:border-rose transition-colors rounded-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
            {/* Snap Container */}
            <div id="snap-container" className="w-full h-[500px] sm:h-[550px] lg:h-[700px] overflow-y-auto bg-white scrollbar-thin"></div>
          </div>
        </div>
      )}

      {/* REDIRECTING OVERLAY */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white p-4">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle size={24} className="text-emerald-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-medium italic uppercase tracking-tight text-ink mb-2">Memproses Pesanan</h2>
            <p className="text-xs md:text-[10px] text-ink/50 font-medium uppercase tracking-[0.2em] leading-relaxed mb-8">
              Menyiapkan struk transaksi Anda...
            </p>
            <div className="w-48 h-1 bg-ink/5 overflow-hidden rounded-full">
              <div className="h-full bg-rose w-1/3 animate-[slideRight_0.8s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {itemToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setItemToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white border border-ink/10 p-6 max-w-sm w-full shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center text-rose flex-shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="space-y-1 text-left">
                  <h3 className="text-xs md:text-[10px] font-display font-medium italic uppercase tracking-wider text-ink">Hapus Produk?</h3>
                  <p className="text-[11px] md:text-[9px] text-ink/60 uppercase tracking-widest leading-relaxed">
                    Apakah Anda yakin ingin menghapus <span className="font-semibold text-ink">{itemToDelete.name}</span> {itemToDelete.size ? `(Ukuran: ${itemToDelete.size})` : ''} dari keranjang belanja Anda?
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 bg-white border border-ink/10 text-ink text-[10px] font-semibold uppercase tracking-widest hover:bg-ink/5 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeItem(itemToDelete.id, itemToDelete.size, itemToDelete.color);
                    setItemToDelete(null);
                    toast.success('Produk berhasil dihapus.');
                  }}
                  className="flex-1 py-2.5 bg-rose text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-ink transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
