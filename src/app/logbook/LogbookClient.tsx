"use client";

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { supabase } from '@/lib/supabase';
import { useBrandColor } from '@/components/BrandProvider';
import { useDictionary } from '@/hooks/useDictionary';

const EASING = { out: [0.23, 1, 0.32, 1] as const };
const DURATION = { micro: 0.1, fast: 0.15, normal: 0.2, medium: 0.3, slow: 0.5 };

const pageVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.normal, ease: EASING.out, staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASING.out } } };

interface LogEntry { id: string; date: string; category: string; title: string; title_en?: string; excerpt: string; excerpt_en?: string; slug: string; }

function LogbookCard({ entry, index }: { entry: LogEntry; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const dict = useDictionary();

  const title = dict.locale === 'EN' && entry.title_en ? entry.title_en : entry.title;
  const excerpt = dict.locale === 'EN' && entry.excerpt_en ? entry.excerpt_en : entry.excerpt;

  return (
    <motion.div variants={itemVariants}>
      <Link href={`/logbook/${entry.slug}`} className="block bg-white border border-ink/5 group relative overflow-hidden mb-1 md:mb-2" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <motion.div className="absolute inset-0 bg-ink origin-bottom" initial={{ scaleY: 0 }} animate={{ scaleY: isHovered ? 1 : 0 }} transition={{ duration: DURATION.medium, ease: EASING.out }} style={{ zIndex: 0 }} />
        <div className="relative z-10 p-3 md:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center md:items-start md:flex-col gap-3 md:gap-1 flex-shrink-0 md:w-48">
            <motion.div className="text-[6px] md:text-[7px] font-mono tracking-tighter px-1 py-0.5" animate={{ backgroundColor: isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(20,20,20,0.05)', color: isHovered ? '#ffffff' : '#141414' }} transition={{ duration: DURATION.fast }}>{entry.id}</motion.div>
            <motion.span className="text-[11px] md:text-[8px] md:text-[9px] font-medium uppercase tracking-[0.2em]" animate={{ color: isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,20,0.4)' }} transition={{ duration: DURATION.fast }}>{entry.date}</motion.span>
          </div>
          <div className="flex-1 space-y-2">
            <motion.span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.4em]" animate={{ color: isHovered ? brandColor.color : 'rgba(20,20,20,0.3)' }} transition={{ duration: DURATION.fast }}>{entry.category}</motion.span>
            <motion.h3 className="text-lg md:text-xl font-display font-medium italic uppercase tracking-tight" animate={{ color: isHovered ? '#ffffff' : '#141414' }} transition={{ duration: DURATION.fast }}>{title}</motion.h3>
            <motion.p className="text-xs md:text-[9px] md:text-[10px] font-medium leading-relaxed max-w-2xl" animate={{ color: isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(20,20,20,0.6)' }} transition={{ duration: DURATION.fast }}>{excerpt}</motion.p>
          </div>
          <motion.div className="flex-shrink-0 self-end md:self-center" animate={{ color: isHovered ? brandColor.color : 'rgba(20,20,20,0.2)', x: isHovered ? 4 : 0 }} transition={{ duration: DURATION.fast }}><ArrowRight size={16} strokeWidth={1.5} /></motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LogbookClient({ initialEntries = [] }: { initialEntries?: LogEntry[] }) {
  const dict = useDictionary();
  const [entries] = useState<LogEntry[]>(initialEntries);

  // Fetch removed for SSR

  return (
    <main className="min-h-screen bg-cr noise pt-8 md:pt-20 px-4 md:px-12 pb-[120px]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8 md:mb-12 border-b border-ink/10 pb-4">
          <div className="flex items-center gap-3">
            <BookOpen size={12} className="text-rose" />
            <div className="flex flex-col">
              <h1 className="text-xs md:text-[10px] md:text-xs font-medium uppercase tracking-[0.4em] text-ink">{dict.logbook.title}</h1>
              <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/40">{dict.logbook.subtitle}</span>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-ink/40 hover:text-rose transition-colors"><ArrowLeft size={10} /><span className="text-[10px] md:text-[7px] md:text-[8px] font-medium uppercase tracking-[0.3em]">{dict.logbook.home}</span></Link>
        </div>

        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="flex flex-col">
          {entries.length === 0 ? (
            <div className="py-20 text-center"><BookOpen size={24} className="text-ink/20 mx-auto mb-4" /><p className="text-xs md:text-[9px] font-medium uppercase tracking-[0.4em] text-ink/40">{dict.logbook.empty}</p><p className="text-[10px] md:text-[7px] text-ink/25 mt-2 tracking-wider">{dict.logbook.emptyDesc}</p></div>
          ) : (
            entries.map((entry, index) => <LogbookCard key={entry.id} entry={entry} index={index} />)
          )}
          {entries.length > 0 && (
            <motion.div variants={itemVariants} className="mt-12 text-center">
              <div className="inline-flex flex-col items-center gap-2 opacity-30"><div className="w-px h-8 bg-ink" /><span className="text-[6px] font-mono tracking-widest uppercase">{dict.logbook.end}</span></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
