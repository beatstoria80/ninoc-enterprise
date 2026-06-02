"use client";

import React, { useState } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Sparkles, Clock, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
  variant?: 'essential' | 'limited' | 'heritage' | 'collection';
  itemCount?: number;
}

function CollectionCard({ title, description, icon, index, variant = 'essential', itemCount = 12 }: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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
        className="bg-white rounded-none p-8 md:p-12 border border-ink/5 group relative overflow-hidden block w-full"
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
            className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose mb-6 md:mb-8"
            variants={iconVariants}
            initial="hidden"
            whileInView="visible"
            custom={index}
            animate={{
              backgroundColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.05)',
              color: isHovered ? '#ffffff' : '#E8527A',
            }}
            transition={{ duration: DURATION.fast }}
          >
            {icon}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-xl md:text-2xl font-display font-medium italic uppercase tracking-tight mb-3 md:mb-4"
            animate={{ color: isHovered ? '#ffffff' : '#141414' }}
            transition={{ duration: DURATION.fast }}
          >
            {title}
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-xs md:text-sm font-medium text-ink/50 mb-6 md:mb-8"
            animate={{ color: isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(20,20,20,0.5)' }}
            transition={{ duration: DURATION.fast }}
          >
            {description}
          </motion.p>

          {/* Stats */}
          <motion.div
            className="flex items-center justify-between pt-4 md:pt-6 border-t border-ink/10"
            animate={{ borderColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.1)' }}
            transition={{ duration: DURATION.fast }}
          >
            <motion.div
              className="flex items-center gap-2"
              animate={{ color: isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,20,0.4)' }}
              transition={{ duration: DURATION.fast }}
            >
              <Star size={12} className="fill-current" />
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest">{itemCount} Items</span>
            </motion.div>

            <motion.div
              animate={{ x: isHovered ? 4 : 0, color: isHovered ? '#ffffff' : '#E8527A' }}
              transition={{ duration: DURATION.fast }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest">Explore</span>
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
          COLLECT-{String(index + 1).padStart(3, '0')}
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
      title: 'Essential',
      description: 'Core pieces for everyday expression.',
      icon: <Sparkles size={24} strokeWidth={1.5} />,
      variant: 'essential' as const,
      itemCount: 24,
    },
    {
      title: 'Limited',
      description: 'Exclusive drops in limited quantities.',
      icon: <Clock size={24} strokeWidth={1.5} />,
      variant: 'limited' as const,
      itemCount: 8,
    },
    {
      title: 'Heritage',
      description: 'Heritage pieces from previous seasons.',
      icon: <Star size={24} strokeWidth={1.5} />,
      variant: 'heritage' as const,
      itemCount: 16,
    },
  ];

  return (
    <main className="min-h-screen bg-cr noise pt-20 md:pt-32 px-4 md:px-12">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12 md:mb-20"
        >
          <motion.div
            className="flex items-center gap-2 mb-4 md:mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: DURATION.medium }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
            >
              <Sparkles size={12} className="text-rose" />
            </motion.div>
            <span className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.5em] text-ink/40">NINOC Archive</span>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-7xl lg:text-8xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none"
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Collections
          </motion.h1>

          <motion.p
            className="text-[10px] md:text-sm font-medium text-ink/60 uppercase tracking-wider mt-4 md:mt-6 max-w-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: DURATION.medium }}
          >
            Curated selections for the conscious collector.
          </motion.p>
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
            />
          ))}
        </div>

        {/* FEATURED BANNER */}
        <motion.div
          className="mt-16 md:mt-24 border-t border-b border-ink/5 py-8 md:py-16"
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
              <p className="text-[8px] font-medium uppercase tracking-[0.5em] text-ink/30 mb-2">New Season</p>
              <h2 className="text-xl md:text-3xl font-display font-medium italic text-ink uppercase tracking-tight">Spring 2026 Archive</h2>
            </motion.div>

            <PressButton
              href="/shop"
              className="flex items-center gap-3 bg-ink text-white px-6 md:px-10 py-3 md:py-4 group"
              whileHover={{ backgroundColor: '#E8527A' }}
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
          className="flex items-center justify-center gap-8 md:gap-16 py-8 md:py-12 border-b border-ink/5"
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
              className="text-center"
              variants={statVariants}
              initial="hidden"
              whileInView="visible"
              custom={i}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: DURATION.fast }}
            >
              <p className="text-[7px] md:text-[8px] font-medium uppercase tracking-[0.4em] text-ink/20 mb-1 md:mb-2">{stat.label}</p>
              <p className="text-lg md:text-2xl font-display font-medium italic text-rose">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </main>
  );
}