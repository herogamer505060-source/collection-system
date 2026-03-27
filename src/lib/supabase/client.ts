import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { getPublicEnv } from "./env";

let browserClient:
  | ReturnType<typeof createBrowserClient<Database, "public">>
  | undefined;

export function createBrowserSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("Browser Supabase client can only be created in the browser.");
  }

  if (!browserClient) {
    const env = getPublicEnv();
    browserClient = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  return browserClient;
}
