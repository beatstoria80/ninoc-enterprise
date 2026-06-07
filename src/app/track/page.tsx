import { Metadata } from 'next';
import TrackClient from './TrackClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export const metadata: Metadata = {
  title: 'Lacak Pesanan — Track Order',
  description: 'Lacak status pesanan NINOC STORE tanpa perlu login. Masukkan nomor pesanan dan nomor WhatsApp untuk melihat status pengiriman.',
  openGraph: {
    title: 'Lacak Pesanan | NINOC STORE',
    description: 'Lacak status pesanan NINOC. Tanpa login — gratis dan cepat.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/track`,
  },
};

export default function TrackPage() {
  return <TrackClient />;
}
