import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PageHeader, Separator } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/session";
import { can } from "@/lib/rbac";
import { isDemoMode } from "@/lib/data";
import { CURRENCIES } from "@/lib/types";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";

export const metadata = { title: "Settings" };

function Toggle({ label, desc, on }: { label: string; desc: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ${on ? "justify-end bg-primary" : "justify-start bg-input"}`}>
        <span className="size-5 rounded-full bg-white shadow" />
      </span>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const user = await requireStaff();
  const canManage = can(user.role, "settings.manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Global portal configuration."
        actions={isDemoMode() ? <Badge tone="gold">Demo mode</Badge> : <Badge tone="success">Production</Badge>}
      />

      {!canManage && (
        <Card><CardContent className="p-5 text-sm text-muted-foreground">You have read-only access to settings.</CardContent></Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>General</CardTitle><CardDescription>Branding and defaults.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Firm name" htmlFor="firm"><Input id="firm" defaultValue="JR & Firm Limited" disabled={!canManage} /></Field>
            <Field label="Support email" htmlFor="support"><Input id="support" defaultValue="clientservices@jrandfirm.com" disabled={!canManage} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default currency" htmlFor="cur">
                <Select id="cur" defaultValue="USD" disabled={!canManage}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select>
              </Field>
              <Field label="Default language" htmlFor="lang">
                <Select id="lang" defaultValue="en" disabled={!canManage}>{LOCALES.map((l) => <option key={l} value={l}>{LOCALE_LABELS[l]}</option>)}</Select>
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Security</CardTitle><CardDescription>Account and access policy.</CardDescription></CardHeader>
          <CardContent className="divide-y divide-border">
            <Toggle label="Require email verification" desc="New clients must verify before access." on />
            <Toggle label="Enforce 2FA for staff" desc="Require two-factor for all staff roles." on />
            <Toggle label="Document download audit" desc="Log every document download." on />
            <Toggle label="Auto-expire signed URLs" desc="Time-limited document links only." on />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Integrations</CardTitle><CardDescription>Connected services.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Stripe payments", env: "STRIPE_SECRET_KEY" },
              { name: "Email (Resend)", env: "RESEND_API_KEY" },
              { name: "Supabase storage", env: "SUPABASE_STORAGE_BUCKET" },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{i.env}</p>
                </div>
                <Badge tone={isDemoMode() ? "warning" : "success"}>{isDemoMode() ? "Not configured" : "Connected"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Channels for portal events.</CardDescription></CardHeader>
          <CardContent className="divide-y divide-border">
            <Toggle label="In-app notifications" desc="Show the notification bell." on />
            <Toggle label="Email notifications" desc="Send transactional emails to clients." on />
            <Toggle label="New-order alerts to staff" desc="Notify the team on new service orders." on />
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <div className="flex justify-end"><Button>Save settings</Button></div>
      )}
    </div>
  );
}
