import { Metadata } from 'next';
import LogbookClient from './LogbookClient';
import { getDictionary } from '@/lib/i18n-server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: `${dict.logbook.title} — Premium Archival Garment Studio`,
    description: dict.logbook.subtitle,
    openGraph: {
      title: `${dict.logbook.title} | NINOC STORE`,
      description: dict.logbook.subtitle,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/logbook`,
    },
  };
}

import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function LogbookPage() {
  const { data } = await supabase
    .from('logbook_entries')
    .select('*')
    .order('published_date', { ascending: false });

  let formattedEntries = [];
  if (data) {
    formattedEntries = data.map((item: any) => ({
      id: item.entry_id, 
      date: item.published_date ? item.published_date.replace(/-/g, '.') : '', 
      category: item.category || '', 
      title: item.title || '', 
      title_en: item.title_en || '', 
      excerpt: item.excerpt || '', 
      excerpt_en: item.excerpt_en || '', 
      slug: item.slug || ''
    }));
  }

  return <LogbookClient initialEntries={formattedEntries} />;
}
