import { createClient } from '@supabase/supabase-js';

// This client uses the superuser key and should ONLY be used in server-side code (API routes, server actions).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'sphoorthi_kutumbam'
  }
});
