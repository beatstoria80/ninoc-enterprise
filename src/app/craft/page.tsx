import { Metadata } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');

export const metadata: Metadata = {
  title: 'Craft — Premium Archival Garment Studio',
  description: 'The art of making, the love of detail. NINOC craft process — premium materials, handmade precision, zero waste packaging.',
  openGraph: {
    title: 'Craft | NINOC STORE',
    description: 'The art of making, the love of detail. Discover NINOC craft process.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/craft`,
  },
};

export default function Craft() {
  return (
    <main className="min-h-screen bg-cr noise pt-24 md:pt-36 px-4 md:px-12">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-4 md:mb-12">
          <span className="text-xs md:text-[9px] font-medium uppercase tracking-[0.5em] text-rose">NINOC</span>
          <h1 className="text-3xl md:text-7xl font-display font-medium italic tracking-tighter text-ink uppercase mt-1 md:mt-2">Craft</h1>
          <p className="text-[11px] md:text-xs font-medium text-ink/50 uppercase tracking-wider mt-1 md:mt-2 max-w-xl">The art of making, the love of detail.</p>
        </div>

        <div className="pb-12 md:pb-24 space-y-6 md:space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-center">
            <div className="space-y-3">
              <h3 className="text-xl md:text-3xl font-display font-medium italic uppercase tracking-tight">Premium Materials</h3>
              <p className="text-xs md:text-[10px] md:text-sm font-medium text-ink/60 leading-relaxed">All fabrics are sourced from certified suppliers. No harmful chemicals, no synthetic pesticides.</p>
            </div>
            <div className="h-28 md:h-48 bg-white rounded-xl border border-ink/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-center">
            <div className="h-28 md:h-48 bg-white rounded-xl border border-ink/5 order-2 md:order-1" />
            <div className="space-y-3 order-1 md:order-2">
              <h3 className="text-xl md:text-3xl font-display font-medium italic uppercase tracking-tight">Handmade Precision</h3>
              <p className="text-xs md:text-[10px] md:text-sm font-medium text-ink/60 leading-relaxed">Every stitch is placed with intention. Our artisans bring decades of expertise to each piece.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-center">
            <div className="space-y-3">
              <h3 className="text-xl md:text-3xl font-display font-medium italic uppercase tracking-tight">Zero Waste</h3>
              <p className="text-xs md:text-[10px] md:text-sm font-medium text-ink/60 leading-relaxed">Packaging is 100% recyclable. Fabric scraps are repurposed into accessories.</p>
            </div>
            <div className="h-28 md:h-48 bg-white rounded-xl border border-ink/5" />
          </div>
        </div>
      </div>
    </main>
  );
}