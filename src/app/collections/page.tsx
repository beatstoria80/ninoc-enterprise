export default function Collections() {
  return (
    <main className="min-h-screen bg-cr noise pt-32 px-6 md:px-12">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-16">
          <span className="text-[10px] font-medium uppercase tracking-[0.5em] text-rose">NINOC</span>
          <h1 className="text-6xl md:text-8xl font-display font-medium italic tracking-tighter text-ink uppercase mt-4">Collections</h1>
          <p className="text-sm font-medium text-ink/60 uppercase tracking-wider mt-6 max-w-xl">Curated selections for the conscious collector.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20">
          <div className="bg-white rounded-2xl p-12 border border-ink/5">
            <h3 className="text-2xl font-display font-medium italic uppercase tracking-tight mb-4">Essential</h3>
            <p className="text-sm font-medium text-ink/50">Core pieces for everyday expression.</p>
          </div>
          <div className="bg-white rounded-2xl p-12 border border-ink/5">
            <h3 className="text-2xl font-display font-medium italic uppercase tracking-tight mb-4">Limited</h3>
            <p className="text-sm font-medium text-ink/50">Exclusive drops in limited quantities.</p>
          </div>
          <div className="bg-white rounded-2xl p-12 border border-ink/5">
            <h3 className="text-2xl font-display font-medium italic uppercase tracking-tight mb-4">Archive</h3>
            <p className="text-sm font-medium text-ink/50">Heritage pieces from previous seasons.</p>
          </div>
        </div>
      </div>
    </main>
  );
}