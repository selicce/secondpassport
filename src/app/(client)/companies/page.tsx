import Link from "next/link";
import { Building2, ChevronRight, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { requireClient } from "@/lib/session";
import { listCompaniesForClient } from "@/lib/data";
import { BANK_STATUS, ACCOUNTING_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Companies" };

export default async function CompaniesPage() {
  const user = await requireClient();
  const companies = await listCompaniesForClient(user.clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Companies"
        description="Entities connected to your account across all jurisdictions."
        actions={<ButtonLink href="/services" variant="secondary">Register a new company</ButtonLink>}
      />

      {companies.length === 0 ? (
        <EmptyState icon={<Building2 className="size-8" />} title="No companies yet"
          description="Once you register or onboard a company it will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((c) => (
            <Link key={c.id} href={`/companies/${c.id}`} className="group focus-ring block rounded-lg">
              <Card className="h-full p-5 transition-shadow group-hover:shadow-elevated">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="info">{c.jurisdiction}</Badge>
                      {c.status === "in_formation" && <Badge tone="warning">In formation</Badge>}
                    </div>
                    <h3 className="mt-2 truncate font-serif text-lg font-semibold">{c.name}</h3>
                    {c.nameChinese && <p className="truncate text-sm text-muted-foreground">{c.nameChinese}</p>}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Company no.</dt>
                    <dd className="font-medium">{c.companyNumber ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Incorporated</dt>
                    <dd className="font-medium">{formatDate(c.incorporationDate)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Bank</span>
                  <StatusBadge meta={BANK_STATUS[c.bankAccountStatus]} />
                  <span className="ml-2 text-xs text-muted-foreground">Accounting</span>
                  <StatusBadge meta={ACCOUNTING_STATUS[c.accountingStatus]} />
                </div>

                {c.registeredAddress && (
                  <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span className="line-clamp-1">{c.registeredAddress}</span>
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
