import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    redirect('/admin/login');
  }

  // 1. Safety bypass: If the email is the primary admin email, grant access immediately
  if (user.email === 'admin@ninoc.store') {
    const initialUser = {
      id: user.id,
      email: user.email,
      role: 'super_admin'
    };
    return <AdminClient initialUser={initialUser} />;
  }

  // 2. Query admin_roles for authorization
  const { data: roleData, error: roleError } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (roleError || !roleData) {
    // Unauthorized user, sign out and redirect
    await supabase.auth.signOut();
    redirect('/admin/login?error=unauthorized');
  }

  const initialUser = {
    id: user.id,
    email: user.email,
    role: roleData.role
  };

  return <AdminClient initialUser={initialUser} />;
}
