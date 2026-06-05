const { chromium } = require('playwright');

async function getSessionToken(email) {
  // Use service role key to impersonate user via admin API
  const response = await fetch('https://esiapizmdpylhotojfij.supabase.co/auth/v1/admin/users', {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IklXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTM2NSwiZXhwIjoyMDkzNjgxMzY1fQ.h5xqrEfnLK0BGRHKgOUwy3MAshvpBuC8HjNI080Iuk4',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IklXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTM2NSwiZXhwIjoyMDkzNjgxMzY1fQ.h5xqrEfnLK0BGRHKgOUwy3MAshvpBuC8HjNI080Iuk4',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  const users = data.users || [];
  console.log(`Found ${users.length} users in auth.users`);
  return users;
}

async function main() {
  const users = await getSessionToken();
  console.log('Users:', users.map(u => u.email));
}

main().catch(console.error);