const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixMissingSkus() {
  console.log('Searching for variants with missing SKUs...');
  
  // Fetch all variants that lack an SKU
  const { data: variants, error } = await supabase
    .from('variants')
    .select('id, sku, size, color, product_id, products(name, category)')
    .or('sku.is.null,sku.eq.');

  if (error) {
    console.error('Error fetching variants:', error);
    return;
  }

  if (!variants || variants.length === 0) {
    console.log('All variants already have SKUs! None missing.');
    return;
  }

  console.log(`Found ${variants.length} variants with missing SKUs.`);

  for (const v of variants) {
    const prodName = v.products?.name || 'PROD';
    const cat = v.products?.category || 'APP';
    const catCode = cat === 'celana' ? 'CLN' : cat === 'pakaian' ? 'KAS' : cat.substring(0, 3).toUpperCase();
    const baseName = prodName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
    
    let hash = 0;
    for (let i = 0; i < prodName.length; i++) {
      hash = prodName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const uniqueNum = Math.abs(hash % 900) + 100;
    const nameCode = `${baseName}${uniqueNum}`;
    
    const colorCode = (v.color || 'NON').substring(0, 3).toUpperCase();
    const sizeCode = (v.size || 'OS').toUpperCase();
    const generatedSku = `${catCode}-${nameCode}-${colorCode}-${sizeCode}`;

    console.log(`Updating variant ID ${v.id} (${prodName} - ${v.color} / ${v.size}) -> SKU: ${generatedSku}`);

    const { error: updateErr } = await supabase
      .from('variants')
      .update({ sku: generatedSku })
      .eq('id', v.id);

    if (updateErr) {
      console.error(`Failed to update ID ${v.id}:`, updateErr);
    } else {
      console.log(`Successfully updated ID ${v.id}!`);
    }
  }

  console.log('Finished fixing SKUs!');
}

fixMissingSkus();
