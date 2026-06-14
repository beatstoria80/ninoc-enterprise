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

import { supabase } from '@/lib/supabase';

export const revalidate = 60; // Cache for 60 seconds

export default async function CollectionsPage() {
  const [prodRes, colRes] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('collections').select('*').eq('status', 'active')
  ]);
  
  const products = prodRes.data || [];
  const collections = colRes.data || [];

  return <CollectionsClient initialProducts={products} initialCollections={collections} />;
}