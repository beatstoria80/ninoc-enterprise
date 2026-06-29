import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import NotificationsClient from './NotificationsClient';

export const metadata = {
  title: 'Notifikasi — NINOC',
  description: 'Lihat semua pemberitahuan terkait pesanan, pembayaran, dan pengiriman Anda.',
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: notifications } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return <NotificationsClient notifications={notifications || []} />;
}
