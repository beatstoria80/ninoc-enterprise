const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function cleanCategories() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching all categories...');
  const { data: categories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (fetchError) {
    console.error('Error fetching categories:', fetchError);
    return;
  }

  console.log('Current categories:', categories.map(c => c.slug).join(', '));

  const slugsToDelete = ['pakaian-unisex', 'accessories'];

  for (const slug of slugsToDelete) {
    const cat = categories.find(c => c.slug === slug);
    if (cat) {
      console.log(`Deleting category: ${cat.name} (${cat.slug}) [ID: ${cat.id}]...`);
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', cat.id);
      
      if (deleteError) {
        console.error(`Failed to delete ${slug}:`, deleteError);
      } else {
        console.log(`✅ Successfully deleted ${slug}`);
      }
    } else {
      console.log(`Category '${slug}' not found in database. Skipping.`);
    }
  }

  console.log('Cleanup complete.');
}

cleanCategories();
