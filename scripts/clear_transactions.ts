import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTransactions() {
  console.log("⚠️ MENGHAPUS SEMUA DATA TRANSAKSI LAMA (SANDBOX) ⚠️\n");

  const tables = [
    'customer_activity_log',
    'retur_requests',
    'order_items',
    'supplier_ledgers',
    'affiliate_commissions',
    'finance_ledgers',
    'orders'
  ];

  for (const table of tables) {
    console.log(`Menghapus data di tabel: ${table}...`);
    // Delete all rows by using a dummy filter that matches everything
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // ID that doesn't exist to delete all

    if (error) {
      console.error(`❌ Gagal menghapus tabel ${table}:`, error.message);
    } else {
      console.log(`✅ Tabel ${table} bersih.`);
    }
  }

  console.log("\n🎉 Proses pembersihan data transaksi selesai! Sistem sekarang dalam keadaan bersih untuk testing baru.");
}

clearTransactions();
