import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Separator } from "@/components/ui/misc";
import { Button, ButtonLink } from "@/components/ui/button";
import { DisclaimerList } from "@/components/disclaimer";
import { requireClient } from "@/lib/session";
import { getService } from "@/lib/data";
import { SERVICE_CATEGORY } from "@/lib/labels";
import { formatMoney } from "@/lib/utils";
import { orderServiceAction } from "@/app/actions/orders";

/** Services that begin with a structured intake form rather than a plain order. */
const INTAKE_ROUTE: Record<string, string> = {
  hk_company: "/intake/company?j=hk",
  cn_wfoe: "/intake/company?j=cn",
  hk_bank: "/intake/bank",
  cn_bank: "/intake/bank",
};

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireClient();
  const { id } = await params;
  const service = await getService(id);
  if (!service) notFound();

  const intakeRoute = INTAKE_ROUTE[service.category];

  return (
    <div className="space-y-6">
      <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All services
      </Link>

      <PageHeader
        eyebrow={SERVICE_CATEGORY[service.category].label}
        title={service.title}
        description={service.shortDescription}
        actions={service.jurisdiction ? <Badge tone="info">{service.jurisdiction}</Badge> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>About this service</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </CardContent>
          </Card>

          {service.requiredDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" /> Documents you’ll need</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.requiredDocuments.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {d}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <DisclaimerList items={service.disclaimers} />
        </div>

        {/* Order panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Starting from</p>
                <p className="font-serif text-2xl font-semibold">
                  {service.startingPrice === null ? "Request quote" : formatMoney(service.startingPrice, service.currency)}
                </p>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span>{service.estimatedTimeline}</span>
              </div>
              <Separator />

              {intakeRoute ? (
                <ButtonLink href={intakeRoute} variant="gold" size="lg" className="w-full">
                  Begin application
                </ButtonLink>
              ) : (
                <form action={orderServiceAction.bind(null, service.id)}>
                  <Button type="submit" variant="gold" size="lg" className="w-full">
                    {service.startingPrice === null ? "Request a quote" : "Order this service"}
                  </Button>
                </form>
              )}
              <p className="text-center text-xs text-muted-foreground">
                A case will be created and our team will confirm next steps.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              Questions before ordering?{" "}
              <Link href="/messages/new" className="font-medium text-primary hover:underline">Ask our team</Link>.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
