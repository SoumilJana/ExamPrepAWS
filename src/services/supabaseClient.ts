import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kopgpdoobvhlpkswqbhy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvcGdwZG9vYnZobHBrc3dxYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMTUxNTQsImV4cCI6MjEwOTc5MTE1NH0.hRsnNVZGSNzc3eihfgjsogTEvls_cSvr_esO0Wd_kyQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
