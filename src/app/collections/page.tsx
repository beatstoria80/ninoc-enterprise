import { Metadata } from 'next';
import CollectionsClient from './CollectionsClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export const metadata: Metadata = {
  title: 'Collections — Premium Archival Garment Studio',
  description: 'Jelajahi koleksi apparel premium NINOC — Staples, Limited Drop, dan Throwback. Archival garment studio dari Indonesia dengan desain industrial minimalist.',
  openGraph: {
    title: 'Collections | NINOC STORE',
    description: 'Koleksi apparel premium — Staples, Limited Drop, dan Throwback.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/collections`,
  },
};

export default function CollectionsPage() {
  return <CollectionsClient />;
}