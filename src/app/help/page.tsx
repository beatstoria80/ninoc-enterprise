import { Metadata } from 'next';
import HelpClient from './HelpClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export const metadata: Metadata = {
  title: 'Help Guide — FAQ& Customer Care',
  description: 'Panduan lengkap NINOC STORE — cara pesan, pembayaran, pengiriman, lacak pesanan, dan kebijakan retur. Hubungi customer care via WhatsApp.',
  openGraph: {
    title: 'Help Guide | NINOC STORE',
    description: 'Panduan lengkap cara belanja di NINOC STORE. Payment, shipping, tracking, dan retur.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/help`,
  },
};

export default function HelpPage() {
  return <HelpClient />;
}
