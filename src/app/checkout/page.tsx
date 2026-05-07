"use client";

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: ''
  });

  const total = totalPrice();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Create Order in Backend / Midtrans
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerDetails: formData,
          totalPrice: total
        })
      });

      const data = await response.json();

      if (data.token) {
        // @ts-expect-error - Midtrans Snap is loaded via script in layout
        window.snap.pay(data.token, {
          onSuccess: (result: any) => {
            console.log('Payment success:', result);
            clearCart();
            router.push('/payment/success');
          },
          onPending: (result: any) => {
            console.log('Payment pending:', result);
            router.push('/payment/pending');
          },
          onError: (result: any) => {
            console.error('Payment error:', result);
            alert('Payment failed!');
          },
          onClose: () => {
            console.log('Payment closed');
            setIsProcessing(false);
          }
        });
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cr flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-ink/5 rounded-full flex items-center justify-center text-ink/20">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-display font-black italic">Your cart is empty</h2>
        <Link href="/shop" className="bg-ink text-white px-8 py-4 rounded-full label-caps text-[10px]">Back to Shop</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cr noise pb-20">
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-8 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Atelier Checkout</span>
        </Link>
        <div className="font-display font-black text-2xl italic tracking-tighter text-rose">NINOC</div>
        <div className="w-10" />
      </nav>

      <div className="pt-40 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Details */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-ink/5 shadow-dashboard space-y-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-black italic">Shipping Details</h2>
              <p className="label-caps text-ink/30">Where should we deliver the art?</p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-caps !text-ink/60">Full Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-ink/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-rose" placeholder="Nandang" />
                </div>
                <div className="space-y-2">
                  <label className="label-caps !text-ink/60">Email Address</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-ink/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-rose" placeholder="nandang@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps !text-ink/60">Shipping Address</label>
                <textarea required rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-ink/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-rose resize-none" placeholder="Street Name, Building, etc." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="label-caps !text-ink/60">City</label>
                  <input required type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-ink/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-rose" placeholder="Jakarta" />
                </div>
                <div className="space-y-2">
                  <label className="label-caps !text-ink/60">ZIP Code</label>
                  <input required type="text" value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} className="w-full bg-ink/5 border-none rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-rose" placeholder="12345" />
                </div>
              </div>

              <div className="pt-8">
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-ink text-white py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-ink/30 relative overflow-hidden"
                >
                  {isProcessing ? 'Initializing Secure Payment...' : (
                    <>
                      <span>Secure Checkout</span>
                      <CreditCard size={18} />
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-rose to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-ink text-white p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-ink/40 space-y-8 sticky top-32">
            <h2 className="text-2xl font-display font-black italic border-b border-white/10 pb-6">Order Summary</h2>
            
            <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.image_url || ''} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest truncate">{item.name}</p>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">Size: {item.size} × {item.quantity}</p>
                  </div>
                  <p className="text-xs font-black">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                <span>Subtotal</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                <span>Shipping</span>
                <span className="text-emerald-400">Calculated later</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs font-black uppercase tracking-widest">Total</span>
                <span className="text-2xl font-display font-black italic text-rose">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-400" />
              <p className="text-[8px] font-black uppercase tracking-widest leading-relaxed text-white/60">
                Your payment information is encrypted and secured by Midtrans Snap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
