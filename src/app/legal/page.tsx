import { Metadata } from 'next';
import LegalClient from './LegalClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Legal',
  description: 'Syarat dan Ketentuan serta Kebijakan Privasi NINOC STORE. Baca ketentuan penggunaan sebelum bertransaksi.',
  openGraph: {
    title: 'Legal | NINOC STORE',
    description: 'Syarat & Ketentuan dan Kebijakan Privasi NINOC STORE.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/legal`,
  },
};

export default function LegalPage() {
  return <LegalClient />;
}
