import { createClient } from "@supabase/supabase-js";

// Server-side admin Supabase client with service key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default supabaseAdmin;