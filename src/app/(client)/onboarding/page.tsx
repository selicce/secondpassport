import Link from "next/link";
import {
  Building2,
  Landmark,
  RefreshCw,
  Plane,
  Calculator,
  FileSignature,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { requireClient, getT } from "@/lib/session";
import { getClientById } from "@/lib/data";

export const metadata = { title: "Get started" };

const OPTIONS = [
  { icon: Building2, title: "Register a company", desc: "Hong Kong, China WFOE, or another jurisdiction.", href: "/services/svc_hk_company", tone: "text-primary" },
  { icon: Landmark, title: "Open a bank account", desc: "Corporate bank or fintech account support.", href: "/services/svc_hk_bank", tone: "text-gold" },
  { icon: RefreshCw, title: "Renew or maintain a company", desc: "Annual return, BR renewal, secretary.", href: "/services/svc_renewal", tone: "text-primary" },
  { icon: Plane, title: "Apply for a work / residence permit", desc: "Immigration and work permit support.", href: "/services/svc_immigration", tone: "text-primary" },
  { icon: Calculator, title: "Accounting & tax support", desc: "Bookkeeping, audit liaison, tax filing.", href: "/services/svc_accounting", tone: "text-primary" },
  { icon: FileSignature, title: "Contract / legal document support", desc: "Drafting and review of corporate documents.", href: "/services", tone: "text-primary" },
  { icon: HelpCircle, title: "Other inquiry", desc: "Not sure where to start? Talk to our team.", href: "/messages/new", tone: "text-muted-foreground" },
];

export default async function OnboardingPage() {
  const user = await requireClient();
  const t = await getT(user);
  const client = await getClientById(user.clientId);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Welcome to JR & Firm"
        title={`Hello ${client?.primaryContactName.split(" ")[0] ?? "there"}, what would you like to do?`}
        description="Choose where you'd like to begin. You can always explore everything else from your dashboard."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          return (
            <Link key={o.title} href={o.href} className="group focus-ring block rounded-lg">
              <Card className="flex h-full items-start gap-4 p-5 transition-shadow group-hover:shadow-elevated">
                <span className="rounded-lg bg-muted p-2.5">
                  <Icon className={`size-6 ${o.tone}`} />
                </span>
                <div className="flex-1">
                  <p className="font-medium">{o.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{o.desc}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground">Prefer to look around first?</p>
        <ButtonLink href="/dashboard" variant="primary">Go to my dashboard <ArrowRight className="size-4" /></ButtonLink>
      </div>
    </div>
  );
}
