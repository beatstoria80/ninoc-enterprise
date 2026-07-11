import React from 'react';
import { supabase } from '@/lib/supabase';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';
import HomeClientWrapper from './_components/home/HomeClientWrapper';

// Server Component (Data Fetching only)
export default async function Home(props: { searchParams?: Promise<any>, params?: Promise<any> }) {
  // Wait for headers to be available if needed for locale
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const locale = headersList.get('x-next-locale') === 'EN' ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(locale as Locale);

  // Server-side data fetching
  let products = [];
  try {
    const { data } = await supabase.from('products').select('*, variants(*)').limit(8);
    products = data || [];
  } catch (error) {
    console.error('Failed to fetch products on server:', error);
  }

  return <HomeClientWrapper products={products} dict={dict} />;
}
