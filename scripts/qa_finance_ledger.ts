import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runQA() {
  console.log("🚀 Starting QA Automation for Finance Ledger...");

  try {
    // 1. Get current balance
    const { data: lastLedger } = await supabase
      .from('finance_ledgers')
      .select('balance')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentBalance = lastLedger ? Number(lastLedger.balance) : 0;
    console.log(`✅ Current balance: ${currentBalance}`);

    // 2. Insert test sales (+1000)
    console.log("📝 Inserting Test Sales (Debit 1000)...");
    const { data: salesInsert, error: salesErr } = await supabase
      .from('finance_ledgers')
      .insert({
        description: 'QA Test - Sales',
        type: 'sales',
        debit: 1000,
        credit: 0,
        reference_id: 'qa_test_sales_001'
      })
      .select()
      .single();

    if (salesErr) throw salesErr;

    // Verify trigger worked for sales
    if (Number(salesInsert.balance) !== currentBalance + 1000) {
      throw new Error(`Balance calculation failed on sales! Expected ${currentBalance + 1000}, got ${salesInsert.balance}`);
    }
    console.log(`✅ Sales inserted correctly. New Balance: ${salesInsert.balance}`);

    // 3. Insert test refund (-500)
    console.log("📝 Inserting Test Refund (Credit 500)...");
    const { data: refundInsert, error: refundErr } = await supabase
      .from('finance_ledgers')
      .insert({
        description: 'QA Test - Refund',
        type: 'refund',
        debit: 0,
        credit: 500,
        reference_id: 'qa_test_refund_001'
      })
      .select()
      .single();

    if (refundErr) throw refundErr;

    // Verify trigger worked for refund
    if (Number(refundInsert.balance) !== Number(salesInsert.balance) - 500) {
      throw new Error(`Balance calculation failed on refund! Expected ${Number(salesInsert.balance) - 500}, got ${refundInsert.balance}`);
    }
    console.log(`✅ Refund inserted correctly. New Balance: ${refundInsert.balance}`);

    // 4. Cleanup test data
    console.log("🧹 Cleaning up test data...");
    await supabase.from('finance_ledgers').delete().in('reference_id', ['qa_test_sales_001', 'qa_test_refund_001']);
    console.log("✅ Cleanup complete.");

    console.log("🎉 QA PASSED!");
  } catch (error) {
    console.error("❌ QA FAILED:", error);
    // Attempt cleanup on fail
    await supabase.from('finance_ledgers').delete().in('reference_id', ['qa_test_sales_001', 'qa_test_refund_001']);
    process.exit(1);
  }
}

runQA();
