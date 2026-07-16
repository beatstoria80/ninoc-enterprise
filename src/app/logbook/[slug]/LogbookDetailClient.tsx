"use client";

import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, Share2, Check, Clock, FileText, Type } from 'lucide-react';
import Image from 'next/image';
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
const DURATION = { normal: 0.18, medium: 0.25, slow: 0.35 };

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
  const [fontSizeScale, setFontSizeScale] = useState<'sm' | 'md' | 'lg'>('md');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  const title = dict.locale === 'EN' && entry.title_en ? entry.title_en : entry.title;
  const excerpt = dict.locale === 'EN' && entry.excerpt_en ? entry.excerpt_en : entry.excerpt;
  const rawContent = dict.locale === 'EN' && entry.content_en ? entry.content_en : entry.content;

  const blocks = React.useMemo(() => {
    const rawBlocks = rawContent.split(/\n+/).map(b => b.trim()).filter(Boolean);
    const firstRegularIdx = rawBlocks.findIndex((block) => {
      const isHeading2 = block.startsWith('## ');
      const isHeading3 = block.startsWith('### ');
      const isQuote = block.startsWith('>');
      const isList = block.startsWith('- ') || block.startsWith('* ');
      return !isHeading2 && !isHeading3 && !isQuote && !isList;
    });

    return rawBlocks.map((block, idx) => {
      const isHeading2 = block.startsWith('## ');
      const isHeading3 = block.startsWith('### ');
      const isQuote = block.startsWith('>');
      const isList = block.startsWith('- ') || block.startsWith('* ');
      const isRegular = !isHeading2 && !isHeading3 && !isQuote && !isList;
      const isFirstRegular = idx === firstRegularIdx;
      return { block, isHeading2, isHeading3, isQuote, isList, isRegular, isFirstRegular, id: idx };
    });
  }, [rawContent]);

  // Calculate word count and estimated reading time
  const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} | NINOC Logbook Studio`,
          text: excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFontSizeClass = () => {
    if (fontSizeScale === 'sm') return 'text-xs md:text-sm lg:text-base leading-[1.8]';
    if (fontSizeScale === 'lg') return 'text-base md:text-lg lg:text-xl leading-[1.9]';
    return 'text-sm md:text-base lg:text-[17px] leading-[1.85]';
  };

  return (
    <main className="min-h-screen bg-[#F8F7F4] pt-24 md:pt-36 pb-28 text-ink selection:bg-rose selection:text-white">
      {/* Top Hairline Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-rose z-50 origin-left"
        style={{ scaleX }}
      />

      <div className="max-w-[840px] mx-auto px-4 md:px-8">
        {/* Top Nav & Action Bar */}
        <div className="flex items-center justify-between mb-8 md:mb-12 border-b border-ink/10 pb-4">
          <Link
            href="/logbook"
            className="flex items-center gap-2 text-ink/60 hover:text-rose transition-colors py-1 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-mono uppercase tracking-[0.2em]">
              {dict.locale === 'EN' ? 'Back to Studio Registry' : 'Kembali ke Arsip Studio'}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Reading Mode Text Scaler */}
            <div className="hidden sm:flex items-center gap-1 border border-ink/15 bg-white px-2 py-1">
              <Type size={12} className="text-ink/40 mr-1" />
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSizeScale(size)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 uppercase transition-colors ${
                    fontSizeScale === size ? 'bg-ink text-white font-bold' : 'text-ink/60 hover:text-ink'
                  }`}
                  title={`Adjust text size: ${size}`}
                >
                  {size === 'sm' ? 'A-' : size === 'md' ? 'A' : 'A+'}
                </button>
              ))}
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 border border-ink/15 bg-white hover:border-ink px-3 py-1.5 transition-all text-xs font-mono tracking-wider text-ink active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600 font-medium">
                    {dict.locale === 'EN' ? 'COPIED' : 'TERSALIN'}
                  </span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>{dict.locale === 'EN' ? 'SHARE' : 'BAGIKAN'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Article Metadata & Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.medium, ease: EASING.out }}
          className="mb-8 md:mb-12"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-widest text-ink/60 mb-4">
            <span className="bg-ink text-white px-2.5 py-1 font-bold tracking-[0.2em]">
              {entry.id}
            </span>
            <span className="text-rose font-bold">• {entry.category}</span>
            <span>• {entry.date}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-medium uppercase italic tracking-tight text-ink leading-[1.15] mb-6">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-ink/60 border-y border-ink/10 py-3.5 my-6">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-rose" />
              <span>
                {readingTimeMinutes} {dict.locale === 'EN' ? 'MIN READ' : 'MENIT BACA'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-ink/40" />
              <span>
                {wordCount} {dict.locale === 'EN' ? 'WORDS RECORDED' : 'KATA TERCATAT'}
              </span>
            </div>
            <div className="ml-auto hidden md:block text-[11px] uppercase tracking-widest text-ink/40">
              {dict.locale === 'EN' ? 'VERIFIED TECHNICAL LOG' : 'CATATAN TEKNIS TERVERIFIKASI'}
            </div>
          </div>

          {excerpt && (
            <p className="text-base md:text-xl font-sans font-normal italic text-ink/85 leading-relaxed border-l-2 border-rose pl-4 md:pl-6 my-6">
              {excerpt}
            </p>
          )}
        </motion.header>

        {/* Cover Illustration Image */}
        {entry.image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION.slow, delay: 0.1, ease: EASING.out }}
            className="mb-10 md:mb-14 border border-ink/15 bg-white p-2 md:p-3 shadow-sm relative aspect-[16/9] overflow-hidden"
          >
            <Image
              src={entry.image_url}
              alt={title}
              fill
              sizes="(max-width: 840px) 100vw, 840px"
              priority
              className="object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          </motion.div>
        )}

        {/* Article Body */}
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.slow, delay: 0.2 }}
          className={`space-y-6 md:space-y-8 font-sans text-ink/90 border-b border-ink/10 pb-16 ${getFontSizeClass()}`}
        >
          {blocks.map((item) => {
            if (item.isHeading2) {
              const headingText = item.block.replace(/^##\s*/, '');
              return (
                <h2
                  key={item.id}
                  className="text-xl md:text-2xl lg:text-3xl font-display font-medium uppercase tracking-tight text-ink mt-12 mb-4 pt-6 border-t border-ink/15"
                >
                  {headingText}
                </h2>
              );
            }

            if (item.isHeading3) {
              const headingText = item.block.replace(/^###\s*/, '');
              return (
                <h3
                  key={item.id}
                  className="text-lg md:text-xl lg:text-2xl font-display font-medium uppercase tracking-tight text-ink mt-8 mb-3"
                >
                  {headingText}
                </h3>
              );
            }

            if (item.isQuote) {
              const quoteText = item.block.replace(/^>\s*/, '').replace(/"/g, '');
              return (
                <blockquote
                  key={item.id}
                  className="my-8 md:my-10 bg-white border border-ink/15 border-l-4 border-l-rose p-6 md:p-8 shadow-sm font-display italic text-lg md:text-2xl text-ink tracking-tight leading-relaxed"
                >
                  <p>&ldquo;{quoteText}&rdquo;</p>
                  <footer className="mt-3 text-[11px] font-mono not-italic uppercase tracking-[0.2em] text-ink/50">
                    — NINOC Studio Design Engineering & Quality Standard
                  </footer>
                </blockquote>
              );
            }

            if (item.isList) {
              const listText = item.block.replace(/^[-*]\s*/, '');
              return (
                <div
                  key={item.id}
                  className="my-4 bg-white border border-ink/10 p-4 md:p-5 shadow-sm flex items-start gap-3"
                >
                  <span className="text-rose font-mono font-bold mt-0.5">•</span>
                  <span className="text-sm md:text-base font-mono leading-relaxed text-ink/90">
                    {listText}
                  </span>
                </div>
              );
            }

            return (
              <p
                key={item.id}
                className={`${
                  item.isFirstRegular
                    ? 'text-base md:text-lg lg:text-xl font-medium leading-[1.8] text-ink first-letter:text-3xl first-letter:md:text-4xl first-letter:font-display first-letter:font-bold first-letter:mr-1.5 first-letter:float-left first-letter:leading-none first-letter:pt-1 first-letter:text-rose'
                    : 'leading-[1.85] text-ink/90'
                }`}
              >
                {item.block}
              </p>
            );
          })}
        </motion.article>

        {/* Footer / Chronological Adjacent Navigation */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {newerEntry ? (
            <Link
              href={`/logbook/${newerEntry.slug}`}
              className="block bg-white border border-ink/15 p-5 hover:border-ink transition-all group active:scale-[0.99]"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40 block mb-1">
                ← {dict.locale === 'EN' ? 'Newer Archival Record' : 'Arsip Lebih Baru'}
              </span>
              <span className="text-xs font-mono font-medium tracking-wide text-rose block mb-1.5">
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
              className="block bg-white border border-ink/15 p-5 hover:border-ink transition-all group md:text-right active:scale-[0.99]"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40 block mb-1">
                {dict.locale === 'EN' ? 'Older Archival Record' : 'Arsip Sebelumnya'} →
              </span>
              <span className="text-xs font-mono font-medium tracking-wide text-rose block mb-1.5">
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
