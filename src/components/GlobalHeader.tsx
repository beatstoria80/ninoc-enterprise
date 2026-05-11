"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, X, Trash2, ShieldCheck, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  slug: string;
}

export default function GlobalHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [_isSearching, setIsSearching] = useState(false);

    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    const handleScroll = () => {
      if (!scrollTimer) {
        scrollTimer = setTimeout(() => {
          setIsScrolled(window.scrollY > 20);
          scrollTimer = undefined;
        }, 16);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('customer_profiles')
        .select('avatar_url')
        .eq('user_id', userId)
        .single();
      if (data?.avatar_url) setProfileAvatar(data.avatar_url);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfileAvatar(null);
    });

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
      setSearchResults(data || []);
      setIsSearching(false);
    };
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!mounted) return null;
  if (
    pathname === '/checkout' ||
    pathname === '/login' ||
    pathname === '/onboarding' ||
    pathname === '/payment/success' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/profile/orders')
  ) {
    return null;
  }

  return (
    <>
      <nav className={cn(
        "fixed top-0 inset-x-0 z-[150] px-6 md:px-12 py-8 flex items-center justify-between transition-all duration-700",
        isScrolled ? "glass border-b border-ink/5 py-5" : "bg-transparent"
      )}>
        <Link href="/" className="cursor-pointer group flex flex-col">
          <div className="font-display font-medium text-3xl md:text-4xl italic tracking-tighter text-rose leading-none transition-transform group-hover:scale-105">NINOC</div>
        </Link>
        
        <div className="hidden lg:flex items-center gap-16 absolute left-1/2 -translate-x-1/2">
          <Link href="/shop" className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink/50 hover:text-rose transition-all relative group">
            <span>Shop</span>
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-rose transition-all group-hover:w-full" />
          </Link>
          <Link href="/collections" className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink/50 hover:text-rose transition-all relative group">
            <span>Collections</span>
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-rose transition-all group-hover:w-full" />
          </Link>
          <Link href="/craft" className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink/50 hover:text-rose transition-all relative group">
            <span>Craft</span>
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-rose transition-all group-hover:w-full" />
          </Link>
          <Link href="/about" className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink/50 hover:text-rose transition-all relative group">
            <span>About</span>
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-rose transition-all group-hover:w-full" />
          </Link>
        </div>

        <div className="flex items-center gap-6 md:gap-10">
          <button onClick={() => setIsSearchOpen(true)} className="text-ink/40 hover:text-rose transition-all">
            <Search size={20} strokeWidth={1.5} />
          </button>
          
          <Link href={user ? "/profile" : "/login"} className="text-ink/40 hover:text-rose transition-all">
            {profileAvatar ? (
              <div className="relative w-5 h-5">
                <Image src={profileAvatar} alt="Profile" fill className="object-cover rounded-full border border-ink/5" />
              </div>
            ) : (
              <User size={20} strokeWidth={1.5} />
            )}
          </Link>

          <button onClick={() => setIsCartOpen(true)} className="relative group flex items-center">
            <ShoppingCart size={20} strokeWidth={1.5} className="text-ink/40 group-hover:text-rose transition-all" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose text-white text-[8px] font-medium flex items-center justify-center rounded-full border border-white shadow-lg">
              {items.length}
            </div>
          </button>
        </div>
      </nav>

      {/* ASYMMETRIC 3-SECTOR ARCHIVAL INVENTORY OVERLAY */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[300] bg-cr noise flex flex-col overflow-hidden"
          >
            {/* Header Area */}
            <div className="px-6 md:px-12 py-10 flex items-center justify-between border-b border-ink/5">
              <div className="flex items-center gap-8">
                 <div className="font-display font-medium text-3xl italic tracking-tighter text-rose uppercase">Active Selection</div>
                 <div className="h-8 w-[1px] bg-ink/10 hidden md:block" />
                 <div className="hidden md:flex flex-col leading-none">
                    <span className="text-[8px] font-medium uppercase tracking-[0.4em] text-ink/30">Origin Archive</span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink/60">{items.length} Units</span>
                 </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-ink hover:bg-rose hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 h-full">
              
              {/* SECTOR 1: PRODUCT LIST (Grids 1-5) */}
              <div className="md:col-span-5 overflow-y-auto no-scrollbar border-r border-ink/5 px-6 md:px-12 py-12 space-y-12">
                {items.length > 0 ? (
                  <div className="space-y-10">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex gap-8 group">
                        <div className="w-28 h-36 bg-white rounded-xl overflow-hidden flex-shrink-0 relative border border-ink/5">
                          {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-700" />}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                               <h3 className="text-sm font-display font-medium italic uppercase tracking-tight">{item.name}</h3>
                               <button onClick={() => removeItem(item.id, item.size)} className="text-ink/10 hover:text-rose transition-all">
                                 <Trash2 size={16} />
                               </button>
                            </div>
                            <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20 italic">Archive Ref: #{item.id.slice(0, 8)}</p>
                          </div>
                          
                          <div className="flex items-end justify-between">
                            <div className="space-y-4">
                               <div className="flex items-center gap-3 bg-ink/5 px-3 py-1.5 rounded-lg w-fit">
                                  <button onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1, item.size)} className="text-ink/30 hover:text-rose"><Minus size={12} /></button>
                                  <span className="text-[10px] font-medium w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)} className="text-ink/30 hover:text-rose"><Plus size={12} /></button>
                               </div>
                               <div className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/60">Size {item.size}</div>
                            </div>
                            <div className="text-lg font-display font-medium italic text-rose">
                               Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                     <ShoppingCart size={48} />
                     <p className="text-[10px] font-medium uppercase tracking-[0.4em]">Empty Selection</p>
                  </div>
                )}
              </div>

              {/* SECTOR 2: SUMMARY & BUTTON (Grids 6-9) */}
              <div className="md:col-span-4 px-8 md:px-12 py-12 bg-white flex flex-col">
                {items.length > 0 && (
                  <div className="space-y-12 h-full flex flex-col">
                    <div className="space-y-8">
                       <p className="text-[9px] font-medium uppercase tracking-[0.5em] text-ink/20">Investment Summary</p>
                       <div className="space-y-5">
                          <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                             <span>Raw Value</span>
                             <span>Rp {totalPrice().toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                             <span>Archive Fee</span>
                             <span className="text-emerald-600 italic">Complimentary</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="pt-12 border-t border-ink/5 flex flex-col items-center flex-1 justify-center space-y-12">
                       <div className="text-center">
                          <span className="text-[9px] font-medium uppercase tracking-[0.6em] text-ink/20 block mb-4">Total Investment</span>
                          <span className="text-4xl font-display font-medium italic text-rose leading-none">Rp {totalPrice().toLocaleString('id-ID')}</span>
                       </div>

                       <div className="w-full space-y-6">
                          <Link 
                            href="/checkout" 
                            onClick={() => setIsCartOpen(false)}
                            className="w-full bg-ink text-white py-6 rounded-xl font-medium text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-rose transition-all shadow-xl shadow-ink/5 group"
                          >
                            <span>Archive Selection</span>
                          </Link>
                          <div className="flex items-center justify-center gap-3 opacity-30 grayscale">
                             <ShieldCheck size={14} />
                             <span className="text-[7px] font-medium uppercase tracking-[0.2em]">Secure Archival Protocol</span>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTOR 3: NEGATIVE SPACE (Grids 10-12) */}
              <div className="md:col-span-3 hidden md:block bg-cr noise opacity-30">
                 {/* This area is intentionally left blank for Negative Space aesthetic */}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[300] p-6 md:p-12 flex flex-col"
          >
            <div className="flex items-center justify-between mb-20">
              <div className="font-display font-medium text-2xl italic tracking-tighter text-rose uppercase">NINOC Search</div>
              <button onClick={() => setIsSearchOpen(false)} className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink hover:bg-rose hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="max-w-[1200px] mx-auto w-full space-y-12">
              <div className="relative">
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Archive..." 
                  className="w-full bg-transparent border-b-2 border-ink/5 focus:border-rose py-10 text-4xl md:text-6xl font-display font-medium italic uppercase tracking-tighter outline-none transition-all placeholder:text-ink/5"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
                {searchResults.map((product) => (
                  <Link 
                    key={product.id} 
                    href={`/product/${product.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex gap-8 group"
                  >
                    <div className="w-24 h-32 bg-ink/5 rounded-2xl overflow-hidden flex-shrink-0 relative border border-ink/5">
                      {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-contain p-2 group-hover:scale-110 transition-transform" />}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-xl font-display font-medium italic uppercase tracking-tight group-hover:text-rose transition-colors">{product.name}</h3>
                      <p className="text-lg font-display font-medium italic text-ink/30 mt-2">Rp {product.price.toLocaleString('id-ID')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
