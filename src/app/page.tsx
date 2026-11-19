import React from 'react';
import { supabase } from '@/lib/supabase';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';
import HomeClientWrapper, { HomeProduct } from './_components/home/HomeClientWrapper';

// REFACTOR: Revalidate every 60s matching /shop catalog ISR to propagate admin display_order changes dynamically
export const revalidate = 60;

// Server Component (Data Fetching only)
export const metadata = {
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store',
  },
};

// REFACTOR: Type-safe props interface without using 'any'
interface HomeProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home(_props: HomeProps) {
  // Wait for headers to be available if needed for locale
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const locale = headersList.get('x-next-locale') === 'EN' ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(locale as Locale);

  // REFACTOR: Server-side data fetching strictly ordered by display_order ASC, then created_at DESC
  // Fetch up to 24 products so wide screens and carousels give all products equal exposure opportunity
  let products: HomeProduct[] = [];
  try {
    const { data } = await supabase
      .from('products')
      .select('*, variants(*)')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(24);

    const rawList = (data as HomeProduct[]) || [];

    // REFACTOR: Deterministic tie-breaker in sync with /shop catalog ShopFilterSystem
    products = [...rawList].sort((a: HomeProduct, b: HomeProduct) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Failed to fetch products on server:', error);
  }

  return <HomeClientWrapper products={products} dict={dict} />;
}
