import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminClient from './AdminClient';
import { AdminProviders } from '@/providers/admin/AdminProviders';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    redirect('/login');
  }

  // 1. Safety bypass: If the email is the primary admin email, grant access immediately
  if (user.email?.toLowerCase() === 'admin@ninoc.store') {
    const initialUser = {
      id: user.id,
      email: user.email || '',
      role: 'super_admin'
    };
    return (
      <AdminProviders>
        <AdminClient initialUser={initialUser} />
      </AdminProviders>
    );
  }

  // 2. Query admin_roles for authorization
  const { data: roleData, error: roleError } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('email', user.email || '')
    .single();

  if (roleError || !roleData) {
    // Unauthorized user, sign out and redirect
    await supabase.auth.signOut();
    redirect('/login?error=unauthorized');
  }

  const initialUser = {
    id: user.id,
    email: user.email || '',
    role: roleData.role
  };

  return (
    <AdminProviders>
      <AdminClient initialUser={initialUser} />
    </AdminProviders>
  );
}
