export default function Craft() {
  return (
    <main className="min-h-screen bg-cr noise pt-4 md:pt-32 px-6 md:px-12">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8 md:mb-16">
          <span className="text-[10px] font-medium uppercase tracking-[0.5em] text-rose">NINOC</span>
          <h1 className="text-6xl md:text-8xl font-display font-medium italic tracking-tighter text-ink uppercase mt-4">Craft</h1>
          <p className="text-sm font-medium text-ink/60 uppercase tracking-wider mt-6 max-w-xl">The art of making, the love of detail.</p>
        </div>

        <div className="py-8 md:py-20 space-y-12 md:space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Premium Materials</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">All fabrics are sourced from certified suppliers. No harmful chemicals, no synthetic pesticides.</p>
            </div>
            <div className="h-40 md:h-64 bg-white rounded-2xl border border-ink/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
            <div className="h-40 md:h-64 bg-white rounded-2xl border border-ink/5 order-2 md:order-1" />
            <div className="space-y-6 order-1 md:order-2">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Handmade Precision</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">Every stitch is placed with intention. Our artisans bring decades of expertise to each piece.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Zero Waste</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">Packaging is 100% recyclable. Fabric scraps are repurposed into accessories.</p>
            </div>
            <div className="h-40 md:h-64 bg-white rounded-2xl border border-ink/5" />
          </div>
        </div>
      </div>
    </main>
  );
}