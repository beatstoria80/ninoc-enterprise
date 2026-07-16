"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, ArrowLeft, Search, Filter, Sparkles } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { useBrandColor } from '@/components/BrandProvider';
import { useDictionary } from '@/hooks/useDictionary';

const EASING = { out: [0.23, 1, 0.32, 1] as const };
const DURATION = { micro: 0.05, fast: 0.12, normal: 0.18, medium: 0.25, slow: 0.35 };

interface LogEntry {
  id: string;
  date: string;
  category: string;
  title: string;
  title_en?: string;
  excerpt: string;
  excerpt_en?: string;
  slug: string;
}

function LogbookCard({ entry, index }: { entry: LogEntry; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const dict = useDictionary();

  const title = dict.locale === 'EN' && entry.title_en ? entry.title_en : entry.title;
  const excerpt = dict.locale === 'EN' && entry.excerpt_en ? entry.excerpt_en : entry.excerpt;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: DURATION.normal, ease: EASING.out, delay: index * 0.04 }}
    >
      <Link
        href={`/logbook/${entry.slug}`}
        className="block bg-white border border-ink/10 hover:border-ink transition-colors duration-200 group relative overflow-hidden mb-3 active:scale-[0.99]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="absolute inset-0 bg-ink origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isHovered ? 1 : 0 }}
          transition={{ duration: DURATION.medium, ease: EASING.out }}
          style={{ zIndex: 0 }}
        />
        <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center md:items-start md:flex-col gap-3 md:gap-1.5 flex-shrink-0 md:w-52">
            <motion.div
              className="text-[10px] md:text-xs font-mono tracking-wider px-2 py-0.5 border border-ink/10"
              animate={{
                backgroundColor: isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(20,20,20,0.05)',
                color: isHovered ? '#ffffff' : '#141414',
                borderColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.1)',
              }}
              transition={{ duration: DURATION.fast }}
            >
              {entry.id}
            </motion.div>
            <motion.span
              className="text-[11px] md:text-xs font-mono font-medium uppercase tracking-[0.15em]"
              animate={{ color: isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(20,20,20,0.45)' }}
              transition={{ duration: DURATION.fast }}
            >
              {entry.date}
            </motion.span>
          </div>

          <div className="flex-1 space-y-2.5">
            <motion.span
              className="inline-block text-[10px] md:text-xs font-mono font-bold uppercase tracking-[0.3em]"
              animate={{ color: isHovered ? brandColor.color : '#e11d48' }}
              transition={{ duration: DURATION.fast }}
            >
              • {entry.category}
            </motion.span>
            <motion.h3
              className="text-lg md:text-2xl font-display font-medium italic uppercase tracking-tight leading-snug"
              animate={{ color: isHovered ? '#ffffff' : '#141414' }}
              transition={{ duration: DURATION.fast }}
            >
              {title}
            </motion.h3>
            <motion.p
              className="text-xs md:text-sm font-sans font-normal leading-relaxed max-w-3xl"
              animate={{ color: isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(20,20,20,0.65)' }}
              transition={{ duration: DURATION.fast }}
            >
              {excerpt}
            </motion.p>
          </div>

          <motion.div
            className="flex-shrink-0 self-end md:self-center p-2 rounded-full border border-ink/10 md:border-transparent group-hover:border-white/20"
            animate={{
              color: isHovered ? '#ffffff' : 'rgba(20,20,20,0.3)',
              x: isHovered ? 6 : 0,
            }}
            transition={{ duration: DURATION.fast }}
          >
            <ArrowRight size={20} strokeWidth={1.5} />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LogbookClient({ initialEntries = [] }: { initialEntries?: LogEntry[] }) {
  const dict = useDictionary();
  const [entries] = useState<LogEntry[]>(initialEntries);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    entries.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const title = dict.locale === 'EN' && entry.title_en ? entry.title_en : entry.title;
      const excerpt = dict.locale === 'EN' && entry.excerpt_en ? entry.excerpt_en : entry.excerpt;
      const matchesCategory = selectedCategory === 'ALL' || entry.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        excerpt.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [entries, selectedCategory, searchQuery, dict.locale]);

  return (
    <main className="min-h-screen bg-[#F8F7F4] pt-8 md:pt-24 px-4 md:px-12 pb-[140px] text-ink selection:bg-rose selection:text-white">
      <div className="max-w-[1200px] mx-auto">
        {/* Header Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-ink/15 pb-6 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose">
              <Sparkles size={14} />
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase font-bold">
                {dict.locale === 'EN' ? 'Archival & Technical Records' : 'Arsip & Catatan Teknis'}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-medium uppercase tracking-tight italic">
              {dict.logbook.title}
            </h1>
            <p className="text-xs md:text-sm text-ink/70 font-sans max-w-xl leading-relaxed">
              {dict.locale === 'EN'
                ? 'Primary technical documentation, fabric density engineering notes, and uncompromising design philosophy from the studio floor.'
                : 'Dokumentasi teknis utama, catatan spesifikasi gramasi material, serta filosofi rekayasa garmen dari meja kerja studio kami.'}
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink/60 hover:text-rose transition-colors py-1"
            >
              <ArrowLeft size={14} />
              <span>{dict.logbook.home}</span>
            </Link>
            <div className="text-[11px] font-mono uppercase tracking-widest bg-ink/5 px-3 py-1 border border-ink/10 text-ink/80">
              {filteredEntries.length} {dict.locale === 'EN' ? 'Records Cataloged' : 'Arsip Terkatalog'}
            </div>
          </div>
        </div>

        {/* Search Bar & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10 bg-white p-3 md:p-4 border border-ink/10 shadow-sm">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <Filter size={14} className="text-ink/40 mr-1 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all relative ${
                  selectedCategory === cat
                    ? 'text-white bg-ink font-medium shadow-sm'
                    : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                }`}
              >
                {cat === 'ALL'
                  ? dict.locale === 'EN'
                    ? 'All Entries'
                    : 'Semua Arsip'
                  : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.locale === 'EN' ? 'Search records, materials...' : 'Cari catatan spesifikasi material...'}
              className="w-full bg-[#F8F7F4] border border-ink/10 rounded-none pl-9 pr-4 py-2 text-xs font-sans text-ink focus:outline-none focus:border-ink transition-colors placeholder:text-ink/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase text-ink/40 hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex flex-col min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredEntries.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-24 text-center bg-white border border-ink/10 p-8"
              >
                <BookOpen size={28} className="text-ink/20 mx-auto mb-4" />
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/70">
                  {dict.locale === 'EN' ? 'No matching archival records found.' : 'Tidak ada catatan arsip yang sesuai pencarian.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-4 inline-block text-xs font-mono uppercase text-rose underline hover:text-ink transition-colors"
                >
                  {dict.locale === 'EN' ? 'Reset Filters' : 'Atur Ulang Filter'}
                </button>
              </motion.div>
            ) : (
              filteredEntries.map((entry, index) => <LogbookCard key={entry.id} entry={entry} index={index} />)
            )}
          </AnimatePresence>

          {filteredEntries.length > 0 && (
            <div className="mt-16 text-center">
              <div className="inline-flex flex-col items-center gap-2 opacity-35">
                <div className="w-px h-10 bg-ink" />
                <span className="text-[9px] font-mono tracking-[0.3em] uppercase">
                  {dict.locale === 'EN' ? 'End of Archival Registry' : 'Akhir dari Daftar Arsip'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
