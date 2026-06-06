import { Metadata } from 'next';
import { Suspense } from 'react';
import ShopClient from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop — Premium Archival Garment Studio',
  description: 'Jelajahi koleksi apparel premium NINOC — archival garment studio dari Indonesia. Desain industrial minimalist, bahan berkualitas tinggi.',
  openGraph: {
    title: 'Shop | NINOC STORE',
    description: 'Koleksi apparel premium dari NINOC — Premium Archival Garment Studio Indonesia.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://ninoc.store/shop',
  },
};

function LoadingShop() {
  return (
    <div className="min-h-screen bg-cr flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-rose/20 border-t-rose rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[10px] text-ink/30 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<LoadingShop />}>
      <ShopClient />
    </Suspense>
  );
}