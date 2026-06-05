"use client";

import { useState } from 'react';
import GlobalFooter from '@/components/Footer';

const content = {
  EN: {
    label: 'NINOC ENTERPRISE',
    title: 'About Us',
    tagline: 'Born in Bandung. Made for the world.',
    story: {
      heading: 'Our Story',
      body: 'NINOC was founded with a simple vision: create clothing that speaks to the soul. Based in Bandung, Indonesia, we blend local craftsmanship with global aesthetics.',
    },
    philosophy: {
      heading: 'Philosophy',
      body: '"Wear the art, own the day." Every piece is a canvas. Every wearer is an artist.',
    },
    mission: {
      heading: 'Mission',
      body: 'To deliver premium archival garments that merge industrial precision with cultural authenticity — creating pieces that endure beyond trends.',
    },
    image: 'NINOC STUDIO — BANDUNG, INDONESIA',
    stats: {
      est: { label: 'Est.', value: '2024' },
      location: { label: 'Location', value: 'Bandung' },
      contact: { label: 'Contact', value: 'hello@ninoc.art' },
    },
    verified: {
      label: 'Origin Verified',
      body: 'Not just clothing. These are artifacts born from the streets, the stage, and the culture.',
    },
  },
  ID: {
    label: 'NINOC ENTERPRISE',
    title: 'Tentang Kami',
    tagline: 'Berawal dari Bandung. Dibuat untuk dunia.',
    story: {
      heading: 'Cerita Kami',
      body: 'NINOC didirikan dengan visi sederhana: menciptakan pakaian yang berbicara kepada jiwa. Bermarkas di Bandung, Indonesia, kami memadukan keahlian lokal dengan estetika global.',
    },
    philosophy: {
      heading: 'Filosofi',
      body: '"Kenakan seni, kuasai hari." Setiap pieces adalah kanvas. Setiap pemakai adalah seniman.',
    },
    mission: {
      heading: 'Misi',
      body: 'Menghadirkan garment archival premium yang memadukan presisi industrial dengan keaslian budaya — menciptakan pieces yang bertahan melampaui tren.',
    },
    image: 'STUDIO NINOC — BANDUNG, INDONESIA',
    stats: {
      est: { label: 'Didirikan', value: '2024' },
      location: { label: 'Lokasi', value: 'Bandung' },
      contact: { label: 'Kontak', value: 'hello@ninoc.art' },
    },
    verified: {
      label: 'Terverifikasi Origin',
      body: 'Bukan sekadar pakaian. Ini adalah artefak yang lahir dari jalanan, panggung, dan budaya yang membentuk siapa kami.',
    },
  },
};

export default function About() {
  const [lang, setLang] = useState<'EN' | 'ID'>('ID');
  const t = content[lang];

  return (
    <div className="h-screen flex flex-col bg-white text-ink font-medium selection:bg-ink selection:text-white overflow-hidden pt-14 md:pt-24">
      {/* TOP BAR — language switcher + brand */}
      <div className="shrink-0 border-b border-ink/5 z-50">
        <div className="flex items-center justify-between px-4 md:px-8 lg:px-12 py-2 md:py-3 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-rose/10 rounded-full flex items-center justify-center">
              <span className="text-[6px] md:text-[8px] font-bold text-rose uppercase">{lang}</span>
            </div>
            <span className="text-[7px] md:text-[9px] font-medium uppercase tracking-[0.3em] md:tracking-[0.4em] text-ink/40">{content[lang].label}</span>
          </div>
          <div className="flex items-center gap-1 bg-ink/5 rounded-full px-1 py-0.5 md:px-1.5 md:py-1">
            <button
              onClick={() => setLang('ID')}
              className={`px-2 py-0.5 md:px-3 md:py-1 text-[7px] md:text-[9px] font-medium rounded-full transition-all duration-200 ease-out ${lang === 'ID' ? 'bg-rose text-white shadow-sm' : 'text-ink/40 hover:text-ink hover:bg-ink/10'}`}
            >
              ID
            </button>
            <span className="text-ink/10 text-[8px] md:text-[10px]">|</span>
            <button
              onClick={() => setLang('EN')}
              className={`px-2 py-0.5 md:px-3 md:py-1 text-[7px] md:text-[9px] font-medium rounded-full transition-all duration-200 ease-out ${lang === 'EN' ? 'bg-rose text-white shadow-sm' : 'text-ink/40 hover:text-ink hover:bg-ink/10'}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col px-4 md:px-8 lg:px-12 max-w-7xl mx-auto w-full">

          {/* Title Block */}
          <div className="shrink-0 pt-3 md:pt-10 lg:pt-14 pb-3 md:pb-8">
            <p className="text-[6px] md:text-[9px] font-medium uppercase tracking-[0.4em] text-rose mb-1.5 md:mb-3">{t.label}</p>
            <h1 className="font-display font-medium italic text-lg md:text-5xl lg:text-7xl tracking-tighter uppercase text-ink leading-[0.85]">{t.title}</h1>
            <p className="text-[7px] md:text-xs font-medium text-ink/40 uppercase tracking-[0.2em] mt-1.5 md:mt-4">{t.tagline}</p>
          </div>

          {/* Content Grid */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-12 lg:gap-24 overflow-hidden border-t border-ink/5 pt-3 md:pt-8 lg:pt-10">

            {/* Left: Story & Philosophy — scrollable */}
            <div className="md:col-span-6 lg:col-span-5 overflow-y-auto no-scrollbar space-y-4 md:space-y-10 pr-2 pb-8">
              <div className="space-y-1 md:space-y-4">
                <h3 className="text-[10px] md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">{t.story.heading}</h3>
                <p className="text-[8px] md:text-sm lg:text-base font-medium text-ink/60 leading-relaxed md:leading-loose">{t.story.body}</p>
              </div>
              <div className="space-y-1 md:space-y-4">
                <h3 className="text-[10px] md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">{t.philosophy.heading}</h3>
                <p className="text-[8px] md:text-sm lg:text-base font-medium text-ink/60 leading-relaxed md:leading-loose">{t.philosophy.body}</p>
              </div>
              <div className="space-y-1 md:space-y-4">
                <h3 className="text-[10px] md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">{t.mission.heading}</h3>
                <p className="text-[8px] md:text-sm lg:text-base font-medium text-ink/60 leading-relaxed md:leading-loose">{t.mission.body}</p>
              </div>
            </div>

            {/* Right: Visual + Stats */}
            <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-3 md:gap-6 lg:gap-8 overflow-hidden pb-4 md:pb-8">
              {/* Image placeholder */}
              <div className="hidden md:flex h-32 lg:h-56 bg-ink/[0.02] rounded-xl lg:rounded-3xl border border-ink/5 items-center justify-center shrink-0 transition-colors duration-500 hover:bg-ink/[0.04]">
                <span className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest text-ink/30">{t.image}</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 shrink-0">
                <div className="bg-white border border-ink/5 p-2 md:p-5 lg:p-6 rounded-md md:rounded-2xl transition-all duration-300 hover:shadow-sm hover:border-ink/10">
                  <p className="text-[4px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">{t.stats.est.label}</p>
                  <p className="text-[9px] md:text-2xl font-display font-medium italic text-ink mt-1.5">{t.stats.est.value}</p>
                </div>
                <div className="bg-white border border-ink/5 p-2 md:p-5 lg:p-6 rounded-md md:rounded-2xl transition-all duration-300 hover:shadow-sm hover:border-ink/10">
                  <p className="text-[4px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">{t.stats.location.label}</p>
                  <p className="text-[9px] md:text-2xl font-display font-medium italic text-ink mt-1.5">{t.stats.location.value}</p>
                </div>
                <div className="bg-white border border-ink/5 p-2 md:p-5 lg:p-6 rounded-md md:rounded-2xl transition-all duration-300 hover:shadow-sm hover:border-ink/10">
                  <p className="text-[4px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">{t.stats.contact.label}</p>
                  <p className="text-[6px] md:text-sm font-display font-medium italic text-rose mt-2 md:mt-3 break-all">{t.stats.contact.value}</p>
                </div>
              </div>

              {/* Tagline */}
              <div className="bg-ink p-3 md:p-6 lg:p-8 rounded-lg md:rounded-3xl shrink-0 flex-1 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"></div>
                <p className="text-[6px] md:text-[10px] font-medium uppercase leading-normal tracking-[0.3em] text-white/50 mb-1.5 md:mb-3 relative z-10">{t.verified.label}</p>
                <p className="text-[6px] md:text-sm lg:text-lg font-medium uppercase leading-relaxed tracking-wider text-white max-w-lg relative z-10">{t.verified.body}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <div className="shrink-0">
        <GlobalFooter />
      </div>
    </div>
  );
}