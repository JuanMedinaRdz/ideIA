// Supabase client for Client Components (browser).
// Use this in any "use client" file that needs to read/write Supabase.
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(env.supabase.url, env.supabase.anonKey);
}
