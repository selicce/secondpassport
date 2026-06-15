import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Disclaimer } from "@/components/disclaimer";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";
import { SERVICE_CATEGORY } from "@/lib/labels";
import { registerDemoAction } from "@/app/actions/session";
import { signUpAction } from "@/app/actions/auth";
import { isDemoMode } from "@/lib/data";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  const demo = isDemoMode();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-semibold">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Tell us a little about you so we can tailor your onboarding.
        </p>
      </div>

      <form action={demo ? registerDemoAction : signUpAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" required>
            <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <Input id="email" name="email" type="email" placeholder="you@company.com" required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone / WhatsApp / WeChat / Telegram" htmlFor="messenger">
            <Input id="messenger" name="messenger" placeholder="+852 …" />
          </Field>
          <Field label="Nationality" htmlFor="nationality">
            <Input id="nationality" name="nationality" placeholder="e.g. Malaysian" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country of residence" htmlFor="residence">
            <Input id="residence" name="residence" placeholder="e.g. Hong Kong" />
          </Field>
          <Field label="Preferred language" htmlFor="language">
            <Select id="language" name="language" defaultValue="en">
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name (if known)" htmlFor="company">
            <Input id="company" name="company" placeholder="Optional" />
          </Field>
          <Field label="Service needed" htmlFor="service">
            <Select id="service" name="service" defaultValue="hk_company">
              {Object.entries(SERVICE_CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Password" htmlFor="password" required hint="Minimum 8 characters.">
          <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} />
        </Field>

        <Disclaimer variant="subtle">
          By creating an account you agree to JR &amp; Firm processing the information you
          provide for the purpose of delivering the requested services. A verification
          email will be sent to confirm your address.
        </Disclaimer>

        <Button type="submit" size="lg" className="w-full">
          Create account <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
