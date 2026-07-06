import { Metadata } from 'next';
import AboutClient from './AboutClient';
import { getDictionary } from '@/lib/i18n-server';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: `${dict.about.title} — Multidimensional Creative House & Lifestyle Ecosystem`,
    description: dict.about.story.body,
    openGraph: {
      title: `${dict.about.title} | NINOC ENTERPRISE`,
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
