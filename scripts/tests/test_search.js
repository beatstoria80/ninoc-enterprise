require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSearch(query) {
  const queryClean = query.trim();
  const queryFlexible = queryClean.replace(/\s+/g, '%');
  const queryNoSpace = queryClean.replace(/\s+/g, '');
  const searchCondition = `name.ilike.%${queryClean}%,name.ilike.%${queryFlexible}%,name.ilike.%${queryNoSpace}%`;
  
  console.log("Condition:", searchCondition);
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(searchCondition)
    .limit(10);
    
  if (error) console.error(error);
  console.log(`Results for '${query}':`, data ? data.map(p => p.name) : []);
}

async function run() {
  await testSearch("Over Size");
  await testSearch("kaos oversize");
}
run();
