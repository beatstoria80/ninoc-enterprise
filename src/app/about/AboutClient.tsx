"use client";

import { useDictionary } from '@/hooks/useDictionary';

export default function AboutClient() {
  const dict = useDictionary();
  const t = dict.about;

  return (
    <div className="w-full bg-white text-ink font-medium selection:bg-ink selection:text-white pt-6 md:pt-24 pb-6 md:pb-10">
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 lg:px-12">

        {/* Title Block */}
        <div className="pb-4 md:pb-6 relative flex flex-row items-start justify-between">
          <div>
            <p className="text-[11px] md:text-[8px] md:text-[9px] font-bold uppercase tracking-[0.4em] text-rose mb-1 md:mb-1.5">{t.label}</p>
            <h1 className="font-display font-medium italic text-2xl md:text-3xl lg:text-4xl tracking-tighter uppercase text-ink leading-[0.85]">{t.title}</h1>
            <p className="text-[11px] md:text-[8px] md:text-[10px] font-medium text-ink/40 uppercase tracking-[0.25em] mt-1 md:mt-2">{t.tagline}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 border-t border-ink/5 pt-4 md:pt-6">

          {/* Left: Story & Philosophy */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-4 md:gap-6">
            <div className="space-y-1 md:space-y-1.5">
              <h3 className="text-xs md:text-sm lg:text-base font-display font-medium italic uppercase tracking-tight text-ink">{t.story.heading}</h3>
              <p className="text-xs md:text-[9px] md:text-[10px] lg:text-xs font-medium text-ink/60 leading-relaxed">{t.story.body}</p>
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <h3 className="text-xs md:text-sm lg:text-base font-display font-medium italic uppercase tracking-tight text-ink">{t.philosophy.heading}</h3>
              <p className="text-xs md:text-[9px] md:text-[10px] lg:text-xs font-medium text-ink/60 leading-relaxed">{t.philosophy.body}</p>
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <h3 className="text-xs md:text-sm lg:text-base font-display font-medium italic uppercase tracking-tight text-ink">{t.mission.heading}</h3>
              <p className="text-xs md:text-[9px] md:text-[10px] lg:text-xs font-medium text-ink/60 leading-relaxed">{t.mission.body}</p>
            </div>
          </div>

          {/* Right: Visual + Stats */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-3 md:gap-4">
            {/* Image placeholder */}
            <div className="w-full h-24 md:h-32 lg:h-48 bg-ink/[0.02] rounded-xl lg:rounded-[16px] border border-ink/5 flex items-center justify-center transition-colors duration-500 hover:bg-ink/[0.04]">
              <span className="text-[11px] md:text-[8px] md:text-[9px] lg:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/30">{t.image}</span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="bg-white border border-ink/5 p-2 md:p-3 lg:p-4 rounded-xl transition-all duration-300 hover:shadow-sm hover:border-ink/10 flex flex-col justify-center">
                <p className="text-[6px] md:text-[7px] font-bold uppercase tracking-[0.2em] text-ink/40">{t.stats.est.label}</p>
                <p className="text-xs md:text-sm lg:text-base font-display font-medium italic text-ink mt-1 md:mt-1.5">{t.stats.est.value}</p>
              </div>
              <div className="bg-white border border-ink/5 p-2 md:p-3 lg:p-4 rounded-xl transition-all duration-300 hover:shadow-sm hover:border-ink/10 flex flex-col justify-center">
                <p className="text-[6px] md:text-[7px] font-bold uppercase tracking-[0.2em] text-ink/40">{t.stats.location.label}</p>
                <p className="text-xs md:text-sm lg:text-base font-display font-medium italic text-ink mt-1 md:mt-1.5">{t.stats.location.value}</p>
              </div>
              <div className="bg-white border border-ink/5 p-2 md:p-3 lg:p-4 rounded-xl transition-all duration-300 hover:shadow-sm hover:border-ink/10 flex flex-col justify-center">
                <p className="text-[6px] md:text-[7px] font-bold uppercase tracking-[0.2em] text-ink/40">{t.stats.contact.label}</p>
                <p className="text-[10px] md:text-[7px] md:text-[8px] lg:text-[9px] font-display font-medium italic text-rose mt-1 md:mt-1.5 break-all">{t.stats.contact.value}</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="bg-ink p-4 md:p-5 lg:p-6 rounded-xl lg:rounded-[16px] flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"></div>
              <p className="text-[10px] md:text-[7px] md:text-[8px] font-bold uppercase leading-normal tracking-[0.3em] text-white mb-1 md:mb-1.5 relative z-10">{t.verified.label}</p>
              <p className="text-xs md:text-[9px] md:text-[10px] lg:text-xs font-medium uppercase leading-relaxed tracking-wider text-white max-w-lg relative z-10">{t.verified.body}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
