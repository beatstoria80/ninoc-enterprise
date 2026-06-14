import { Metadata } from 'next';
import CategoryClient from './CategoryClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export const metadata: Metadata = {
  title: 'Category Index — Koleksi Lengkap',
  description: 'Jelajahi koleksi NINOC STORE berdasarkan kategori — Pakaian (Apparel), Utilities (Functional), dan Aksesoris. Filter produk dengan mudah.',
  openGraph: {
    title: 'Category Index | NINOC STORE',
    description: 'Filter produk berdasarkan kategori. Pakaian, Utilities, dan Aksesoris.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/category`,
  },
};

import { supabase } from '@/lib/supabase';

export const revalidate = 60; // Cache for 60 seconds

export default async function CategoryPage() {
  const { data } = await supabase.from('products').select('*');
  const products = data || [];

  return <CategoryClient initialProducts={products} />;
}
