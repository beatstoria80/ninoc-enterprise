"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface HelpSection {
  key: string;
  label: string;
  icon: string;
}

const HELP_SECTIONS: HelpSection[] = [
  { key: 'help_guide_customer_care', label: 'Customer Care', icon: 'CS' },
  { key: 'help_guide_payment', label: 'Payment', icon: 'PY' },
  { key: 'help_guide_return', label: 'Return & Refund', icon: 'RT' },
  { key: 'help_guide_shipping', label: 'Shipping', icon: 'SH' },
  { key: 'help_guide_how_to_order', label: 'How to Order', icon: 'HO' },
  { key: 'help_guide_how_to_track', label: 'Tracking', icon: 'TR' },
  { key: 'help_guide_terms', label: 'Terms', icon: 'TC' },
  { key: 'help_guide_privacy', label: 'Privacy', icon: 'PP' },
];

interface SettingItem {
  key: string;
  value: any;
}

function SectionContent({ value, type }: { value: any; type: string }) {
  if (!value) return null;

  // Object with guide + accounts (payment)
  if (typeof value === 'object' && value.guide) {
    return (
      <div className="space-y-4">
        <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">
          {value.guide}
        </p>
        {value.accounts?.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-ink/5 pt-4">
            <p className="text-[8px] uppercase tracking-widest font-semibold text-ink/30 mb-2">Rekening Tujuan</p>
            {value.accounts.map((acc: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 border border-ink/5 bg-ink/[0.02]">
                <span className="text-[8px] font-medium text-rose/40 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[10px] font-medium text-ink/70">{acc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Object with info + area (shipping)
  if (typeof value === 'object' && value.info) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">
          {value.info}
        </p>
        {value.area && (
          <p className="text-[9px] font-semibold text-ink/40 uppercase tracking-widest border-t border-ink/5 pt-3">
            {value.area}
          </p>
        )}
      </div>
    );
  }

  // Plain string
  return (
    <p className="text-[10px] leading-relaxed whitespace-pre-line text-ink/60 font-medium">
      {value}
    </p>
  );
}

export default function HelpPage() {
  const [settings, setSettings] = useState<Record<string, SettingItem>>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('help_guide_customer_care');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/help');
        const json = await res.json();
        const data: SettingItem[] = json.data || [];
        const map: Record<string, SettingItem> = {};
        data.forEach(item => { map[item.key] = item; });
        setSettings(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeItem = settings[activeSection];

  return (
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-ink/5 px-6 py-4 flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-2 text-ink/30 hover:text-ink transition-all group">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:-translate-x-1 transition-transform">
            <path d="M10 7H4M4 7L7 4M4 7L7 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[9px] uppercase tracking-[0.25em] font-semibold">Return to Archive</span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-none">
          <span className="font-display font-medium italic text-rose text-lg tracking-tighter uppercase">NINOC</span>
        </div>
        <div className="w-16" />
      </header>

      {/* Main Layout */}
      <div className="pt-20 max-w-[1200px] mx-auto px-6 pb-20">
        {/* Title */}
        <div className="border-b border-ink/5 pb-4 mb-0">
          <div className="flex items-baseline gap-4">
            <h1 className="font-display font-medium italic text-2xl tracking-tighter uppercase text-ink">Help Guide</h1>
            <span className="text-[8px] uppercase tracking-widest text-ink/30 font-semibold">ARCHIVAL CATALOG</span>
          </div>
          <p className="text-[9px] text-ink/30 mt-2 uppercase tracking-widest">Panduan customer care, pembayaran, pengiriman, dan ketentuan lainnya</p>
        </div>

        {/* Content Grid: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-0 mt-0">

          {/* Section Tabs — Sidebar */}
          <div className="lg:w-[180px] shrink-0 lg:border-r lg:border-ink/5 lg:pr-0 pr-0">
            <div className="flex lg:flex-col gap-0 overflow-x-auto lg:overflow-visible no-scrollbar lg:pt-6 pb-2 lg:pb-0">
              {HELP_SECTIONS.map((section) => {
                const item = settings[section.key];
                const hasContent = item && (item.value?.guide || item.value?.info || item.value?.policy || item.value);
                return (
                  <button
                    key={section.key}
                    onClick={() => { setActiveSection(section.key); setIsMobileOpen(false); }}
                    className={`
                      shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-ink/5 lg:border-b lg:border-r lg:border-l
                      transition-all text-left whitespace-nowrap
                      ${activeSection === section.key
                        ? 'bg-rose text-white border-rose lg:border-rose'
                        : 'text-ink/40 hover:text-ink hover:bg-ink/[0.02] border-transparent'
                      }
                    `}
                  >
                    <span className={`
                      text-[8px] font-semibold tabular-nums w-5 h-5 flex items-center justify-center rounded-sm
                      shrink-0
                      ${activeSection === section.key ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink/30'}
                    `}>
                      {section.icon}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 lg:pl-8 pt-6 lg:pt-6 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-5 h-5 border border-ink/10 border-t-rose rounded-full animate-spin" />
              </div>
            ) : activeItem ? (
              <div>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ink/5">
                  <div className="w-8 h-8 border border-ink/10 flex items-center justify-center bg-ink/[0.02]">
                    <span className="text-[9px] font-semibold uppercase">{activeItem.key.split('_').pop()?.slice(0, 3) || 'XX'}</span>
                  </div>
                  <div>
                    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink">
                      {HELP_SECTIONS.find(s => s.key === activeItem.key)?.label}
                    </h2>
                    <p className="text-[8px] text-ink/30 uppercase tracking-widest mt-0.5">
                      {activeItem.key.replace('help_guide_', '').toUpperCase()}
                    </p>
                  </div>
                </div>
                <SectionContent value={activeItem.value} type={activeItem.key} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-ink/20">
                <div className="w-8 h-8 border border-ink/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v6M7 10v1M2 7h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[9px] uppercase tracking-widest font-semibold">Content not available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-ink/5 px-6 py-4">
        <p className="text-[8px] text-ink/20 uppercase tracking-widest text-center">
          Informasi di halaman ini dikelola oleh Studio dan dapat diubah sewaktu-waktu
        </p>
      </div>
    </main>
  );
}