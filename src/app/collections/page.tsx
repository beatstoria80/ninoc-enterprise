"use client";

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useBrandColor } from '@/components/BrandProvider';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// MODERN CUSTOM ICONS — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

// STAPLES — clothing hanger
const HangerIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3C12 3 12 5 12 6M12 6L4 10M12 6L20 10" />
    <path d="M4 10L4 18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V10" />
    <path d="M4 10H20" />
    <path d="M7 14H17" />
  </svg>
);

// LIMITED — flame
const FlameIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C12 2 8 7 8 11C8 13.76 9.68 16 12 16C14.32 16 16 13.76 16 11C16 11 16 8 12 2Z" />
    <path d="M12 16C12 16 10 18.5 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.5 12 16 12 16Z" />
    <path d="M8 11C8 11 6 12 6 14C6 15.66 7.34 17 9 17C10.66 17 12 15.66 12 14C12 13 10 12 10 12" />
  </svg>
);

// THROWBACK — clock rewind / history
const ClockRewindIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7V12L9 14" />
    <path d="M9 12L7 10M9 12L7 14" />
    <path d="M3 12H5M19 12H21" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// EMIL KOWALSKI ANIMATION ENGINE — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
};

const DURATION = {
  micro: 0.1,
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
};

// ═══════════════════════════════════════════════════════════════
// VARIANT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: DURATION.medium, ease: EASING.out },
  },
};

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.15, duration: DURATION.slow, ease: EASING.out },
  }),
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.12, duration: DURATION.medium, ease: EASING.out },
  }),
};

const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: (i: number) => ({
    scale: 1, rotate: 0,
    transition: { delay: 0.3 + i * 0.12, duration: DURATION.medium, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

const statVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.5 + i * 0.08, duration: DURATION.medium, ease: EASING.out },
  }),
};

const dotVariants: Variants = {
  hidden: { scale: 0 },
  visible: (i: number) => ({
    scale: 1,
    transition: { delay: i * 0.1, duration: DURATION.fast, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

// ═══════════════════════════════════════════════════════════════
// PRESS BUTTON
// ═══════════════════════════════════════════════════════════════

function PressButton({ children, className = '', onClick, href, whileHover = {} }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  whileHover?: object;
}) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, ...whileHover }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      className={className}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return <button onClick={onClick}>{content}</button>;
}

// ═══════════════════════════════════════════════════════════════
// COLLECTION CARD
// ═══════════════════════════════════════════════════════════════

interface CollectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  variant?: 'staples' | 'limited' | 'throwback' | 'collection';
  itemCount?: number;
  cta?: string;
  tag?: string;
}

function CollectionCard({ title, description, icon, index, variant = 'staples', itemCount = 12, cta = 'SHOP THE DROP →', tag = 'CORE-001' }: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const white = '#ffffff';
  const darkColor = { color: '#141414' };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <PressButton
        href={`/collections/${variant}`}
        className="bg-white rounded-none p-4 md:p-12 border border-ink/5 group relative overflow-hidden block w-full"
      >
        {/* Background hover effect */}
        <motion.div
          className="absolute inset-0 bg-rose origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isHovered ? 1 : 0 }}
          transition={{ duration: DURATION.medium, ease: EASING.out }}
          style={{ zIndex: 0 }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            className="w-14 h-14 md:w-18 md:h-18 bg-ink/5 flex items-center justify-center text-rose mb-3 md:mb-8"
            variants={iconVariants}
            initial="hidden"
            whileInView="visible"
            custom={index}
            animate={{
              backgroundColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.05)',
              color: isHovered ? white : brandColor.color,
            }}
            transition={{ duration: DURATION.fast }}
          >
            {icon}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-xl md:text-2xl font-display font-medium italic uppercase tracking-tight mb-2 md:mb-4"
            animate={{ color: isHovered ? '#ffffff' : '#141414' }}
            transition={{ duration: DURATION.fast }}
          >
            {title}
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-xs md:text-sm font-medium text-ink/50 mb-3 md:mb-8"
            animate={{ color: isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(20,20,20,0.5)' }}
            transition={{ duration: DURATION.fast }}
          >
            {description}
          </motion.p>

          {/* Stats */}
          <motion.div
            className="flex items-center justify-between pt-3 md:pt-6 border-t border-ink/10"
            animate={{ borderColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.1)' }}
            transition={{ duration: DURATION.fast }}
          >
            <motion.div
              className="flex items-center gap-2"
              animate={{ color: isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,20,0.4)' }}
              transition={{ duration: DURATION.fast }}
            >
              <div className="flex gap-0.5">
                {[0, 1, 2].map((d) => (
                  <motion.div
                    key={d}
                    className="w-1 h-1 bg-current rounded-full"
                    variants={dotVariants}
                    initial="hidden"
                    whileInView="visible"
                    custom={d}
                    animate={{ scale: isHovered ? [1, 1.5, 1] : 1 }}
                    transition={{ repeat: isHovered ? Infinity : 0, duration: 0.5, delay: d * 0.1 }}
                  />
                ))}
              </div>
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest">{itemCount} Items</span>
            </motion.div>

            <motion.div
              animate={{ x: isHovered ? 4 : 0, color: isHovered ? white : brandColor.color }}
              transition={{ duration: DURATION.fast }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest">{cta}</span>
              <ArrowRight size={14} />
            </motion.div>
          </motion.div>
        </div>

        {/* Spec badge */}
        <motion.div
          className="absolute top-4 right-4 md:top-6 md:right-6 text-[6px] font-mono tracking-tighter px-1.5 py-0.5 bg-ink/5 text-ink/40"
          animate={{ backgroundColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.05)', color: isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,20,0.4)' }}
          transition={{ duration: DURATION.fast }}
        >
          {tag}
        </motion.div>

        {/* Corner accent */}
        <motion.div
          className="absolute top-0 left-0 w-8 h-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: DURATION.fast }}
        >
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <path d="M0 0 L32 0 L32 32 L0 0" fill="currentColor" opacity="0.1" />
          </svg>
        </motion.div>
      </PressButton>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COLLECTIONS PAGE
// ═══════════════════════════════════════════════════════════════

export default function Collections() {
  const collections = [
    {
      title: 'Staples',
      description: 'The everyday fits you reach for first.',
      icon: <HangerIcon size={28} />,
      variant: 'staples' as const,
      itemCount: 24,
      cta: 'SHOP THE DROP →',
      tag: 'CORE-001',
    },
    {
      title: 'Limited',
      description: 'Gone when it\'s gone. No restock. No waiting list.',
      icon: <FlameIcon size={28} />,
      variant: 'limited' as const,
      itemCount: 8,
      cta: 'GRAB IT →',
      tag: 'DROP-002',
    },
    {
      title: 'Throwback',
      description: 'Previous season pieces that still go hard. Built different, still relevant.',
      icon: <ClockRewindIcon size={28} />,
      variant: 'throwback' as const,
      itemCount: 16,
      cta: 'DIG IN →',
      tag: 'ARCH-003',
    },
  ];

  return (
    <main className="min-h-screen bg-cr noise pt-4 md:pt-32 px-4 md:px-12">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="mb-4 md:mb-20"
        >
          <motion.div
            className="flex items-center gap-3 mb-4 md:mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: DURATION.medium }}
          >
            {/* Custom drops icon */}
            <motion.div
              className="relative"
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-rose">
                <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M8 5L11 6.5V9.5L8 11L5 9.5V6.5L8 5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <span className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.5em] text-ink/40">Ninoc Drops</span>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-7xl lg:text-8xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none"
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            custom={0}
            style={{ fontStyle: 'italic', fontStretch: 'condensed' }}
          >
            Collections
          </motion.h1>

          <motion.p
            className="text-[10px] md:text-sm font-medium text-ink/60 uppercase tracking-wider mt-4 md:mt-6 max-w-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: DURATION.medium }}
          >
            Fresh cuts. Real threads. No restock.
          </motion.p>

          {/* Decorative line */}
          <motion.div
            className="h-px bg-ink/10 mt-8 md:mt-12 max-w-md"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: DURATION.slow, ease: EASING.out }}
            style={{ transformOrigin: 'left' }}
          />
        </motion.div>

        {/* COLLECTION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/5 border border-ink/5">
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.variant}
              title={collection.title}
              description={collection.description}
              icon={collection.icon}
              index={index}
              variant={collection.variant}
              itemCount={collection.itemCount}
              cta={collection.cta}
              tag={collection.tag}
            />
          ))}
        </div>

        {/* FEATURED BANNER */}
        <motion.div
          className="mt-6 md:mt-24 border-t border-b border-ink/5 py-4 md:py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: DURATION.medium }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: DURATION.medium }}
            >
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                {/* Season indicator dots */}
                <div className="flex gap-1">
                  {[brandColor.color, '#141414', brandColor.color].map((color, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-[8px] font-medium uppercase tracking-[0.5em] text-ink/30">New Season</span>
              </div>
              <h2 className="text-xl md:text-3xl font-display font-medium italic text-ink uppercase tracking-tight">Spring 2026 Archive</h2>
            </motion.div>

            <PressButton
              href="/shop"
              className="flex items-center gap-3 bg-ink text-white px-6 md:px-10 py-3 md:py-4 group"
              whileHover={{ backgroundColor: brandColor.color }}
            >
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.3em]">Browse Catalog</span>
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <ArrowRight size={14} />
              </motion.div>
            </PressButton>
          </div>
        </motion.div>

        {/* STATS ROW */}
        <motion.div
          className="flex items-center justify-center gap-6 md:gap-16 py-4 md:py-12 border-b border-ink/5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {[
            { label: 'Total Items', value: '48' },
            { label: 'Collections', value: '3' },
            { label: 'Seasons', value: '12' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center relative"
              variants={statVariants}
              initial="hidden"
              whileInView="visible"
              custom={i}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: DURATION.fast }}
            >
              {/* Vertical connector */}
              {i < 2 && (
                <div className="absolute -right-[2.5rem] top-1/2 w-5 h-px bg-ink/10 hidden md:block" />
              )}
              <p className="text-[7px] md:text-[8px] font-medium uppercase tracking-[0.4em] text-ink/20 mb-1 md:mb-2">{stat.label}</p>
              <p className="text-lg md:text-2xl font-display font-medium italic text-rose">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* FOOTER MARQUEE */}
        <motion.div
          className="mt-6 py-4 overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="flex gap-12 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12">
                <span className="text-[10px] font-medium uppercase tracking-[0.8em] text-ink/20">Archival Garments</span>
                <span className="text-rose">◆</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.8em] text-ink/20">Origin Studio</span>
                <span className="text-rose">◆</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.8em] text-ink/20">Preserved Excellence</span>
                <span className="text-rose">◆</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.8em] text-ink/20">NINOC 2026</span>
                <span className="text-rose">◆</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

      </div>
    </main>
  );
}