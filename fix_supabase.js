require('dotenv').config({ path: 'frontend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data, error } = await supabase
    .from('queries_cache')
    .delete()
    .eq('query_text', 'html');
    
  console.log("Deleted html cache:", data, error);
}

fix();
