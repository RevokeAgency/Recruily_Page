import { createClient } from "@supabase/supabase-js";

// Simple Supabase client setup exactly as requested
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabase;