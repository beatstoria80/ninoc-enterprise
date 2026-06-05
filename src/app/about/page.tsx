"use client";

import { useState } from 'react';

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
    <div className="w-full bg-white text-ink font-medium selection:bg-ink selection:text-white pt-24 md:pt-32 pb-16 md:pb-24">
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 lg:px-12">
        
        {/* Title Block & Language Switcher */}
        <div className="pb-6 md:pb-10 relative flex flex-row items-start justify-between">
          <div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-rose mb-1.5 md:mb-3">{t.label}</p>
            <h1 className="font-display font-medium italic text-3xl md:text-5xl lg:text-6xl tracking-tighter uppercase text-ink leading-[0.85]">{t.title}</h1>
            <p className="text-[9px] md:text-[11px] font-medium text-ink/40 uppercase tracking-[0.25em] mt-2 md:mt-4">{t.tagline}</p>
          </div>
          
          <div className="flex items-center gap-1 bg-ink/5 rounded-full px-1 py-0.5 md:px-1.5 md:py-1 shrink-0">
            <button
              onClick={() => setLang('ID')}
              className={`px-2 py-0.5 md:px-3 md:py-1 text-[8px] md:text-[9px] font-bold rounded-full transition-all duration-200 ease-out ${lang === 'ID' ? 'bg-rose text-white shadow-sm' : 'text-ink/40 hover:text-ink hover:bg-ink/10'}`}
            >
              ID
            </button>
            <span className="text-ink/10 text-[8px] md:text-[10px]">|</span>
            <button
              onClick={() => setLang('EN')}
              className={`px-2 py-0.5 md:px-3 md:py-1 text-[8px] md:text-[9px] font-bold rounded-full transition-all duration-200 ease-out ${lang === 'EN' ? 'bg-rose text-white shadow-sm' : 'text-ink/40 hover:text-ink hover:bg-ink/10'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16 border-t border-ink/5 pt-6 md:pt-10">

          {/* Left: Story & Philosophy */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-8 md:gap-12">
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-sm md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">{t.story.heading}</h3>
              <p className="text-xs md:text-sm lg:text-base font-medium text-ink/60 leading-relaxed md:leading-loose">{t.story.body}</p>
            </div>
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-sm md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">{t.philosophy.heading}</h3>
              <p className="text-xs md:text-sm lg:text-base font-medium text-ink/60 leading-relaxed md:leading-loose">{t.philosophy.body}</p>
            </div>
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-sm md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">{t.mission.heading}</h3>
              <p className="text-xs md:text-sm lg:text-base font-medium text-ink/60 leading-relaxed md:leading-loose">{t.mission.body}</p>
            </div>
          </div>

          {/* Right: Visual + Stats */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-6 md:gap-8">
            {/* Image placeholder */}
            <div className="w-full h-48 md:h-64 lg:h-[280px] bg-ink/[0.02] rounded-xl lg:rounded-[24px] border border-ink/5 flex items-center justify-center transition-colors duration-500 hover:bg-ink/[0.04]">
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-ink/30">{t.image}</span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white border border-ink/5 p-4 md:p-6 rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-sm hover:border-ink/10 flex flex-col justify-center">
                <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40">{t.stats.est.label}</p>
                <p className="text-sm md:text-xl lg:text-2xl font-display font-medium italic text-ink mt-2 md:mt-3">{t.stats.est.value}</p>
              </div>
              <div className="bg-white border border-ink/5 p-4 md:p-6 rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-sm hover:border-ink/10 flex flex-col justify-center">
                <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40">{t.stats.location.label}</p>
                <p className="text-sm md:text-xl lg:text-2xl font-display font-medium italic text-ink mt-2 md:mt-3">{t.stats.location.value}</p>
              </div>
              <div className="bg-white border border-ink/5 p-4 md:p-6 rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-sm hover:border-ink/10 flex flex-col justify-center">
                <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40">{t.stats.contact.label}</p>
                <p className="text-[8px] md:text-[10px] lg:text-xs font-display font-medium italic text-rose mt-2 md:mt-3 break-all">{t.stats.contact.value}</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="bg-ink p-6 md:p-8 lg:p-10 rounded-xl lg:rounded-[24px] flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"></div>
              <p className="text-[8px] md:text-[9px] font-bold uppercase leading-normal tracking-[0.3em] text-white/50 mb-2 md:mb-3 relative z-10">{t.verified.label}</p>
              <p className="text-[10px] md:text-sm lg:text-base font-medium uppercase leading-relaxed tracking-wider text-white max-w-lg relative z-10">{t.verified.body}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}