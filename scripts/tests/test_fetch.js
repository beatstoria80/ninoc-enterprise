async function check() {
  const res = await fetch('https://esiapizmdpylhotojfij.supabase.co/rest/v1/products?slug=eq.be-down-in-spirit', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDUzNjUsImV4cCI6MjA5MzY4MTM2NX0.l0DA-qSI3kc59FX7Lqoz_3VMK_ARefgG-lf8VYrLmwg',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDUzNjUsImV4cCI6MjA5MzY4MTM2NX0.l0DA-qSI3kc59FX7Lqoz_3VMK_ARefgG-lf8VYrLmwg',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ name: 'Kaos Oversize Pria & Wanita "BE DOWN IN SPIRIT" Graphic Tee | NINOC' })
  });
  const data = await res.json();
  console.log('Update result:', data);
}

check();
