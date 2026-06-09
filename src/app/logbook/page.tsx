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

export default function LogbookPage() {
  return <LogbookClient />;
}
