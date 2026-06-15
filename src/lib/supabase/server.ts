import "server-only";
import { cookies } from "next/headers";
import { createServerClient as createSSRClient, type CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client (cookie-bound, respects RLS as the signed-in user).
 * Used only when NEXT_PUBLIC_DEMO_MODE !== "true". In demo mode the data layer
 * never calls this.
 */
export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or run in demo mode.",
    );
  }

  // Next 16: cookies() is async.
  const cookieStore = await cookies();
  return createSSRClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes the session.
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS. Use ONLY in trusted server contexts
 * (admin/service operations, webhooks, audit writes). Never expose to the client.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for privileged operations.");
  }
  // Lazy import to avoid bundling the service key path into edge runtimes.
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
