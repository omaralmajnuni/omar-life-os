import { supabase } from './lib/supabase'; async function check() { const { data, error } = await supabase.from('profiles').select('*').limit(1); console.log(Object.keys(data?.[0] || {})); } check();
