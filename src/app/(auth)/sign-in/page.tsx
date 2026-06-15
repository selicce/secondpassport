import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { listAllUsers, isDemoMode } from "@/lib/data";
import { ROLE_LABELS, isStaff } from "@/lib/rbac";
import { demoSignInAction } from "@/app/actions/session";
import { signInAction } from "@/app/actions/auth";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const demo = isDemoMode();
  const users = demo ? await listAllUsers() : [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to access your JR &amp; Firm client portal.
        </p>
      </div>

      {/* Credential form — wired to Supabase Auth in production. */}
      <form action={demo ? demoSignInAction.bind(null, "usr_client_a", false) : signInAction} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Sign in <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to JR &amp; Firm?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>

      {demo && (
        <div className="rounded-lg border border-dashed border-gold/40 bg-gold/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold">
            Demo accounts — one-click sign in
          </p>
          <div className="grid gap-2">
            {users.map((u) => (
              <form key={u.id} action={demoSignInAction.bind(null, u.id, isStaff(u.role))}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <Avatar name={u.fullName} color={u.avatarColor} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.fullName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {ROLE_LABELS[u.role]}
                  </span>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
