require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('Updating all pending orders to paid...');
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?status=eq.pending`;
  
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status: 'paid', payment_status: 'success' })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error updating orders:', res.status, errorText);
    } else {
      console.log('Success! All pending orders are now marked as paid.');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
main();
