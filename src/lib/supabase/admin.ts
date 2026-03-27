import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getServerEnv } from "./env";

export function createAdminSupabaseClient() {
  const env = getServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
