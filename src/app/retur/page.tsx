import { Metadata } from 'next';
import ReturClient from './ReturClient';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');

export const metadata: Metadata = {
  title: 'Retur & Refund — Return & Refund Policy',
  description: 'Ajukan retur atau refund di NINOC STORE. Klaim maksimal 2x24 jam setelah barang diterima. Bukti video 1-shot tanpa edit WAJIB.',
  openGraph: {
    title: 'Retur & Refund | NINOC STORE',
    description: 'Kebijakan retur dan refund NINOC STORE. Klaim 2x24 jam, bukti video 1-shot wajib.',
    type: 'website',
  },
  alternates: {
    canonical: `${BASE_URL}/retur`,
  },
};

export default function ReturPage() {
  return <ReturClient />;
}
