import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/session";
import { can } from "@/lib/rbac";
import { listServices } from "@/lib/data";
import { SERVICE_CATEGORY } from "@/lib/labels";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Service Catalogue" };

export default async function AdminServicesPage() {
  const user = await requireStaff();
  if (!can(user.role, "services.manage")) redirect("/admin");
  const services = await listServices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Catalogue"
        description="Manage the services clients can order."
        actions={<Button variant="primary">Add service</Button>}
      />
      <Table>
        <THead>
          <TR><TH>Service</TH><TH>Category</TH><TH>Jurisdiction</TH><TH>Starting price</TH><TH>Timeline</TH><TH>Status</TH><TH className="text-right">Action</TH></TR>
        </THead>
        <TBody>
          {services.map((s) => (
            <TR key={s.id}>
              <TD className="font-medium">{s.title}</TD>
              <TD className="text-muted-foreground">{SERVICE_CATEGORY[s.category].label}</TD>
              <TD className="text-muted-foreground">{s.jurisdiction ?? "—"}</TD>
              <TD className="tabular-nums">{s.startingPrice === null ? "Quote" : formatMoney(s.startingPrice, s.currency)}</TD>
              <TD className="text-muted-foreground">{s.estimatedTimeline}</TD>
              <TD><Badge tone={s.active ? "success" : "neutral"}>{s.active ? "Active" : "Hidden"}</Badge></TD>
              <TD className="text-right"><Button size="sm" variant="outline">Edit</Button></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
