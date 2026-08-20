import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminDebugPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  let adminRoleData = null;
  let adminRoleError = null;
  
  if (data?.user) {
    const { data: role, error: rError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('email', data.user.email)
      .maybeSingle();
    adminRoleData = role;
    adminRoleError = rError;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#000', color: '#0f0' }}>
      <h1>NINOC Admin Server Debug Page</h1>
      <hr />
      <h2>Auth User Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      
      <h2>Auth Error:</h2>
      <pre>{JSON.stringify(error, null, 2)}</pre>
      
      <h2>Admin Role Check:</h2>
      <pre>{JSON.stringify({ role: adminRoleData, error: adminRoleError }, null, 2)}</pre>
    </div>
  );
}
