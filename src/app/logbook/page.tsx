import { Metadata } from 'next';
import LogbookClient from './LogbookClient';
import { getDictionary } from '@/lib/i18n-server';

function getBaseUrl() {
  let url = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
  if (url.includes('supabase')) url = 'https://ninoc.store';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

const BASE_URL = getBaseUrl();

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
    .order('entry_id', { ascending: false });

  let formattedEntries: any[] = [];
  if (data) {
    formattedEntries = data.map((item: any) => ({
      id: item.entry_id, 
      date: item.published_date ? String(item.published_date).replace(/-/g, '.') : '', 
      category: item.category || '', 
      title: item.title || '', 
      title_en: item.title_en || '', 
      excerpt: item.excerpt || '', 
      excerpt_en: item.excerpt_en || '', 
      content: item.content || '',
      content_en: item.content_en || '',
      image_url: item.image_url || '',
      slug: item.slug || ''
    }));
  }

  return <LogbookClient initialEntries={formattedEntries} />;
}
