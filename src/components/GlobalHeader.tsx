"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, User, X, Trash2, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/store/useCart';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function GlobalHeader() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Hide header on admin pages if needed
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-4 flex items-center justify-between glass border-b border-ink/5">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-ink/5 rounded-full transition-colors active:scale-90">
              <Menu size={18} className="text-ink" />
            </button>
            <Link href="/" className="cursor-pointer group">
              <div className="font-display font-black text-3xl italic tracking-tighter text-rose">NINOC</div>
              <div className="text-[8px] font-black tracking-[0.5em] text-ink/20 uppercase">Archive System</div>
            </Link>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            {['Collections', 'Sustainability', 'About'].map((item) => (
              <Link 
                key={item} 
                href={item === 'Atelier' ? '/shop' : '#'}
                className="relative group nav-link text-ink/40 hover:text-rose"
              >
                {item}
                <motion.span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-rose group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 p-2 px-4 rounded-full hover:bg-ink/5 transition-colors text-[10px] font-black uppercase tracking-widest text-ink/60">
            <Search size={14} />
            <span>Search</span>
          </button>
          
          <div className="h-6 w-[1px] bg-ink/10 hidden sm:block" />

          {/* Cart Trigger */}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-ink text-white rounded-full shadow-xl shadow-ink/20 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-rose to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShoppingCart size={16} className="relative z-10" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white text-white z-20">
                {totalItems}
              </span>
            )}
          </motion.button>

          <Link href="/admin">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 border border-ink/10 rounded-full hover:bg-ink hover:text-white transition-all cursor-pointer"
            >
              <User size={16} />
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[201] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-ink/5 flex items-center justify-between">
                <div>
                  <h1 className="text-5xl font-display font-black italic tracking-tighter text-ink">NINOC</h1>
                  <p className="label-caps text-ink/30">Wear the art, own the day.</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-ink/5 rounded-full flex items-center justify-center text-ink/10">
                      <ShoppingCart size={32} />
                    </div>
                    <p className="label-caps">Your cart is empty</p>
                    <button onClick={() => setIsCartOpen(false)} className="text-[10px] font-black text-rose underline tracking-widest">Back to Gallery</button>
                  </div>
                ) : items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-6 group">
                    <div className="w-24 h-24 bg-ink/5 rounded-2xl overflow-hidden relative flex-shrink-0">
                      <img src={item.image_url || ''} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-ink">{item.name}</h4>
                        <p className="text-[8px] font-black text-ink/30 uppercase tracking-[0.2em] mt-1">Size: {item.size}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-ink/10 rounded-lg px-2 py-1 gap-3">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-ink/40 hover:text-ink text-xs font-bold">-</button>
                          <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-ink/40 hover:text-ink text-xs font-bold">+</button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-rose/40 hover:text-rose transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-black italic text-rose">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-ink/[0.02] border-t border-ink/5 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="label-caps">Estimated Total</span>
                  <span className="text-2xl font-display font-black italic text-ink">Rp {totalPrice().toLocaleString('id-ID')}</span>
                </div>
                <Link 
                  href="/checkout" 
                  onClick={() => setIsCartOpen(false)}
                  className={cn(
                    "w-full bg-ink text-white py-6 rounded-full font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-xl shadow-ink/20 group relative overflow-hidden",
                    items.length === 0 && "opacity-50 pointer-events-none"
                  )}
                >
                  <span className="relative z-10">Proceed to Checkout</span>
                  <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-rose to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
