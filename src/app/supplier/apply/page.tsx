'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Factory, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { submitSupplierApplication } from './actions';

export default function SupplierApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      await submitSupplierApplication(formData);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cr noise py-12 px-4 flex justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        
        {/* Left Side - Info */}
        <div className="flex flex-col justify-center space-y-6 md:sticky md:top-12 md:h-fit">
          <div className="w-12 h-12 bg-ink text-white flex items-center justify-center rounded-none mb-4">
            <Factory size={24} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display italic font-medium tracking-tight text-ink">
            Become a B2B Partner.
          </h1>
          <p className="text-sm text-ink/70 leading-relaxed max-w-md">
            Join the NINOC ecosystem as an exclusive manufacturer. Focus purely on scaling your production volume and cashflow, while our engine handles the marketing, branding, QC, and B2B distribution.
          </p>
          
          <div className="pt-6 border-t border-ink/10 space-y-4">
            <h3 className="text-[10px] uppercase font-medium tracking-[0.2em] text-ink/50">Partnership Pillars</h3>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">Guaranteed HPP Payouts</p>
                <p className="text-[10px] text-ink/60">You set your base cost. We pay it cleanly upon successful fulfillment.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">Zero Marketing Burden</p>
                <p className="text-[10px] text-ink/60">We rebrand, shoot, and market your raw goods using our multi-million dollar ad engine.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-ink">Data Anonymity</p>
                <p className="text-[10px] text-ink/60">Your factory identity is shielded. B2B buyers only see NINOC as the fulfillment hub.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white p-8 md:p-12 border border-ink/5 shadow-2xl relative overflow-hidden">
          <h2 className="text-xl font-display font-medium text-ink mb-6">Application Form</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">Factory/Company Name</label>
                <input required type="text" name="name" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="e.g. PT Jaya Garment" />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">Contact Email</label>
                <input required type="email" name="email" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="director@jayagarment.com" />
              </div>
              
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-2">WhatsApp Number</label>
                <input required type="tel" name="phone" className="w-full bg-cr noise border border-ink/10 p-3 text-sm focus:outline-none focus:border-rose transition-colors" placeholder="+62..." />
              </div>
            </div>

            <div className="pt-6 border-t border-ink/10">
              <h3 className="text-xs font-bold text-ink mb-4">Terms & Conditions (OEM SLA)</h3>
              <div className="bg-cr noise p-4 border border-ink/10 h-40 overflow-y-auto mb-4 text-[10px] text-ink/70 space-y-3 font-mono leading-relaxed">
                <p><strong>1. RIGHT TO REBRAND:</strong> Supplier grants NINOC exclusive rights to repackage, re-label, and rebrand submitted items under the NINOC trademark.</p>
                <p><strong>2. PRICING HEGEMONY:</strong> Supplier is only entitled to the base HPP submitted. NINOC reserves absolute right to mark up, discount, or dictate final retail/B2B prices without requiring supplier consent.</p>
                <p><strong>3. HUB CONSIGNMENT:</strong> Goods must be physically deposited to the NINOC Central Warehouse for Quality Control. Dropshipping direct from factory is strictly prohibited to preserve brand anonymity.</p>
                <p><strong>4. PAYOUT CLEARANCE:</strong> HPP funds are credited to the supplier ledger only after the end-consumer receives the goods and the 7-day return window expires without dispute.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="pt-0.5">
                  <input required type="checkbox" name="agree_sla" className="w-4 h-4 accent-rose cursor-pointer" />
                </div>
                <span className="text-xs text-ink/70 group-hover:text-ink transition-colors">
                  I am an authorized representative of this factory and legally agree to the NINOC OEM Service Level Agreement stated above.
                </span>
              </label>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full bg-ink text-white p-4 text-[10px] font-medium uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
              {!isSubmitting && <ArrowRight size={14} />}
            </button>
            <p className="text-center text-[9px] text-ink/40 uppercase tracking-widest mt-4">
              Ensure you are logged in to your account
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
