import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Avatar, PageHeader, Separator } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { requireClient } from "@/lib/session";
import { getClientById } from "@/lib/data";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";
import { ROLE_LABELS } from "@/lib/rbac";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireClient();
  const client = await getClientById(user.clientId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile & Settings" description="Manage your contact details, language and security." />

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar name={user.fullName} color={user.avatarColor} size={56} />
          <div>
            <p className="font-serif text-lg font-semibold">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone="gold">{ROLE_LABELS[user.role]}</Badge>
              {client && <Badge tone="neutral">{client.displayName}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="fullName"><Input id="fullName" defaultValue={user.fullName} /></Field>
            <Field label="Email" htmlFor="email"><Input id="email" type="email" defaultValue={user.email} /></Field>
            <Field label="Phone / messenger" htmlFor="phone"><Input id="phone" defaultValue={user.messenger ?? user.phone} /></Field>
            <Field label="Nationality" htmlFor="nat"><Input id="nat" defaultValue={user.nationality} /></Field>
            <Field label="Country of residence" htmlFor="res"><Input id="res" defaultValue={user.countryOfResidence} /></Field>
            <Field label="Preferred language" htmlFor="lang">
              <Select id="lang" defaultValue={user.preferredLanguage}>
                {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_LABELS[l]}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end"><Button>Save changes</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password" htmlFor="cur"><Input id="cur" type="password" placeholder="••••••••" /></Field>
            <div />
            <Field label="New password" htmlFor="new"><Input id="new" type="password" placeholder="••••••••" /></Field>
            <Field label="Confirm new password" htmlFor="conf"><Input id="conf" type="password" placeholder="••••••••" /></Field>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
            </div>
            <Button variant="secondary">Enable 2FA</Button>
          </div>
          <div className="flex justify-end"><Button>Update password</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
