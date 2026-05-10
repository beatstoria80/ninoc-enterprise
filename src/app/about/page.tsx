export default function About() {
  return (
    <main className="min-h-screen bg-cr noise pt-32 px-6 md:px-12">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-16">
          <span className="text-[10px] font-medium uppercase tracking-[0.5em] text-rose">NINOC</span>
          <h1 className="text-6xl md:text-8xl font-display font-medium italic tracking-tighter text-ink uppercase mt-4">About</h1>
          <p className="text-sm font-medium text-ink/60 uppercase tracking-wider mt-6 max-w-xl">Born in Bandung. Made for the world.</p>
        </div>

        <div className="py-20 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Our Story</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">
                NINOC was founded with a simple vision: create clothing that speaks to the soul.
                Based in Bandung, Indonesia, we blend local craftsmanship with global aesthetics.
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Philosophy</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">
                "Wear the art, own the day." Every piece is a canvas. Every wearer is an artist.
              </p>
            </div>
          </div>
          <div className="h-96 bg-white rounded-2xl border border-ink/5" />
        </div>

        <div className="py-20 border-t border-ink/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Est.</p>
              <p className="text-4xl font-display font-medium italic">2024</p>
            </div>
            <div className="space-y-4">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Location</p>
              <p className="text-4xl font-display font-medium italic">Bandung, ID</p>
            </div>
            <div className="space-y-4">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Contact</p>
              <p className="text-lg font-display font-medium italic">hello@ninoc.art</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}