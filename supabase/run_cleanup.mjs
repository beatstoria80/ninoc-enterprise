/**
 * Production Database Cleanup Script
 * Executes cleanup operations against Supabase using the service role key.
 * Run with: node supabase/run_cleanup.mjs
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
    // Match all rows - use a universally true condition
    query = query.gte('created_at', '1900-01-01T00:00:00Z');
  }
  const { error, count } = await query;
  if (error) {
    // Try alternative delete strategy if created_at doesn't exist
    if (error.message?.includes('created_at')) {
      console.log(`    ↳ Retrying with alternative filter for ${table}...`);
      const { error: err2 } = await supabase.from(table).delete().not('id', 'is', null);
      if (err2) {
        console.error(`    ❌ Failed: ${err2.message}`);
        return false;
      }
    } else {
      console.error(`    ❌ Failed: ${error.message}`);
      return false;
    }
  }
  console.log(`    ✅ ${table} cleared`);
  return true;
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 NINOC Enterprise — Production Database Cleanup');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Target: ${SUPABASE_URL}`);
  console.log(`  Time:   ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Step 1: Clear tracking/shipping logs
  console.log('[1/10] Clearing tracking & shipping logs...');
  await deleteAll('tracking_logs');

  // Step 2: Clear WhatsApp send logs  
  console.log('[2/10] Clearing WhatsApp send logs...');
  await deleteAll('wa_send_log');

  // Step 3: Clear finance ledgers
  console.log('[3/10] Clearing finance ledgers...');
  await deleteAll('finance_ledgers');

  // Step 4: Clear supplier ledgers
  console.log('[4/10] Clearing supplier ledgers...');
  await deleteAll('supplier_ledgers');

  // Step 5: Clear affiliate commissions
  console.log('[5/10] Clearing affiliate commissions...');
  await deleteAll('affiliate_commissions');

  // Step 6: Clear order items (before orders due to FK)
  console.log('[6/10] Clearing order items...');
  await deleteAll('order_items');

  // Step 7: Clear inventory locks
  console.log('[7/10] Clearing inventory locks...');
  await deleteAll('inventory_locks');

  // Step 8: Clear order-related notifications
  console.log('[8/10] Clearing order notifications...');
  await deleteAll('user_notifications', (q) => q.like('action_link', '/profile/orders/%'));

  // Step 9: Clear orders (main table)
  console.log('[9/10] Clearing orders...');
  await deleteAll('orders');

  // Step 10: Clear order_transactions if exists
  console.log('[9.5/10] Clearing order_transactions...');
  await deleteAll('order_transactions');

  // Step 10: Reset negative stock on products
  console.log('[10/10] Resetting negative stock to 0...');
  
  // Fetch products with negative or null stock
  const { data: negativeStockProducts, error: fetchErr } = await supabase
    .from('products')
    .select('id, stock_quantity, variants')
    .or('stock_quantity.lt.0,stock_quantity.is.null');

  if (fetchErr) {
    console.error(`    ❌ Failed to fetch products: ${fetchErr.message}`);
  } else if (negativeStockProducts && negativeStockProducts.length > 0) {
    console.log(`    Found ${negativeStockProducts.length} products with negative/null stock`);
    
    for (const product of negativeStockProducts) {
      const updates = {};
      
      // Fix main stock_quantity
      if (product.stock_quantity == null || product.stock_quantity < 0) {
        updates.stock_quantity = 0;
      }
      
      // Fix variant stock_quantity in JSONB array
      if (Array.isArray(product.variants)) {
        let variantsChanged = false;
        const fixedVariants = product.variants.map((v) => {
          if (v && v.stock_quantity != null && v.stock_quantity < 0) {
            variantsChanged = true;
            return { ...v, stock_quantity: 0 };
          }
          return v;
        });
        if (variantsChanged) {
          updates.variants = fixedVariants;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id);
        
        if (updateErr) {
          console.error(`    ❌ Failed to update product ${product.id}: ${updateErr.message}`);
        }
      }
    }
    console.log(`    ✅ Stock reset complete`);
  } else {
    console.log(`    ✅ No products with negative stock found`);
  }

  // Also check ALL products for negative variant stock (even if main stock is fine)
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, variants')
    .not('variants', 'is', null);

  if (allProducts) {
    let variantFixCount = 0;
    for (const product of allProducts) {
      if (!Array.isArray(product.variants)) continue;
      let changed = false;
      const fixed = product.variants.map((v) => {
        if (v && v.stock_quantity != null && v.stock_quantity < 0) {
          changed = true;
          return { ...v, stock_quantity: 0 };
        }
        return v;
      });
      if (changed) {
        await supabase.from('products').update({ variants: fixed }).eq('id', product.id);
        variantFixCount++;
      }
    }
    if (variantFixCount > 0) {
      console.log(`    ✅ Fixed negative variant stock on ${variantFixCount} products`);
    }
  }

  // Clear retur_requests if exists
  console.log('[Bonus] Clearing retur_requests...');
  await deleteAll('retur_requests');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ DATABASE CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Verification: Count remaining records
  console.log('📊 Verification:');
  for (const table of ['orders', 'order_items', 'tracking_logs', 'inventory_locks', 'products']) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`    ${table}: ${count} rows`);
    }
  }
  console.log('');
}

main().catch(console.error);
