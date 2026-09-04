const { createClient } = require('@supabase/supabase-js');

async function testWrongKey() {
  const url = 'https://esiapizmdpylhotojfij.supabase.co';
  // Deliberately wrong key
  const wrongKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTM2NSwiZXhwIjoyMDkzNjgxMzY1fQ.wrong_signature_123';
  
  const supabase = createClient(url, wrongKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (u, options) => fetch(u, { ...options, cache: 'no-store' }) }
  });

  const { data, error } = await supabase.from('products').select('*');
  console.log('DATA:', data);
  console.log('ERROR:', error);
}

testWrongKey();
