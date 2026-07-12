const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://esiapizmdpylhotojfij.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDUzNjUsImV4cCI6MjA5MzY4MTM2NX0.l0DA-qSI3kc59FX7Lqoz_3VMK_ARefgG-lf8VYrLmwg');

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log('Query result:', data);
  
  // Try to update the product name
  const { data: updateData, error: updateError } = await supabase
    .from('products')
    .update({ name: 'Kaos Oversize Pria & Wanita "BE DOWN IN SPIRIT" Graphic Tee | NINOC' })
    .eq('slug', 'be-down-in-spirit')
    .select();
    
  console.log('Update result:', updateData);
  if (updateError) console.error('Update error:', updateError);
}

check();
