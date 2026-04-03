// ============================================================
// supabase.js - Supabase Client Initialization
// Nishchay Academy
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://rvqiynxnljemghueollu.supabase.co';
// FIX BUG #1: The key provided was in an invalid format.
// Supabase anon keys are JWTs starting with "eyJ".
// The user MUST replace this placeholder with their real anon key from:
// Supabase Dashboard → Settings → API → anon/public key
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.REPLACE_WITH_YOUR_REAL_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
