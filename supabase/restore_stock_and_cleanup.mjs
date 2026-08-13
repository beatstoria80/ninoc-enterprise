/**
 * Restore Stock & Production Database Cleanup Script
 * 1. Restores inventory stock deducted by test/fake orders.
 * 2. Cleans up all transaction, order, ledger, log, and notification data.
 * 
 * Run with: node -r dotenv/config supabase/restore_stock_and_cleanup.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY. Make sure .env.local is loaded.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function deleteAll(table, filter) {
  console.log(`  🗑️  Cleaning ${table}...`);
  let query = supabase.from(table).delete();
  if (filter) {
    query = filter(query);
  } else {
    query = query.gte('created_at', '1900-01-01T00:00:00Z');
  }
  const { error } = await query;
  if (error) {
    if (error.message?.includes('created_at')) {
      console.log(`    ↳ Retrying with alternative filter for ${table}...`);
      const { error: err2 } = await supabase.from(table).delete().not('id', 'is', null);
      if (err2) {
        console.error(`    ❌ Failed to delete from ${table}: ${err2.message}`);
        return false;
      }
    } else {
      console.error(`    ❌ Failed to delete from ${table}: ${error.message}`);
      return false;
    }
  }
  console.log(`    ✅ ${table} cleared`);
  return true;
}

async function restoreInventoryStock() {
  console.log('📦 Step 1: Restoring Inventory Stock from Order Items...');
  
  const { data: orderItems, error: fetchErr } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, variant_id, quantity, size, color, product_name');

  if (fetchErr) {
    console.error('❌ Error fetching order items for stock restoration:', fetchErr.message);
    return;
  }

  if (!orderItems || orderItems.length === 0) {
    console.log('ℹ️  No order items found to restore.');
    return;
  }

  console.log(`   Found ${orderItems.length} order items across pending/fake transactions.`);

  for (const item of orderItems) {
    const qty = Number(item.quantity) || 1;
    let variantRestored = false;

    // 1. Restore on variants table if variant_id exists
    if (item.variant_id) {
      const { data: vData } = await supabase
        .from('variants')
        .select('id, stock_quantity')
        .eq('id', item.variant_id)
        .single();

      if (vData) {
        const newQty = (vData.stock_quantity || 0) + qty;
        await supabase.from('variants').update({ stock_quantity: newQty }).eq('id', item.variant_id);
        console.log(`   └─ Restored +${qty} to variant table [${item.variant_id}] (${item.product_name} ${item.size || ''}): ${vData.stock_quantity} -> ${newQty}`);
        variantRestored = true;
      }
    }

    // 2. Fallback: match by product_id + size + color on variants table if not found by variant_id
    if (!variantRestored && item.product_id && item.size) {
      let q = supabase.from('variants').select('id, stock_quantity').eq('product_id', item.product_id);
      if (item.size) q = q.eq('size', item.size);
      if (item.color) q = q.eq('color', item.color);
      const { data: vMatch } = await q.maybeSingle();

      if (vMatch) {
        const newQty = (vMatch.stock_quantity || 0) + qty;
        await supabase.from('variants').update({ stock_quantity: newQty }).eq('id', vMatch.id);
        console.log(`   └─ Restored +${qty} to variant table by size/color [${vMatch.id}] (${item.product_name} ${item.size}): ${vMatch.stock_quantity} -> ${newQty}`);
        variantRestored = true;
      }
    }

    // 3. Restore on main products table if applicable
    if (item.product_id) {
      const { data: pData } = await supabase
        .from('products')
        .select('id, stock_quantity, variants')
        .eq('id', item.product_id)
        .single();

      if (pData) {
        const pUpdates = {};
        
        if (pData.stock_quantity != null) {
          pUpdates.stock_quantity = (pData.stock_quantity || 0) + qty;
        }

        // Sync JSONB variants array if stored inside products table
        if (Array.isArray(pData.variants) && pData.variants.length > 0) {
          const updatedJsonVariants = pData.variants.map((v) => {
            const matchesId = item.variant_id && v.id === item.variant_id;
            const matchesSizeColor = !item.variant_id && item.size && v.size === item.size && (!item.color || v.color === item.color);
            if (matchesId || matchesSizeColor) {
              return { ...v, stock_quantity: (v.stock_quantity || 0) + qty };
            }
            return v;
          });
          pUpdates.variants = updatedJsonVariants;
        }

        if (Object.keys(pUpdates).length > 0) {
          await supabase.from('products').update(pUpdates).eq('id', item.product_id);
          console.log(`   └─ Restored +${qty} to product table/JSONB [${item.product_id}] (${item.product_name})`);
        }
      }
    }
  }

  console.log('✅ Stock restoration complete!\n');
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 NINOC Enterprise — Restore Stock & Clean Fake Orders');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Target: ${SUPABASE_URL}`);
  console.log(`  Time:   ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 1. Restore Stock First
  await restoreInventoryStock();

  // 2. Clean fake orders and transaction data
  console.log('🧹 Step 2: Clearing Fake Transaction Data...');
  await deleteAll('tracking_logs');
  await deleteAll('wa_send_log');
  await deleteAll('finance_ledgers');
  await deleteAll('supplier_ledgers');
  await deleteAll('affiliate_commissions');
  await deleteAll('order_shipments');
  await deleteAll('order_items');
  await deleteAll('inventory_locks');
  await deleteAll('user_notifications', (q) => q.like('action_link', '/profile/orders/%'));
  await deleteAll('retur_requests');
  await deleteAll('orders');
  await deleteAll('order_transactions');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ STOCK RESTORED & FAKE TRANSACTION DATA CLEARED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Verification: Count remaining records
  console.log('📊 Verification Summary:');
  for (const table of ['orders', 'order_items', 'order_shipments', 'tracking_logs', 'inventory_locks', 'supplier_ledgers', 'finance_ledgers', 'retur_requests']) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`    ${table}: ${count} rows`);
    }
  }
  console.log('');
}

main().catch(console.error);
