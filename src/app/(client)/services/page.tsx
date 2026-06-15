import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { requireClient } from "@/lib/session";
import { listServices } from "@/lib/data";
import { SERVICE_CATEGORY } from "@/lib/labels";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Order a Service" };

export default async function ServiceCataloguePage() {
  await requireClient();
  const services = await listServices();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Service catalogue"
        title="Order a new service"
        description="Explore JR & Firm's services across company formation, banking, accounting, immigration and more."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Link key={s.id} href={`/services/${s.id}`} className="group focus-ring block rounded-lg">
            <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-elevated">
              <div className="flex items-center gap-2">
                {s.jurisdiction && <Badge tone="info">{s.jurisdiction}</Badge>}
                <Badge tone="neutral">{SERVICE_CATEGORY[s.category].label.split(" ")[0]}</Badge>
              </div>
              <h3 className="mt-3 font-serif text-lg font-semibold leading-snug">{s.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.shortDescription}</p>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm font-semibold">
                    {s.startingPrice === null ? "Request quote" : `From ${formatMoney(s.startingPrice, s.currency)}`}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {s.estimatedTimeline}
                  </p>
                </div>
                <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
