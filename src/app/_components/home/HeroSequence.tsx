"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Paperclip, ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { charVariants, metadataVariants, EASING, DURATION } from '@/lib/animations';
import Link from '@/components/LocalizedLink';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function PressButton({ children, className = '', onClick, href, whileHover, whileTap }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  whileHover?: Parameters<typeof motion.div>[0]['whileHover'];
  whileTap?: Parameters<typeof motion.div>[0]['whileTap'];
}) {
  const inner = (
    <motion.div
      whileHover={whileHover as any}
      whileTap={whileTap as any}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      className={cn(className, "cursor-pointer")}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return (
    <button onClick={onClick} type="button" className="w-auto bg-transparent border-none p-0 m-0">
      {inner}
    </button>
  );
}

import Hero from '@/components/mascot/Hero';

interface HeroSequenceProps {
  dict: any;
  isReturningVisitor?: boolean;
  scene?: 'hero' | 'transitioning' | 'archive';
}

export default function HeroSequence({ dict }: HeroSequenceProps) {
  return (
    <div className="relative w-full overflow-hidden bg-white border-b border-ink/5">
      <Hero dict={dict} />
    </div>
  );
}
