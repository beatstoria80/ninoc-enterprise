import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LogbookDetailClient from './LogbookDetailClient';

function getBaseUrl() {
  let url = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
  if (url.includes('supabase')) url = 'https://ninoc.store';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

const BASE_URL = getBaseUrl();

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

  // Fetch adjacent entries for navigation (ordered entry_id DESC: L-013, L-012, L-011...)
  const { data: allEntries } = await supabase
    .from('logbook_entries')
    .select('entry_id, title, title_en, slug')
    .order('entry_id', { ascending: false });

  const currentIndex = (allEntries || []).findIndex(e => e.slug === slug);
  // Chronologically newer entry has a smaller array index (e.g., index 0 when current is index 1)
  const newerEntry = currentIndex > 0 ? (allEntries || [])[currentIndex - 1] : null;
  // Chronologically older entry has a larger array index (e.g., index 2 when current is index 1)
  const olderEntry = currentIndex >= 0 && currentIndex < (allEntries || []).length - 1 ? (allEntries || [])[currentIndex + 1] : null;

  const formattedEntry = {
    id: entry.entry_id,
    date: entry.published_date ? String(entry.published_date).replace(/-/g, '.') : '',
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

  // Structured Data — Article & Breadcrumb for Generative Engine Optimization (GEO)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/logbook/${slug}`,
    },
    headline: entry.title_en || entry.title,
    description: entry.excerpt_en || entry.excerpt,
    image: entry.image_url ? [`${BASE_URL}${entry.image_url}`] : [`${BASE_URL}/og-image.png`],
    datePublished: entry.published_date || entry.created_at,
    dateModified: entry.updated_at || entry.published_date || entry.created_at,
    author: {
      '@type': 'Organization',
      name: 'NINOC Design & Garment Studio',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'NINOC',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    inLanguage: ['en', 'id'],
    about: [
      'Independent Indonesian Apparel Brands',
      'Minimalist Urban Fashion',
      'Archival Garment Studio',
      'Contemporary Indonesian Design Studios',
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Logbook Studio', item: `${BASE_URL}/logbook` },
      { '@type': 'ListItem', position: 3, name: entry.title_en || entry.title, item: `${BASE_URL}/logbook/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LogbookDetailClient
        entry={formattedEntry}
        newerEntry={newerEntry ? { id: newerEntry.entry_id, title: newerEntry.title, title_en: newerEntry.title_en, slug: newerEntry.slug } : null}
        olderEntry={olderEntry ? { id: olderEntry.entry_id, title: olderEntry.title, title_en: olderEntry.title_en, slug: olderEntry.slug } : null}
      />
    </>
  );
}
