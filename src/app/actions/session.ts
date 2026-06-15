"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { DEMO_USER_COOKIE } from "@/lib/session";
import { isDemoMode } from "@/lib/data";
import { createServerClient } from "@/lib/supabase/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persist the UI language preference. */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { maxAge: ONE_YEAR, path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}

/**
 * Demo-only: switch the active user (role switcher). In production this is
 * replaced by Supabase Auth — there is no client-side role switching.
 */
export async function setDemoUserAction(userId: string) {
  if (!isDemoMode()) return;
  (await cookies()).set(DEMO_USER_COOKIE, userId, { maxAge: ONE_YEAR, path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}

/** Demo sign-in: set the active user and route to the right home. */
export async function demoSignInAction(userId: string, isStaff: boolean) {
  (await cookies()).set(DEMO_USER_COOKIE, userId, { maxAge: ONE_YEAR, path: "/", sameSite: "lax" });
  redirect(isStaff ? "/admin" : "/dashboard");
}

/**
 * Demo registration: in production this creates a Supabase user + profile +
 * client record, sends an email verification, and routes to onboarding. Here we
 * sign the visitor in as the sample client so the onboarding flow is explorable.
 */
export async function registerDemoAction() {
  (await cookies()).set(DEMO_USER_COOKIE, "usr_client_a", { maxAge: ONE_YEAR, path: "/", sameSite: "lax" });
  redirect("/onboarding");
}

export async function signOutAction() {
  if (isDemoMode()) {
    (await cookies()).delete(DEMO_USER_COOKIE);
  } else {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}
