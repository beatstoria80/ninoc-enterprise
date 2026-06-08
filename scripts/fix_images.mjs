// Direct REST API calls - no SDK dependency
const supabaseUrl = 'https://esiapizmdpylhotojfij.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTM2NSwiZXhwIjoyMDkzNjgxMzY1fQ.h5xqrEfnLK0BGRHKgOUwy3MAshvpBuC8HjNI080Iuk4';

const headers = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
};

async function main() {
  // 1. List files in storage bucket
  console.log('=== FILES IN STORAGE BUCKET "products" ===');
  const filesRes = await fetch(`${supabaseUrl}/storage/v1/object/list/products`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 500, offset: 0, sortBy: { column: 'name', order: 'asc' } })
  });
  const files = await filesRes.json();
  const storageFiles = files.map(f => f.name);
  console.log(`Found ${storageFiles.length} files:`);
  storageFiles.forEach(f => console.log(`  📁 ${f}`));

  // 2. Get products from DB
  console.log('\n=== PRODUCTS IN DATABASE ===');
  const prodRes = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,slug,image_url,perspective1,perspective2,perspective3,perspective4`, {
    headers: { ...headers, 'Accept': 'application/json' }
  });
  const products = await prodRes.json();

  const bucketBase = `${supabaseUrl}/storage/v1/object/public/products/`;
  const broken = [];

  for (const p of products) {
    const imageFields = ['image_url', 'perspective1', 'perspective2', 'perspective3', 'perspective4'];
    const issues = [];

    for (const field of imageFields) {
      const url = p[field];
      if (!url) continue;

      if (url.startsWith(bucketBase)) {
        const filename = decodeURIComponent(url.replace(bucketBase, ''));
        if (!storageFiles.includes(filename)) {
          issues.push({ field, url, filename, status: 'NOT_IN_STORAGE' });
        }
      } else if (url.includes('supabase.co')) {
        // Other supabase URL format
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (!res.ok) issues.push({ field, url, status: `HTTP_${res.status}` });
        } catch { issues.push({ field, url, status: 'UNREACHABLE' }); }
      }
    }

    if (issues.length > 0) {
      console.log(`\n❌ ${p.name} (${p.slug}) [id: ${p.id}]`);
      for (const issue of issues) {
        console.log(`   ${issue.field}: ${issue.status}`);
        console.log(`     URL: ${issue.url}`);
        if (issue.filename) console.log(`     Expected file: ${issue.filename}`);
      }
      broken.push({ product: p, issues });
    } else {
      console.log(`✅ ${p.name} (${p.slug})`);
    }
  }

  // 3. Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total products: ${products.length}`);
  console.log(`Products with broken images: ${broken.length}`);
  
  if (broken.length > 0) {
    console.log('\n=== SUGGESTED FIX ===');
    console.log('Storage files available to use:');
    storageFiles.forEach(f => console.log(`  ${bucketBase}${f}`));
  }
}

main().catch(console.error);
