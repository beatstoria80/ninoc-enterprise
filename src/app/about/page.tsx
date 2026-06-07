import { Metadata } from 'next';
import AboutClient from './AboutClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export const metadata: Metadata = {
  title: 'Tentang Kami — Premium Archival Garment Studio',
  description: 'NINOC didirikan dengan visi sederhana: menciptakan pakaian yang berbicara kepada jiwa. Bermarkas di Bandung, Indonesia, kami memadukan keahlian lokal dengan estetika global.',
  openGraph: {
    title: 'Tentang Kami | NINOC STORE',
    description: 'NINOC — Premium Archival Garment Studio dari Indonesia. Born in Bandung. Made for the world.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
