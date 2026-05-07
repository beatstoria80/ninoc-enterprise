import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://esiapizmdpylhotojfij.supabase.co';
const supabaseKey = 'sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK';

// Disable realtime to avoid JWT parsing issues if the SDK version is not fully updated for new keys
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    enabled: false
  }
});

async function test() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.error('Error from Supabase:', error.message);
      if (error.message.includes('404')) {
        console.log('Note: 404 usually means the table "products" does not exist yet.');
      }
    } else {
      console.log('Connection successful! Data:', data);
    }
  } catch (err: any) {
    console.error('Exception during test:', err.message);
  }
}

test();
