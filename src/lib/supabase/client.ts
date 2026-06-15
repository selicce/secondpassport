"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for client components (realtime, client-side auth UI).
 * Returns null in demo mode / when env is unset so callers can no-op gracefully.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}
