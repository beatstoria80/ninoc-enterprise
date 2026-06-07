import { Metadata } from 'next';
import LogbookClient from './LogbookClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export const metadata: Metadata = {
  title: 'Studio Logbook — Archival Records & Process',
  description: 'Logbook proses kreatif dan archival records NINOC STORE. Dokumentasi di balik layar pembuatan garment premium dari Bandung.',
  openGraph: {
    title: 'Studio Logbook | NINOC STORE',
    description: 'Archival records dan proses kreatif NINOC. Di balik layar garment studio.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/logbook`,
  },
};

export default function LogbookPage() {
  return <LogbookClient />;
}
