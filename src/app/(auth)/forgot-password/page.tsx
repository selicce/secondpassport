import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { resetPasswordAction } from "@/app/actions/auth";
import { isDemoMode } from "@/lib/data";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  const demo = isDemoMode();
  return (
    <div className="space-y-6">
      <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>

      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-semibold">Reset your password</h2>
        <p className="text-sm text-muted-foreground">
          Enter the email associated with your account and we’ll send a secure reset link.
        </p>
      </div>

      {/* In production this triggers Supabase Auth's password recovery email. */}
      <form action={demo ? undefined : resetPasswordAction} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" placeholder="you@company.com" />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          <Mail className="size-4" /> Send reset link
        </Button>
      </form>
    </div>
  );
}
