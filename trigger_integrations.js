require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase Error ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function main() {
  console.log('Running integrations for paid orders...');
  try {
    // Fetch orders
    const orders = await fetchSupabase('orders?status=eq.paid&select=id,affiliate_id');
    console.log(`Found ${orders.length} paid orders.`);

    for (const order of orders) {
      // Fetch order items
      const items = await fetchSupabase(`order_items?order_id=eq.${order.id}&select=id,supplier_id,supplier_hpp,price_at_purchase,quantity`);
      
      // Supplier Ledgers
      const ledgerEntries = items
        .filter(item => item.supplier_id && item.supplier_hpp > 0)
        .map(item => ({
          supplier_id: item.supplier_id,
          order_id: order.id,
          order_item_id: item.id,
          hpp_amount: item.supplier_hpp,
          status: 'pending'
        }));
      
      if (ledgerEntries.length > 0) {
        const existing = await fetchSupabase(`supplier_ledgers?order_id=eq.${order.id}&select=id`);
        if (existing.length === 0) {
          await fetchSupabase('supplier_ledgers', { method: 'POST', body: JSON.stringify(ledgerEntries) });
          console.log(`- Created ${ledgerEntries.length} supplier ledgers for order ${order.id}`);
        }
      }

      // Affiliate
      if (order.affiliate_id) {
        const existingComm = await fetchSupabase(`affiliate_commissions?order_id=eq.${order.id}&select=id`);
        if (existingComm.length === 0) {
          const affiliates = await fetchSupabase(`affiliates?id=eq.${order.affiliate_id}&select=commission_rate`);
          if (affiliates.length > 0) {
            const affiliate = affiliates[0];
            let eligibleTotal = 0;
            for (const item of items) {
              eligibleTotal += (Number(item.price_at_purchase) * Number(item.quantity));
            }
            if (eligibleTotal > 0) {
              const amount = (eligibleTotal * Number(affiliate.commission_rate)) / 100;
              await fetchSupabase('affiliate_commissions', { 
                method: 'POST', 
                body: JSON.stringify({
                  affiliate_id: order.affiliate_id,
                  order_id: order.id,
                  amount: amount,
                  status: 'pending'
                }) 
              });
              console.log(`- Created affiliate commission (Rp ${amount}) for order ${order.id}`);
            }
          }
        }
      }
    }
    console.log('Integration sync complete!');
  } catch (error) {
    console.error('Script failed:', error);
  }
}
main();
