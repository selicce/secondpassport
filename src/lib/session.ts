import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getUserById, isDemoMode } from "@/lib/data";
import { DEMO_DEFAULT_USER_ID } from "@/lib/data/fixtures";
import { createServerClient } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/data/mappers";
import type { UserProfile, Language } from "@/lib/types";
import { isStaff, type Role } from "@/lib/rbac";

export const DEMO_USER_COOKIE = "jrf_demo_user";

/**
 * Resolve the authenticated user.
 *
 * Demo mode: read the selected demo user id from a cookie (role switcher).
 * Production: read the Supabase session and join the profile row. See
 * src/lib/supabase/server.ts for the client; replace the demo branch below.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  if (isDemoMode()) {
    const id = (await cookies()).get(DEMO_USER_COOKIE)?.value ?? DEMO_DEFAULT_USER_ID;
    return (await getUserById(id)) ?? null;
  }

  // ── Production (Supabase Auth) ─────────────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !profile) return null;
  return mapProfile(profile);
}

/** Redirect to sign-in unless authenticated. Returns the user otherwise. */
export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Require a staff role; clients are bounced to their dashboard. */
export async function requireStaff(): Promise<UserProfile> {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/dashboard");
  return user;
}

/** Require a specific set of roles. */
export async function requireRole(roles: Role[]): Promise<UserProfile> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** Require the user to be a client with an attached clientId. */
export async function requireClient(): Promise<UserProfile & { clientId: string }> {
  const user = await requireUser();
  if (user.role !== "client" || !user.clientId) redirect("/admin");
  return user as UserProfile & { clientId: string };
}

export async function getLocale(user?: UserProfile | null): Promise<Language> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  if (user?.preferredLanguage) return user.preferredLanguage;
  return DEFAULT_LOCALE;
}

/** Convenience: resolve the dictionary for the current request. */
export async function getT(user?: UserProfile | null) {
  return getDictionary(await getLocale(user));
}
