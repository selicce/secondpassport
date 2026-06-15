import Link from "next/link";
import { ShieldCheck, Lock, Globe2 } from "lucide-react";
import { BrandMark } from "@/components/brand";

/**
 * Split-screen auth shell: a navy brand panel (trust signals) beside the form.
 * Reads as a private-banking / corporate-legal login, not a SaaS sign-up.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="surface-navy relative hidden flex-col justify-between p-10 text-white lg:flex">
        <Link href="/">
          <BrandMark size="lg" tagline="Client Portal" />
        </Link>

        <div className="max-w-md space-y-6">
          <h1 className="font-serif text-3xl font-semibold leading-snug">
            Corporate matters, handled with discretion and precision.
          </h1>
          <p className="text-white/70">
            Manage company formation, banking coordination, documents, invoices and
            cases across Hong Kong, Mainland China and beyond — in one secure place.
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-sidebar-accent" /> Role-based access &amp; full audit trail
            </li>
            <li className="flex items-center gap-3">
              <Lock className="size-5 text-sidebar-accent" /> Private document storage, no public links
            </li>
            <li className="flex items-center gap-3">
              <Globe2 className="size-5 text-sidebar-accent" /> English · 中文 · Русский · O‘zbekcha
            </li>
          </ul>
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} JR &amp; Firm. Confidential client system.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark size="md" variant="light" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
