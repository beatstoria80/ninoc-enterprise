"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, X, Trash2, ShieldCheck, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import ImageLightbox from '@/components/ImageLightbox';

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
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

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

  return (
    <>
      <nav className={cn(
        "fixed top-0 inset-x-0 z-[150] px-4 md:px-12 py-3 md:py-8 flex items-center justify-between transition-all duration-700",
        isScrolled ? "glass border-b border-ink/5 py-3 md:py-5" : "bg-transparent"
      )}>
        <Link href="/" className="cursor-pointer group flex flex-col">
          <div className="font-display font-medium text-3xl md:text-4xl italic tracking-tighter text-rose leading-none transition-transform group-hover:scale-105">ninoc</div>
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
                <Image src={profileAvatar} alt="Profile" fill className="object-cover rounded-none border border-ink/5" />
              </div>
            ) : (
              <User size={20} strokeWidth={1.5} />
            )}
          </Link>

          <button onClick={() => setIsCartOpen(true)} className="relative group flex items-center">
            <ShoppingCart size={20} strokeWidth={1.5} className="text-ink/40 group-hover:text-rose transition-all" />
            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose text-white text-[7px] font-medium flex items-center justify-center rounded-none border border-white shadow-sm">
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
            <div className="px-6 md:px-12 py-6 md:py-10 flex items-center justify-between border-b border-ink/5">
              <div className="flex items-center gap-4 md:gap-8">
                 <div className="font-display font-medium text-3xl italic tracking-tighter text-rose uppercase">Active Selection</div>
                 <div className="h-8 w-[1px] bg-ink/10 hidden md:block" />
                 <div className="hidden md:flex flex-col leading-none">
                    <span className="text-[8px] font-medium uppercase tracking-[0.4em] text-ink/30">Origin Studio</span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink/60">{items.length} Units</span>
                 </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center text-ink hover:bg-rose hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 h-full">
              
              {/* SECTOR 1: PRODUCT LIST (Grids 1-5) */}
              <div className="md:col-span-5 overflow-y-auto no-scrollbar border-r border-ink/5 px-6 md:px-12 py-6 md:py-12 space-y-6 md:space-y-12">
                {items.length > 0 ? (
                  <div className="space-y-6 md:space-y-10">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex gap-6 group">
                        <div 
                          className="w-24 h-32 bg-white rounded-none overflow-hidden flex-shrink-0 relative border border-ink/5 cursor-pointer"
                          onClick={() => item.image_url && setFullscreenImage(item.image_url)}
                        >
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
                            <p className="text-[10px] md:text-[8px] font-medium uppercase tracking-widest text-ink/30 italic">Item Ref: #{item.id.slice(0, 8)}</p>
                          </div>
                          
                          <div className="flex items-end justify-between">
                            <div className="space-y-4">
                               <div className="flex items-center gap-3 md:gap-5 bg-ink/5 px-3 py-1.5 md:px-4 md:py-2 rounded-none w-fit">
                                  <button onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1, item.size)} className="text-ink/50 hover:text-rose p-0.5"><Minus size={14} strokeWidth={2} /></button>
                                  <span className="text-xs md:text-[13px] font-medium w-6 md:w-8 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)} className="text-ink/50 hover:text-rose p-0.5"><Plus size={14} strokeWidth={2} /></button>
                               </div>
                               <div className="text-[10px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/60">Size {item.size}</div>
                            </div>
                             <div className="text-base font-display font-medium italic text-rose">
                                IDR {(item.price * item.quantity).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
              <div className="md:col-span-4 px-6 md:px-12 py-8 md:py-12 bg-white flex flex-col">
                {items.length > 0 && (
                  <div className="space-y-8 md:space-y-12 h-full flex flex-col">
                    <div className="space-y-6 md:space-y-8">
                       <p className="text-[10px] md:text-[9px] font-medium uppercase tracking-[0.5em] text-ink/40">Investment Summary</p>
                       <div className="space-y-4 md:space-y-5">
                          <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                             <span>Raw Value</span>
                             <span>IDR {totalPrice().toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                             <span>Handling Fee</span>
                             <span className="text-emerald-600 italic">Complimentary</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="pt-8 md:pt-12 border-t border-ink/5 flex flex-col items-center flex-1 justify-center space-y-8 md:space-y-12">
                       <div className="text-center">
                          <span className="text-[10px] md:text-[9px] font-medium uppercase tracking-[0.6em] text-ink/30 block mb-3 md:mb-4">Total Investment</span>
                          <span className="text-3xl md:text-4xl font-display font-medium italic text-rose leading-none">IDR {totalPrice().toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                       </div>

                       <div className="w-full space-y-6">
                          <Link 
                            href="/checkout" 
                            onClick={() => setIsCartOpen(false)}
                            className="w-full bg-ink text-white py-4 rounded-none font-medium text-[9px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-rose transition-all group"
                          >
                            <span>Selection Details</span>
                          </Link>
                          <div className="flex items-center justify-center gap-3 opacity-30 grayscale">
                             <ShieldCheck size={14} />
                             <span className="text-[7px] font-medium uppercase tracking-[0.2em]">Secure Transaction Protocol</span>
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

      {/* Compact Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-ink/10 backdrop-blur-[2px] z-[200]"
            />
            
            {/* Minimal Search Bar */}
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 inset-x-0 z-[210] bg-white border-b border-ink/5 pt-[env(safe-area-inset-top)]"
            >
              <div className="px-6 md:px-12 py-4 flex items-center justify-between gap-8 max-w-[1800px] mx-auto">
                <div className="flex-1 flex items-center gap-4 relative">
                  <Search size={16} className="text-ink/30" />
                  <input 
                    autoFocus
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search catalog..." 
                    className="flex-1 bg-transparent py-2 text-xs font-medium uppercase tracking-[0.2em] outline-none placeholder:text-ink/20"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-ink/20 hover:text-rose">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setIsSearchOpen(false)} 
                  className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40 hover:text-rose transition-all flex items-center gap-2"
                >
                  Close
                </button>
              </div>

              {/* Minimal Results Dropdown */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-ink/5 max-h-[400px] overflow-y-auto"
                  >
                    <div className="px-6 md:px-12 py-8 max-w-[1800px] mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.length > 0 ? (
                          searchResults.map((product) => (
                            <Link 
                              key={product.id} 
                              href={`/shop/${product.slug}`}
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex gap-4 group p-2 hover:bg-ink/5 transition-all"
                            >
                              <div className="w-12 h-16 bg-ink/5 flex-shrink-0 relative border border-ink/5">
                                {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" />}
                              </div>
                              <div className="flex flex-col justify-center">
                                <h3 className="text-[10px] font-medium uppercase tracking-tight group-hover:text-rose transition-colors">{product.name}</h3>
                                <p className="text-[9px] font-medium text-ink/30 mt-0.5 italic">IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="col-span-full py-4 text-center">
                            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/20">No matching items found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ImageLightbox
        isOpen={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </>
  );
}
