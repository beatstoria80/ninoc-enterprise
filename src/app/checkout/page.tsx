"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShoppingBag, ArrowLeft, Lock, Info, CheckCircle, AlertTriangle, User, Trash2 } from 'lucide-react';
import { useCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════
// EMIL KOWALSKI ANIMATION ENGINE — CHECKOUT
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
};

const DURATION = {
  micro: 0.1,
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
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
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, removeItem } = useCart();
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

  // Promo Code State
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState<{ type: string; code: string; discountAmount: number; message: string; affiliateId?: string; } | null>(null);
  const [promoError, setPromoError] = useState('');

  // Dynamic Shipping State
  const [dynamicShippingOptions, setDynamicShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState<boolean>(false);

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
            weight: 100, // default 100g per item
          }));

          const res = await fetch('/api/biteship/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destination_area_name: `${formData.city} ${formData.kecamatan}`,
              destination_area_id: formData.kecamatan,
              items: biteshipItems,
              couriers: 'jne,grab,gojek',
            })
          });
          const data = await res.json();
          if (data.success && data.pricing) {
            setDynamicShippingOptions(data.pricing);
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
  }, [formData.kecamatan, formData.city, items]);

  const displayOptions = dynamicShippingOptions;

  const handleShippingChange = (id: string, price: number) => {
    setShippingMethod(id);
    setShippingCost(price);
  };

  // --- SLA ENFORCEMENT ---
  // Detect if current time in WIB is >= 15:00
  const currentHourWIB = parseInt(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: '2-digit', hour12: false }));
  const isLateForInstant = currentHourWIB >= 15;

  const subtotal = totalPrice();
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

    const fullAddress = `${formData.street} No. ${formData.house_number}, RT ${formData.rt}/RW ${formData.rw}, Kel. ${formData.kelurahan}, Kec. ${formData.kecamatan}, ${formData.city}, ${formData.province}, ${formData.postal_code}`.trim().replace(/,\s*$/, '');
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

        if (isMobile && typeof snapObj.pay === 'function') {
          snapObj.pay(paymentToken, callbacks);
        } else if (typeof snapObj.embed === 'function') {
          snapObj.embed(paymentToken, { embedId: 'snap-container', ...callbacks });
        }
      }
    }
  }, [paymentToken, snapLoaded, router, createdOrderId, createdOrderNumber, shippingMethod, clearCart, isMobile, userId]);

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

  const inputClass = "w-full bg-white py-1.5 px-2 text-xs font-medium uppercase tracking-widest text-ink outline-none transition-all border border-ink/20 rounded-none placeholder:text-ink/30 focus:border-rose/40";
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
            <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">{dict.checkout.returnTo}</span>
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
        "px-3 md:px-12 w-full max-w-[1600px] mx-auto",
        // Mobile: stacked layout with bottom padding for CTA. Increased pt- to compensate for fixed header.
        isMobile ? "pt-24 pb-24 space-y-3" : "pt-28 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
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
                  <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30 leading-none mb-1">{dict.checkout.totalInvestment}</span>
                  <span className="text-lg md:text-xl font-display font-medium italic text-rose leading-none">IDR {finalTotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Always Visible Item List for Mobile */}
              <div id="mobile-item-list" className="pt-2 space-y-3">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 items-center justify-between">
                    <div className="flex gap-3 items-center flex-1 min-w-0">
                      <div className="w-8 h-8 bg-ink/5 flex-shrink-0 relative border border-ink/5">
                        {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-[9px] font-medium uppercase line-clamp-1 text-ink">{item.name}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] md:text-[7px] font-medium text-ink/30 uppercase">{item.color ? `Color ${item.color} | ` : ''}Size {item.size} | Qty {item.quantity}</p>
                          {(item.size_surcharge || 0) > 0 && (
                            <span className="text-[6px] font-medium text-rose bg-rose/10 px-1 py-0.5 rounded-sm">+15K</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemToDelete({ id: item.id, name: item.name, size: item.size, color: item.color })}
                      className="p-1.5 text-ink/30 hover:text-rose transition-colors flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FORM AREA */}
        <div className={cn(isMobile ? "space-y-3" : "lg:col-span-6 space-y-6")}>
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
                    <User size={10} className="text-ink/40" />
                    <span className="text-[9px] md:text-[8px] font-semibold uppercase tracking-widest text-ink/40">Guest</span>
                  </div>
                )}
              </div>
              
              <div className={cn("grid gap-[1px] bg-ink/40 border border-ink/40 rounded-none", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                <div className={cn("bg-white", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="first_name" className={labelClass}>{dict.checkout.firstName}</label>
                  <input id="first_name" required type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full bg-transparent text-xs font-semibold uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none" placeholder="John" />
                </div>
                <div className={cn("bg-white border-l border-ink/40", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="last_name" className={labelClass}>{dict.checkout.lastName}</label>
                  <input id="last_name" required type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full bg-transparent text-xs font-semibold uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none" placeholder="Doe" />
                </div>
                <div className={cn("bg-white border-t border-l border-ink/40", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="email" className={labelClass}>{userId ? 'Email (Akun Member)' : 'Email (Opsional)'}</label>
                  <input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} readOnly={!!userId} className={cn("w-full bg-transparent text-xs font-semibold tracking-wider text-ink placeholder:text-ink/30 outline-none", userId && "text-ink/60 cursor-not-allowed")} placeholder="your@email.com" />
                  {!userId && emailCheckStatus === 'checking' && <p className="text-[9px] md:text-[10px] text-ink/50 mt-1 animate-pulse">Memeriksa email...</p>}
                  {!userId && emailCheckStatus === 'registered' && <p className="text-[9px] text-rose font-medium mt-1">Email ini telah terdaftar. <Link href="/login" className="underline hover:text-rose/80">Login</Link> untuk menggunakan akun ini.</p>}
                  {!userId && emailCheckStatus === 'unregistered' && formData.email.length > 0 && <p className="text-[9px] text-emerald-600 font-medium mt-1">Email tersedia untuk Guest.</p>}
                  {userId && <p className="text-[9px] text-emerald-600 font-medium mt-1 flex items-center gap-1"><CheckCircle size={9} /> Data terisi otomatis dari akun Anda</p>}
                </div>
                <div className={cn("bg-white border-t border-l border-ink/40", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="phone" className={labelClass}>{dict.checkout.phoneRef}</label>
                  <input id="phone" required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent text-xs font-semibold uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none" placeholder="0812 3456 7890" />
                </div>
                <div className={cn("bg-white border-t border-ink/40 col-span-1 md:col-span-2", isMobile ? "px-2 py-1.5" : "p-2.5")}>
                  <label htmlFor="referral_code" className={labelClass}>Promo / Referral Code</label>
                  <div className="flex gap-2 items-center mt-1">
                    <input id="referral_code" type="text" value={formData.referral_code || ''} onChange={(e) => { setFormData({...formData, referral_code: e.target.value}); setPromoError(''); }} className="w-full bg-transparent text-xs font-medium uppercase tracking-widest text-ink placeholder:text-ink/30 outline-none" placeholder="Misal: NINOCPAYDAY" />
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
                    className={cn("px-4 py-1 text-[10px] md:text-[8px] font-semibold uppercase tracking-widest transition-colors", formData.address_type === 'Home' ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink")}
                  >
                    Rumah / Home
                  </button>
                  <button 
                    type="button"
                    onClick={() => switchAddressType('Office')}
                    className={cn("px-4 py-1 text-[10px] md:text-[8px] font-semibold uppercase tracking-widest transition-colors", formData.address_type === 'Office' ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink")}
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

              <div className={cn(
                "gap-[1px] bg-ink/5 border border-ink/5 rounded-none relative",
                isMobile ? "flex flex-col max-h-[40vh] overflow-y-auto no-scrollbar" : "grid grid-cols-3"
              )}>
                {loadingShipping && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink animate-pulse">{dict.checkout.calculating}</span>
                  </div>
                )}
                {displayOptions.length === 0 && !loadingShipping && formData.kecamatan && (
                  <div className="col-span-3 py-10 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border border-ink/20 rounded-full flex items-center justify-center mb-1">
                      <span className="text-ink/30 text-xs md:text-[10px]">!</span>
                    </div>
                    <span className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 text-center px-4">{dict.checkout.completeLocation}</span>
                  </div>
                )}
                {displayOptions.map((option) => {
                  const methodId = `${option.courier_name} ${option.courier_service_name}`;
                  return (
                  <React.Fragment key={`${option.company}-${option.courier_service_name}`}>
                  <button
                    type="button"
                    onClick={() => handleShippingChange(methodId, option.price)}
                    className={cn(
                      "relative transition-all bg-white border-l-2 cursor-pointer w-full text-left",
                      isMobile
                        ? "flex items-center justify-between py-3 px-3 min-h-[48px] active:bg-ink/[0.03]"
                        : "group flex flex-col items-center py-2.5 px-1 border-l-0 border-t-2",
                      shippingMethod === methodId
                        ? "bg-ink text-white border-ink"
                        : "border-transparent hover:bg-ink/[0.01]"
                    )}
                  >
                    {/* Mobile: horizontal layout */}
                    {isMobile ? (
                      <>
                        <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <CourierLogo courier={option.courier_name} className="h-4 bg-white px-1 py-0.5 rounded-[2px]" />
                            <span className={cn("text-xs md:text-[10px] font-medium uppercase tracking-widest truncate w-full", shippingMethod === methodId ? "text-white" : "text-ink/70")}>{option.courier_name}</span>
                          </div>
                          <span className={cn("text-[11px] md:text-[8px] font-medium uppercase tracking-widest truncate w-full", shippingMethod === methodId ? "text-white/60" : "text-ink/30")}>{option.courier_service_name} â€¢ {option.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-sm md:text-[11px] font-display font-medium italic", shippingMethod === methodId ? "text-white" : "text-ink")}>
                            IDR {option.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          {shippingMethod === methodId && (
                            <div className="w-4 h-4 bg-white rounded-none flex items-center justify-center shrink-0">
                              <CheckCircle size={10} className="text-ink" />
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Desktop: vertical layout with hover tooltip */
                      <>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CourierLogo courier={option.courier_name} className="h-4 bg-white px-1 py-0.5 rounded-[2px]" />
                          <span className={cn("text-xs md:text-[9px] font-medium uppercase tracking-widest", shippingMethod === methodId ? "text-white" : "text-ink/60")}>{option.courier_name}</span>
                          <div className={cn("transition-colors relative z-20", shippingMethod === methodId ? "text-white/60 hover:text-white" : "text-ink/30 hover:text-ink")}>
                            <Info size={10} />
                          </div>
                        </div>
                        <span className={cn("text-sm md:text-[11px] font-display font-medium italic", shippingMethod === methodId ? "text-white" : "text-ink")}>
                          IDR {option.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>

                        {/* Pop-up Info (Tooltip) - Desktop only */}
                        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[180px] bg-ink border border-ink shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 origin-bottom scale-95 group-hover:scale-100 pointer-events-none flex flex-col gap-1.5 text-left">
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-rose">{option.courier_name}</span>
                            <span className="text-[10px] md:text-[7px] border border-white/20 px-1 py-0.5 text-white/80 uppercase tracking-widest">{option.courier_service_name}</span>
                          </div>
                          <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-white/60">EST: <span className="text-white">{option.duration}</span></span>
                          <span className="text-[11px] md:text-[8px] font-medium tracking-[0.02em] text-white/50 leading-relaxed">{option.description}</span>
                          
                          {/* Triangle Arrow */}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-ink rotate-45 border-b border-r border-ink"></div>
                        </div>
                      </>
                    )}
                  </button>
                  {/* LATE SLA WARNING */}
                  {shippingMethod === methodId && (option.courier_name.toLowerCase().includes('gosend') || option.courier_name.toLowerCase().includes('grab') || option.duration.toLowerCase().includes('same day') || option.duration.toLowerCase().includes('instant')) && isLateForInstant && (
                    <div className={cn("col-span-1 lg:col-span-1 p-2 bg-rose/5 border-t border-rose/10 flex items-start gap-2", isMobile ? "" : "border-l-0")}>
                      <AlertTriangle size={12} className="text-rose shrink-0 mt-0.5" />
                      <p className="text-[10px] md:text-[8px] font-medium text-rose/90 uppercase tracking-wide leading-tight">
                        Melewati batas operasional (15:00 WIB). Pesanan Instant/SameDay ini akan diproses & dikirim BESOK HARI.
                      </p>
                    </div>
                  )}
                  </React.Fragment>
                )})}
              </div>
            </motion.section>
          </form>
        </div>        {/* ORDER SUMMARY - Sidebar on desktop only */}
        {!isMobile && (
          <motion.div 
            className="lg:col-span-4 lg:pl-12"
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
                     <ShoppingBag size={12} className="text-ink/40" />
                     <h3 className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink">{dict.checkout.finalSelection}</h3>
                  </div>
                  <span className="text-[11px] md:text-[8px] font-medium text-ink/50 italic">{items.length} {dict.checkout.pieces}</span>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 items-center group">
                      <div className="w-10 h-10 bg-ink/5 rounded-none overflow-hidden flex-shrink-0 border border-ink/5 group-hover:border-rose/20 transition-colors relative">
                        {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-[11px] font-medium uppercase line-clamp-2 text-ink">{item.name}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs md:text-[9px] font-medium text-ink/40 uppercase tracking-tight">{item.color ? `Color ${item.color} | ` : ''}Size {item.size} | Qty {item.quantity}</p>
                          {(item.size_surcharge || 0) > 0 && (
                            <span className="text-[10px] md:text-[7px] font-medium text-rose bg-rose/10 px-1 py-0.5 rounded-sm">+15K</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-display font-medium italic text-ink/80">IDR {((item.price + (item.size_surcharge || 0)) * item.quantity).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                          {(item.size_surcharge || 0) > 0 && (
                            <span className="text-[10px] md:text-[7px] text-ink/30 font-medium">incl. +{(item.size_surcharge * item.quantity).toLocaleString('id-ID')} surcharge</span>
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
                  <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.5em] text-ink/40 mb-1">{dict.checkout.totalInvestment}</span>
                  <span className="text-xl md:text-3xl font-display font-medium italic text-rose leading-none">IDR {finalTotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
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
                 <div className="flex items-center justify-center gap-10 grayscale brightness-90">
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Visa_2021.svg" alt="Visa" width={40} height={14} className="h-3.5 w-auto object-contain" unoptimized />
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={40} height={22} className="h-4.5 w-auto object-contain" unoptimized />
                    <Image src="https://midtrans.com/assets/img/midtrans-logo.svg" alt="Midtrans" width={60} height={20} className="h-3.5 w-auto object-contain" unoptimized />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.25em] text-center text-ink/50 leading-relaxed">Secured by 256-bit SSL Encryption</p>
                    <p className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.1em] text-center text-ink/30">Official NINOC Merchant Partner</p>
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
      {paymentToken && !isRedirecting && !isMobile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-cr/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white border border-ink/10 shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto md:h-auto md:min-h-[600px]">
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-ink/5 bg-ink/[0.02]">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-sm md:text-[11px] font-medium uppercase tracking-widest text-ink">Payment Authorization</span>
                  <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">Secured by Midtrans</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setPaymentToken(null);
                    setIsProcessing(false);
                  }} 
                  className="px-4 py-2 border border-ink/10 text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink hover:bg-rose hover:text-white hover:border-rose transition-colors"
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

      {/* REDIRECTING OVERLAY */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-cr/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle size={24} className="text-emerald-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-medium italic uppercase tracking-tight text-ink mb-2">Payment Confirmed</h2>
            <p className="text-xs md:text-[10px] text-ink/50 font-medium uppercase tracking-[0.2em] leading-relaxed mb-8">
              Preparing your transaction receipt...
            </p>
            <div className="w-48 h-1 bg-ink/5 overflow-hidden">
              <div className="h-full bg-rose w-1/2 animate-[slideRight_1s_ease-in-out_infinite]" />
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
