// ============================================================
// supabase.js - Supabase Client Initialization
// Nishchay Academy
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://rvqiynxnljemghueollu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FW0zkZ_Z1Hfgy-0cFB8ZFA_1MLQbON3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
