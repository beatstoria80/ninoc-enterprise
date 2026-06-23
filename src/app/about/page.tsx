import { Metadata } from 'next';
import AboutClient from './AboutClient';
import { getDictionary } from '@/lib/i18n-server';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: `${dict.about.title} — Premium Archival Garment Studio`,
    description: dict.about.story.body,
    openGraph: {
      title: `${dict.about.title} | NINOC STORE`,
      description: dict.about.story.body,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/about`,
    },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
