import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, Tag, PackagePlus } from 'lucide-react';
import { FlashSaleTab } from './FlashSaleTab';
import DiscountPeriodsView from './programs/DiscountPeriodsView';
import VolumePromosView from './programs/VolumePromosView';
import PromoBuilderModal from '../modals/PromoBuilderModal';
import { Product } from '@/components/admin/types';

interface ProgramsTabProps {
  products: Product[];
  onRefreshProducts: () => void;
}

const ANIMATION_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const TABS = [
  { id: 'flash', label: 'Flash Sales', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'discount', label: 'Discount Periods', icon: Tag, color: 'text-rose', bg: 'bg-rose/10' },
  { id: 'volume', label: 'Volume Promos', icon: PackagePlus, color: 'text-purple-600', bg: 'bg-purple-50' },
] as const;

type SubTab = typeof TABS[number]['id'];

export default function ProgramsTab({ products, onRefreshProducts }: ProgramsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('flash');
  const [promoMode, setPromoMode] = useState<'discount' | 'volume' | null>(null);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 relative overflow-hidden">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-ink/5 px-2 py-2 md:px-6 md:py-5 flex-none z-10 shadow-sm relative">
        <div className="flex flex-col gap-1 mb-2 md:mb-6">
          <div className="flex items-center gap-2">
            <Gift className="text-rose w-5 h-5" />
            <h2 className="text-lg font-display font-semibold italic tracking-tight text-ink uppercase">
              Program & Promotions Center
            </h2>
          </div>
          <p className="text-[11px] text-ink/50 uppercase tracking-widest font-medium">
            Centralized Hub for E-Commerce Campaigns
          </p>
        </div>

        {/* COMPACT PILLS NAVIGATION */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {TABS.map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-ink shadow-md border border-ink/10' 
                    : 'bg-transparent text-ink/50 hover:bg-black/5 hover:text-ink/80 border border-transparent'
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? tab.bg : 'bg-transparent'}`}>
                  <Icon size={14} className={isActive ? tab.color : 'text-current'} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            {...ANIMATION_VARIANTS}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto"
          >
            <div className="p-1 md:p-6 h-full min-h-full">
              {activeSubTab === 'flash' && <FlashSaleTab />}
              {activeSubTab === 'discount' && (
                <DiscountPeriodsView 
                  products={products} 
                  onCreatePromo={() => setPromoMode('discount')}
                  onRefresh={onRefreshProducts}
                />
              )}
              {activeSubTab === 'volume' && (
                <VolumePromosView 
                  products={products}
                  onCreatePromo={() => setPromoMode('volume')}
                  onRefresh={onRefreshProducts}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* PROMO BUILDER MODAL */}
      <PromoBuilderModal
        isOpen={promoMode !== null}
        onClose={() => setPromoMode(null)}
        mode={promoMode || 'discount'}
        products={products}
        onComplete={onRefreshProducts}
      />
    </div>
  );
}
