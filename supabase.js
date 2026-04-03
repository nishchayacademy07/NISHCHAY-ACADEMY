// ============================================================
// supabase.js - Supabase Client Initialization
// Nishchay Academy
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// IMPORTANT: Replace this URL with your project's URL from settings -> API
const SUPABASE_URL = 'https://rvqiynxnljemghueollu.supabase.co';

// IMPORTANT: Replace this Key with your project's "anon" / "public" key
// It MUST start with "eyJ..." 
// You can find it in: Supabase Dashboard → Settings → API → anon/public key
const SUPABASE_KEY = 'REPLACE_WITH_YOUR_ANON_KEY'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Diagnostic Check: Verify Connection
export function isSupabaseConnected() {
    return SUPABASE_KEY !== 'REPLACE_WITH_YOUR_ANON_KEY' && SUPABASE_KEY.startsWith('eyJ');
}
