import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Avatar, PageHeader } from "@/components/ui/misc";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";
import { requireStaff } from "@/lib/session";
import { can, ROLES, ROLE_LABELS } from "@/lib/rbac";
import { listStaffUsers } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Staff Users" };

export default async function AdminUsersPage() {
  const user = await requireStaff();
  if (!can(user.role, "users.manage")) redirect("/admin");
  const staff = await listStaffUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Users"
        description="Manage staff accounts and their roles."
        actions={<Button variant="primary">Invite staff</Button>}
      />

      <Disclaimer variant="subtle">
        Role changes are sensitive and are written to the audit log. Only Super Admins can
        grant or revoke roles.
      </Disclaimer>

      <Table>
        <THead>
          <TR><TH>Staff</TH><TH>Role</TH><TH>Joined</TH><TH className="text-right">Actions</TH></TR>
        </THead>
        <TBody>
          {staff.map((s) => (
            <TR key={s.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <Avatar name={s.fullName} color={s.avatarColor} size={34} />
                  <div>
                    <p className="font-medium">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                </div>
              </TD>
              <TD>
                <Select defaultValue={s.role} className="max-w-[180px]" disabled={s.id === user.id}>
                  {ROLES.filter((r) => r !== "client").map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </Select>
              </TD>
              <TD className="text-muted-foreground">{formatDate(s.createdAt)}</TD>
              <TD className="text-right">
                <Button size="sm" variant="ghost" className="text-destructive" disabled={s.id === user.id}>Deactivate</Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
