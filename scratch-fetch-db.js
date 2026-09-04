const url = 'https://esiapizmdpylhotojfij.supabase.co/rest/v1/products?select=id,name';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTM2NSwiZXhwIjoyMDkzNjgxMzY1fQ.h5xqrEfnLK0BGRHKgOUwy3MAshvpBuC8HjNI080Iuk4';

fetch(url, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
})
.then(r => r.json())
.then(data => console.log(`Length: ${data.length}`, data.slice(0, 2)))
.catch(console.error);
