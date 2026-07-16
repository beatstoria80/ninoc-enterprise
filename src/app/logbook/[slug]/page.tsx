import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LogbookDetailClient from './LogbookDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase')
  ? process.env.NEXT_PUBLIC_APP_URL
  : 'https://ninoc.store';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const { data: entry } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!entry) {
    return {
      title: 'Logbook Entry Not Found — NINOC',
    };
  }

  const title = entry.title || 'Logbook Studio';
  const description = entry.excerpt || 'Archival Garment Studio & Process Notes';

  return {
    title: `${title} | NINOC Logbook Studio`,
    description,
    openGraph: {
      title: `${title} | NINOC Logbook Studio`,
      description,
      type: 'article',
      url: `${BASE_URL}/logbook/${slug}`,
      images: entry.image_url ? [{ url: `${BASE_URL}${entry.image_url}` }] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/logbook/${slug}`,
    },
  };
}

export default async function LogbookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const { data: entry } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!entry) {
    notFound();
  }

  // Fetch adjacent entries for navigation
  const { data: allEntries } = await supabase
    .from('logbook_entries')
    .select('entry_id, title, title_en, slug')
    .order('entry_id', { ascending: false });

  const currentIndex = (allEntries || []).findIndex(e => e.slug === slug);
  const prevEntry = currentIndex > 0 ? (allEntries || [])[currentIndex - 1] : null;
  const nextEntry = currentIndex >= 0 && currentIndex < (allEntries || []).length - 1 ? (allEntries || [])[currentIndex + 1] : null;

  const formattedEntry = {
    id: entry.entry_id,
    date: entry.published_date ? entry.published_date.replace(/-/g, '.') : '',
    category: entry.category || 'MANIFESTO',
    title: entry.title || '',
    title_en: entry.title_en || '',
    excerpt: entry.excerpt || '',
    excerpt_en: entry.excerpt_en || '',
    content: entry.content || '',
    content_en: entry.content_en || '',
    image_url: entry.image_url || '',
    slug: entry.slug || '',
  };

  return (
    <LogbookDetailClient
      entry={formattedEntry}
      prevEntry={prevEntry ? { id: prevEntry.entry_id, title: prevEntry.title, title_en: prevEntry.title_en, slug: prevEntry.slug } : null}
      nextEntry={nextEntry ? { id: nextEntry.entry_id, title: nextEntry.title, title_en: nextEntry.title_en, slug: nextEntry.slug } : null}
    />
  );
}
