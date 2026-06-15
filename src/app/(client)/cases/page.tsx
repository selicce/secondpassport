import { Briefcase } from "lucide-react";
import { ProgressCard } from "@/components/progress-card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { requireClient } from "@/lib/session";
import { listCasesForClient } from "@/lib/data";

export const metadata = { title: "My Services" };

export default async function CasesPage() {
  const user = await requireClient();
  const cases = await listCasesForClient(user.clientId);
  const active = cases.filter((c) => !["completed", "cancelled"].includes(c.status));
  const closed = cases.filter((c) => ["completed", "cancelled"].includes(c.status));

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Services"
        description="Track the progress of every service you have ordered from JR & Firm."
        actions={<ButtonLink href="/services" variant="gold">Order new service</ButtonLink>}
      />

      {cases.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-8" />}
          title="No services yet"
          description="When you order a service it becomes a case you can track here."
          action={<ButtonLink href="/services">Browse services</ButtonLink>}
        />
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Active ({active.length})</h2>
            {active.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((c) => <ProgressCard key={c.id} record={c} />)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active services.</p>
            )}
          </section>

          {closed.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Completed &amp; closed ({closed.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {closed.map((c) => <ProgressCard key={c.id} record={c} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
