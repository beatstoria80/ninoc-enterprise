import Link from '@/components/LocalizedLink';
import { Metadata } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');

export const metadata: Metadata = {
  title: '404 — Halaman Tidak Ditemukan',
  description: 'Halaman yang Anda cari tidak ditemukan. Kembali ke katalog utama NINOC STORE.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cr noise flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Code */}
        <div className="mb-6">
          <span className="text-[80px] md:text-[120px] font-display font-medium italic text-ink/5 leading-none block">404</span>
          <div className="-mt-4 md:-mt-6 border-t border-ink/10 pt-3">
            <p className="text-xs md:text-[9px] font-medium uppercase tracking-[0.4em] text-rose">ERROR — PAGE NOT FOUND</p>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 mb-10">
          <h1 className="text-xl md:text-2xl font-display font-medium italic uppercase tracking-tight text-ink">
            Archive Not Found
          </h1>
          <p className="text-xs md:text-[10px] md:text-[11px] font-medium text-ink/50 leading-relaxed max-w-xs mx-auto">
            Halaman yang Anda cari tidak tersedia di katalog ini. Mungkin sudah dipindahkan atau tidak pernah ada.
</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 bg-rose text-white text-xs md:text-[9px] font-semibold uppercase tracking-widest hover:bg-rose/90 transition-colors"
          >
            Kembali ke Katalog
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 border border-ink/10 text-ink/50 text-xs md:text-[9px] font-semibold uppercase tracking-widest hover:border-ink/20 hover:text-ink transition-colors"
          >
            Lihat Produk
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] text-ink/20">
          NINOC STORE — Premium Archival Garment Studio
        </p>
      </div>
    </div>
  );
}
