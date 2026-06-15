import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { UploadControl } from "@/components/forms/upload-control";
import { PageHeader } from "@/components/ui/misc";
import { Disclaimer } from "@/components/disclaimer";
import { requireClient } from "@/lib/session";
import { listCompaniesForClient } from "@/lib/data";
import { TICKET_CATEGORY } from "@/lib/labels";

export const metadata = { title: "New inquiry" };

export default async function NewInquiryPage() {
  const user = await requireClient();
  const companies = await listCompaniesForClient(user.clientId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to messages
      </Link>

      <PageHeader title="New inquiry" description="Send a message to the JR & Firm client services team." />

      {/* Production: submit to a server action that creates a ticket, notifies
          client services by email, and (optionally) generates a CRM entry. */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <Field label="Category" htmlFor="category" required>
            <Select id="category" name="category" defaultValue="general">
              {Object.entries(TICKET_CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject" htmlFor="subject" required>
              <Input id="subject" name="subject" placeholder="Brief summary" required />
            </Field>
            <Field label="Related company" htmlFor="company" hint="Optional">
              <Select id="company" name="company" defaultValue="">
                <option value="">— None —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>

          <Field label="Message" htmlFor="message" required>
            <Textarea id="message" name="message" rows={6} placeholder="How can we help?" required />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium">Attachment (optional)</p>
            <UploadControl compact label="Attach file" />
          </div>

          <Disclaimer variant="subtle">
            For urgent matters, please mark the category as “Urgent”. Our team typically
            responds within one business day.
          </Disclaimer>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button">Cancel</Button>
            <Button type="submit"><Send className="size-4" /> Send inquiry</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
