import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { Disclaimer } from "@/components/disclaimer";
import { UploadControl } from "@/components/forms/upload-control";
import { requireClient, getT } from "@/lib/session";
import { listCompaniesForClient } from "@/lib/data";
import { JURISDICTIONS, CURRENCIES } from "@/lib/types";
import { submitIntakeAction } from "@/app/actions/orders";

export const metadata = { title: "Bank account opening intake" };

export default async function BankIntakePage() {
  const user = await requireClient();
  const t = await getT(user);
  const companies = await listCompaniesForClient(user.clientId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to services
      </Link>

      <PageHeader
        eyebrow="Bank account opening"
        title="Bank / Fintech Account — Application"
        description="The more complete and accurate your business profile, the stronger your application."
      />

      {/* The critical, non-negotiable expectation-setting disclaimer. */}
      <Disclaimer>
        JR &amp; Firm may assist with preparation and coordination; however, bank account
        approval is subject to the bank’s internal compliance review and is never guaranteed.
      </Disclaimer>

      <form action={submitIntakeAction.bind(null, "bank")} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Entity & banking preference</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" htmlFor="company" required>
                <Select id="company" name="company" required defaultValue={companies[0]?.id ?? ""}>
                  {companies.length === 0 && <option value="">No company on file</option>}
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Jurisdiction" htmlFor="jurisdiction" required>
                <Select id="jurisdiction" name="jurisdiction" defaultValue="Hong Kong">
                  {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Preferred bank / fintech" htmlFor="bankPref" hint="e.g. HSBC, Hang Seng, Airwallex, Statrys">
              <Input id="bankPref" name="bankPref" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Banks assess your business model and money flows during compliance review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Business model" htmlFor="model" required>
              <Textarea id="model" name="model" rows={3} placeholder="How does the business make money?" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Main products / services" htmlFor="products" required>
                <Input id="products" name="products" required />
              </Field>
              <Field label="Website" htmlFor="website">
                <Input id="website" name="website" type="url" placeholder="https://" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Source of funds" htmlFor="sof" required>
                <Input id="sof" name="sof" placeholder="e.g. trading revenue" required />
              </Field>
              <Field label="Expected monthly volume" htmlFor="volume">
                <Input id="volume" name="volume" placeholder="e.g. USD 50,000" />
              </Field>
              <Field label="Settlement currency" htmlFor="currency">
                <Select id="currency" name="currency" defaultValue="USD">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Expected client countries" htmlFor="clientCountries">
                <Input id="clientCountries" name="clientCountries" placeholder="e.g. US, EU, UK" />
              </Field>
              <Field label="Expected supplier countries" htmlFor="supplierCountries">
                <Input id="supplierCountries" name="supplierCountries" placeholder="e.g. China, Vietnam" />
              </Field>
            </div>
            <Field label="Key customers / suppliers" htmlFor="counterparties" hint="Named counterparties strengthen the application">
              <Textarea id="counterparties" name="counterparties" rows={2} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supporting documents</CardTitle>
            <CardDescription>Upload what you have now; you can add more later in the Document Center.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Director / shareholder passports",
                "Proof of address",
                "Certificate of Incorporation & BR",
                "Sample contracts or invoices",
              ].map((d) => (
                <div key={d} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="text-sm">{d}</span>
                  <UploadControl compact label="Upload" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Disclaimer variant="subtle">{t.disclaimers.accuracy}</Disclaimer>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button">Save draft</Button>
          <Button type="submit"><Send className="size-4" /> Submit application</Button>
        </div>
      </form>
    </div>
  );
}
