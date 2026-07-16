"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Check } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { useDictionary } from '@/hooks/useDictionary';

interface LogEntryDetail {
  id: string;
  date: string;
  category: string;
  title: string;
  title_en?: string;
  excerpt: string;
  excerpt_en?: string;
  content: string;
  content_en?: string;
  image_url?: string;
  slug: string;
}

interface NavEntry {
  id: string;
  title: string;
  title_en?: string;
  slug: string;
}

const EASING = { out: [0.23, 1, 0.32, 1] as const };
const DURATION = { normal: 0.12, medium: 0.18, slow: 0.3 };

export default function LogbookDetailClient({
  entry,
  newerEntry,
  olderEntry,
}: {
  entry: LogEntryDetail;
  newerEntry: NavEntry | null;
  olderEntry: NavEntry | null;
}) {
  const dict = useDictionary();
  const [copied, setCopied] = useState(false);

  const title = dict.locale === 'EN' && entry.title_en ? entry.title_en : entry.title;
  const excerpt = dict.locale === 'EN' && entry.excerpt_en ? entry.excerpt_en : entry.excerpt;
  const rawContent = dict.locale === 'EN' && entry.content_en ? entry.content_en : entry.content;

  const paragraphs = rawContent.split(/\n+/).filter(Boolean);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <main className="min-h-screen bg-cr noise pt-6 md:pt-20 px-4 md:px-12 pb-[140px] text-ink selection:bg-ink selection:text-white">
      <div className="max-w-[820px] mx-auto">
        {/* Top bar navigation */}
        <div className="flex items-center justify-between mb-8 md:mb-14 border-b border-ink/10 pb-4">
          <Link
            href="/logbook"
            className="inline-flex items-center gap-2 text-ink/60 hover:text-rose transition-colors group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] font-medium">
              {dict.header?.logbook || 'JURNAL'} / STUDIO
            </span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-ink/70 hover:text-ink border border-ink/10 px-3 py-1.5 bg-white transition-all active:scale-95"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
            <span>{copied ? (dict.locale === 'EN' ? 'Copied Link' : 'Tersalin') : (dict.locale === 'EN' ? 'Share' : 'Bagikan')}</span>
          </button>
        </div>

        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, ease: EASING.out }}
          className="mb-10 md:mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] md:text-xs font-mono tracking-widest bg-ink text-white px-2 py-0.5">
              {entry.id}
            </span>
            <span className="text-xs md:text-sm font-mono uppercase tracking-[0.25em] text-ink/50">
              {entry.date}
            </span>
            <span className="w-1 h-1 rounded-full bg-rose" />
            <span className="text-xs md:text-sm font-mono font-semibold uppercase tracking-[0.3em] text-rose">
              {entry.category}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-medium uppercase italic tracking-tight leading-[1.15] mb-6 text-ink">
            {title}
          </h1>

          <p className="text-sm md:text-lg font-medium leading-relaxed text-ink/70 border-l-2 border-ink/20 pl-4 py-1 italic">
            {excerpt}
          </p>
        </motion.header>

        {/* Archival Illustration Cover */}
        {entry.image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION.slow, delay: 0.1, ease: EASING.out }}
            className="mb-12 md:mb-16 border border-ink/10 bg-white p-2 md:p-4 shadow-sm"
          >
            <div className="relative overflow-hidden bg-[#F8F7F4] aspect-[16/9] flex items-center justify-center">
              <Image
                src={entry.image_url}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 820px"
                className="object-cover grayscale opacity-95 mix-blend-multiply transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
            <div className="flex items-center justify-between mt-3 px-1 text-[9px] font-mono uppercase tracking-widest text-ink/40">
              <span>FIG. {entry.id} — ARCHIVAL ILLUSTRATION</span>
              <span>NINOC STUDIO ARCHIVE</span>
            </div>
          </motion.div>
        )}

        {/* Article Content Body */}
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.slow, delay: 0.2 }}
          className="space-y-6 md:space-y-8 text-sm md:text-base lg:text-[17px] leading-[1.85] font-sans text-ink/85 border-b border-ink/10 pb-16"
        >
          {paragraphs.map((para, idx) => {
            const isFirst = idx === 0;
            return (
              <p
                key={idx}
                className={`${
                  isFirst
                    ? 'text-base md:text-lg lg:text-xl font-medium leading-[1.75] text-ink first-letter:text-3xl first-letter:md:text-4xl first-letter:font-display first-letter:font-bold first-letter:mr-1.5 first-letter:float-left first-letter:leading-none first-letter:pt-1 first-letter:text-rose'
                    : ''
                }`}
              >
                {para}
              </p>
            );
          })}
        </motion.article>

        {/* Footer / Adjacent Navigation */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {newerEntry ? (
            <Link
              href={`/logbook/${newerEntry.slug}`}
              className="block bg-white border border-ink/10 p-5 hover:border-ink transition-all group"
            >
              <span className="text-[9px] font-mono uppercase tracking-widest text-ink/40 block mb-1">
                ← {dict.locale === 'EN' ? 'Newer Entry' : 'Entri Lebih Baru'}
              </span>
              <span className="text-xs font-mono font-medium tracking-wide text-rose block mb-1">
                {newerEntry.id}
              </span>
              <h4 className="text-sm md:text-base font-display font-medium uppercase italic tracking-tight text-ink group-hover:text-rose transition-colors line-clamp-2">
                {dict.locale === 'EN' && newerEntry.title_en ? newerEntry.title_en : newerEntry.title}
              </h4>
            </Link>
          ) : (
            <div className="hidden md:block" />
          )}

          {olderEntry ? (
            <Link
              href={`/logbook/${olderEntry.slug}`}
              className="block bg-white border border-ink/10 p-5 hover:border-ink transition-all group md:text-right"
            >
              <span className="text-[9px] font-mono uppercase tracking-widest text-ink/40 block mb-1">
                {dict.locale === 'EN' ? 'Older Entry' : 'Entri Sebelumnya'} →
              </span>
              <span className="text-xs font-mono font-medium tracking-wide text-rose block mb-1">
                {olderEntry.id}
              </span>
              <h4 className="text-sm md:text-base font-display font-medium uppercase italic tracking-tight text-ink group-hover:text-rose transition-colors line-clamp-2">
                {dict.locale === 'EN' && olderEntry.title_en ? olderEntry.title_en : olderEntry.title}
              </h4>
            </Link>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      </div>
    </main>
  );
}
