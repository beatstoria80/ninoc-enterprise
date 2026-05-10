export default function Sustainability() {
  return (
    <main className="min-h-screen bg-cr noise pt-32 px-6 md:px-12">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-16">
          <span className="text-[10px] font-medium uppercase tracking-[0.5em] text-rose">NINOC</span>
          <h1 className="text-6xl md:text-8xl font-display font-medium italic tracking-tighter text-ink uppercase mt-4">Sustainability</h1>
          <p className="text-sm font-medium text-ink/60 uppercase tracking-wider mt-6 max-w-xl">Committed to minimal environmental impact.</p>
        </div>

        <div className="py-20 space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Organic Materials</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">All fabrics are sourced from certified organic suppliers. No harmful chemicals, no synthetic pesticides.</p>
            </div>
            <div className="h-64 bg-white rounded-2xl border border-ink/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="h-64 bg-white rounded-2xl border border-ink/5 order-2 md:order-1" />
            <div className="space-y-6 order-1 md:order-2">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Ethical Production</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">Fair wages, safe conditions. Every piece is crafted with respect for people and planet.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Zero Waste</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">Packaging is 100% recyclable. Fabric scraps are repurposed into accessories.</p>
            </div>
            <div className="h-64 bg-white rounded-2xl border border-ink/5" />
          </div>
        </div>
      </div>
    </main>
  );
}