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
    <div className="h-screen flex flex-col bg-white text-ink font-medium selection:bg-ink selection:text-white overflow-hidden">
      {/* TOP BAR — language switcher + brand */}
      <div className="shrink-0 flex items-center justify-between px-4 md:px-8 py-2 border-b border-ink/5 z-50">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-rose/10 rounded-full flex items-center justify-center">
            <span className="text-[6px] font-bold text-rose uppercase">{lang}</span>
          </div>
          <span className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/40">{content[lang].label}</span>
        </div>
        <div className="flex items-center gap-1 bg-ink/5 rounded-full px-1 py-0.5">
          <button
            onClick={() => setLang('ID')}
            className={`px-2 py-0.5 text-[7px] font-medium rounded-full transition-all ${lang === 'ID' ? 'bg-rose text-white' : 'text-ink/40 hover:text-ink'}`}
          >
            ID
          </button>
          <span className="text-ink/10 text-[8px]">|</span>
          <button
            onClick={() => setLang('EN')}
            className={`px-2 py-0.5 text-[7px] font-medium rounded-full transition-all ${lang === 'EN' ? 'bg-rose text-white' : 'text-ink/40 hover:text-ink'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col px-4 md:px-8">

          {/* Title Block */}
          <div className="shrink-0 pt-3 md:pt-6 pb-2">
            <p className="text-[7px] md:text-[8px] font-medium uppercase tracking-[0.4em] text-rose">{t.label}</p>
            <h1 className="font-display font-medium italic text-xl md:text-3xl tracking-tighter uppercase text-ink leading-[0.85]">{t.title}</h1>
            <p className="text-[8px] md:text-[9px] font-medium text-ink/40 uppercase tracking-wider mt-0.5">{t.tagline}</p>
          </div>

          {/* Content Grid */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 overflow-hidden border-t border-ink/5 pt-2">

            {/* Left: Story & Philosophy — scrollable */}
            <div className="overflow-y-auto no-scrollbar space-y-3 md:space-y-4 pr-1">
              <div className="space-y-1">
                <h3 className="text-[11px] md:text-sm font-display font-medium italic uppercase tracking-tight text-ink">{t.story.heading}</h3>
                <p className="text-[9px] md:text-[11px] font-medium text-ink/50 leading-relaxed">{t.story.body}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-[11px] md:text-sm font-display font-medium italic uppercase tracking-tight text-ink">{t.philosophy.heading}</h3>
                <p className="text-[9px] md:text-[11px] font-medium text-ink/50 leading-relaxed">{t.philosophy.body}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-[11px] md:text-sm font-display font-medium italic uppercase tracking-tight text-ink">{t.mission.heading}</h3>
                <p className="text-[9px] md:text-[11px] font-medium text-ink/50 leading-relaxed">{t.mission.body}</p>
              </div>
            </div>

            {/* Right: Visual + Stats */}
            <div className="flex flex-col gap-2 overflow-hidden">
              {/* Image placeholder */}
              <div className="h-16 md:h-24 bg-white rounded-lg border border-ink/5 flex items-center justify-center shrink-0">
                <span className="text-[7px] md:text-[8px] font-medium uppercase tracking-widest text-ink/20">{t.image}</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-1.5 shrink-0">
                <div className="bg-white border border-ink/5 p-2 rounded-lg">
                  <p className="text-[5px] md:text-[6px] font-medium uppercase tracking-widest text-ink/20">{t.stats.est.label}</p>
                  <p className="text-[11px] md:text-sm font-display font-medium italic text-ink mt-0.5">{t.stats.est.value}</p>
                </div>
                <div className="bg-white border border-ink/5 p-2 rounded-lg">
                  <p className="text-[5px] md:text-[6px] font-medium uppercase tracking-widest text-ink/20">{t.stats.location.label}</p>
                  <p className="text-[11px] md:text-sm font-display font-medium italic text-ink mt-0.5">{t.stats.location.value}</p>
                </div>
                <div className="bg-white border border-ink/5 p-2 rounded-lg">
                  <p className="text-[5px] md:text-[6px] font-medium uppercase tracking-widest text-ink/20">{t.stats.contact.label}</p>
                  <p className="text-[8px] md:text-[9px] font-display font-medium italic text-rose mt-0.5">{t.stats.contact.value}</p>
                </div>
              </div>

              {/* Tagline */}
              <div className="bg-ink p-3 md:p-4 rounded-lg shrink-0">
                <p className="text-[8px] md:text-[9px] font-medium uppercase leading-loose tracking-widest text-white/70">{t.verified.label}</p>
                <p className="text-[8px] md:text-[10px] font-medium uppercase leading-relaxed tracking-wider text-white mt-0.5">{t.verified.body}</p>
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