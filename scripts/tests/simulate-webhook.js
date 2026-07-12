require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

async function fetchSupabase(endpoint, method = 'GET', body = null) {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API Error: ${response.status} - ${errorText}`);
  }
  return response.status === 204 ? null : await response.json();
}

async function simulateWebhook() {
  console.log("Mencari pesanan terbaru (Pending)...");
  
  try {
    // Cari order terbaru
    const orders = await fetchSupabase('orders?select=id,status,payment_status&order=created_at.desc&limit=1');
    if (!orders || orders.length === 0) {
      console.log("Belum ada pesanan di database.");
      return;
    }

    const orderId = orders[0].id;
    console.log(`Ditemukan pesanan terbaru: ${orderId}`);
    
    if (orders[0].status === 'paid') {
      console.log("Pesanan sudah berstatus PAID.");
      return;
    }

    // Update status menjadi paid
    console.log("Mensimulasikan Webhook Midtrans (Success)...");
    await fetchSupabase(`orders?id=eq.${orderId}`, 'PATCH', {
      status: 'paid',
      payment_status: 'success'
    });

    console.log(`✅ Pesanan ${orderId} berhasil diupdate menjadi PAID/SUCCESS!`);
    console.log("Silakan cek tab Logistics di Admin Dashboard, pesanan akan muncul di antrean 'Siap Dikirim'.");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

simulateWebhook();
