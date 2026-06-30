import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ProfileClient, { UserProfile, Order } from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    redirect('/login');
  }

  // Fetch structured profile from DB
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .single();

  if (!profile || !profile.is_verified) {
    redirect('/onboarding');
  }

  const deterministicCustomerNumber = 'NNC-' + authUser.id.split('-')[0].toUpperCase();

  const user: UserProfile = {
    id: authUser.id,
    email: authUser.email || '',
    full_name: profile.full_name || authUser.user_metadata?.full_name || 'NINOC Member',
    avatar_url: profile.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
    created_at: profile.created_at || authUser.created_at,
    customer_number: deterministicCustomerNumber,
  };

  // Fetch Orders
  const { data: ordersData } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false });

  const orders: Order[] = ordersData || [];

  return <ProfileClient initialUser={user} initialOrders={orders} />;
}
