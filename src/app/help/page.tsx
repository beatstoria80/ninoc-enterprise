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

import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Cache for 1 hour

export default async function HelpPage() {
  const keys = [
    'help_guide_customer_care',
    'help_guide_payment',
    'help_guide_return',
    'help_guide_shipping',
    'help_guide_how_to_order',
    'help_guide_how_to_track',
    'help_guide_terms',
    'help_guide_privacy',
  ];

  const { data } = await supabase
    .from('atelier_settings')
    .select('key, value')
    .in('key', keys);

  const initialSettings = data || [];

  return <HelpClient initialSettings={initialSettings} />;
}
