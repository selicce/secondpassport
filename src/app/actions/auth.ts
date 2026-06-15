"use server";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import { isStaff } from "@/lib/rbac";
import { mapProfile } from "@/lib/data/mappers";

/**
 * Production auth (Supabase). These are wired into the auth pages only when
 * NEXT_PUBLIC_DEMO_MODE === "false"; in demo mode the pages use the demo
 * sign-in actions in src/app/actions/session.ts instead.
 */

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/sign-in?error=missing");

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/sign-in?error=invalid");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  const mapped = profile ? mapProfile(profile) : null;
  if (mapped) {
    await recordAudit({ actor: { id: mapped.id, fullName: mapped.fullName, role: mapped.role }, action: "login" });
  }
  redirect(mapped && isStaff(mapped.role) ? "/admin" : "/dashboard");
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) redirect("/register?error=invalid");

  const supabase = await createServerClient();
  // The handle_new_user trigger (migration 0002) creates the profile row from
  // this metadata. A `clients` group is provisioned on first staff contact / a
  // follow-up onboarding step.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: String(formData.get("fullName") ?? ""),
        messenger: String(formData.get("messenger") ?? ""),
        nationality: String(formData.get("nationality") ?? ""),
        country_of_residence: String(formData.get("residence") ?? ""),
        preferred_language: String(formData.get("language") ?? "en"),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?verified=1`,
    },
  });
  if (error) redirect("/register?error=signup");
  redirect("/sign-in?registered=1");
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    const supabase = await createServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
  }
  // Always report success to avoid leaking which emails are registered.
  redirect("/forgot-password?sent=1");
}
