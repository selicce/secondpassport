import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { Disclaimer } from "@/components/disclaimer";
import { requireClient, getT } from "@/lib/session";
import { JURISDICTIONS } from "@/lib/types";
import { submitIntakeAction } from "@/app/actions/orders";

export const metadata = { title: "Company registration intake" };

export default async function CompanyIntakePage({ searchParams }: { searchParams: Promise<{ j?: string }> }) {
  const user = await requireClient();
  const t = await getT(user);
  const { j } = await searchParams;
  const isCN = j === "cn";
  const isHK = j === "hk" || !isCN;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to services
      </Link>

      <PageHeader
        eyebrow="Company registration"
        title={isCN ? "Mainland China WFOE — Application" : "Hong Kong Company — Application"}
        description="Complete this structured intake so our team can begin preparation. You can save documents later in the Document Center."
      />

      {/* Production: submit -> create company_registration_intakes row + a case. */}
      <form action={submitIntakeAction.bind(null, "company")} className="space-y-6">
        {/* ── Core ── */}
        <Card>
          <CardHeader><CardTitle>Company basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Jurisdiction" htmlFor="jurisdiction" required>
              <Select id="jurisdiction" name="jurisdiction" defaultValue={isCN ? "Mainland China" : "Hong Kong"}>
                {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
              </Select>
            </Field>

            {isHK ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name in English" htmlFor="nameEn" required>
                  <Input id="nameEn" name="nameEn" placeholder="e.g. Aurelia Trading (HK) Limited" required />
                </Field>
                <Field label="Company name in Chinese" htmlFor="nameZh" hint="If any">
                  <Input id="nameZh" name="nameZh" placeholder="（如有）" />
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" htmlFor="city" required>
                  <Input id="city" name="city" placeholder="e.g. Shenzhen" required />
                </Field>
                <Field label="Company type" htmlFor="coType">
                  <Select id="coType" name="coType" defaultValue="consulting">
                    <option value="consulting">Consulting</option>
                    <option value="trading">Trading</option>
                    <option value="logistics">Logistics</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Preferred name 1" htmlFor="pn1" required className="sm:col-span-1">
                <Input id="pn1" name="pn1" required />
              </Field>
              <Field label="Preferred name 2" htmlFor="pn2"><Input id="pn2" name="pn2" /></Field>
              <Field label="Preferred name 3" htmlFor="pn3"><Input id="pn3" name="pn3" /></Field>
            </div>

            <Field label="Business activity / scope" htmlFor="scope" required>
              <Textarea id="scope" name="scope" rows={3} placeholder="Describe the intended business activities" required />
            </Field>

            {isCN && (
              <Field label="Registered capital" htmlFor="capital" hint="Currency and amount">
                <Input id="capital" name="capital" placeholder="e.g. USD 100,000" />
              </Field>
            )}
          </CardContent>
        </Card>

        {/* ── Ownership ── */}
        <Card>
          <CardHeader>
            <CardTitle>Ownership &amp; officers</CardTitle>
            <CardDescription>Add the shareholder(s), director(s) and beneficial owner(s).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4 rounded-lg border border-border p-4">
              <Label>Shareholder 1</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" htmlFor="sh1type">
                  <Select id="sh1type" name="sh1type" defaultValue="individual">
                    <option value="individual">Individual</option>
                    <option value="corporate">Company</option>
                  </Select>
                </Field>
                <Field label="Full / company name" htmlFor="sh1name" required>
                  <Input id="sh1name" name="sh1name" required />
                </Field>
                <Field label="Nationality / place of incorporation" htmlFor="sh1nat">
                  <Input id="sh1nat" name="sh1nat" />
                </Field>
                <Field label="Shareholding %" htmlFor="sh1pct">
                  <Input id="sh1pct" name="sh1pct" type="number" min={0} max={100} defaultValue={100} />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isCN ? "Legal representative" : "Director 1"} htmlFor="dir1" required>
                <Input id="dir1" name="dir1" required />
              </Field>
              <Field label="Ultimate Beneficial Owner" htmlFor="ubo" required>
                <Input id="ubo" name="ubo" required />
              </Field>
            </div>

            {isCN ? (
              <Field label="Supervisor / finance contact" htmlFor="supervisor" hint="If applicable">
                <Input id="supervisor" name="supervisor" />
              </Field>
            ) : (
              <Field label="Significant Controller information" htmlFor="scr" hint="Required for the SCR">
                <Input id="scr" name="scr" placeholder="Name & nature of control" />
              </Field>
            )}
          </CardContent>
        </Card>

        {/* ── Setup ── */}
        <Card>
          <CardHeader><CardTitle>Registration setup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Registered address" htmlFor="address">
                <Select id="address" name="address" defaultValue="jrf">
                  <option value="jrf">Use JR &amp; Firm registered address service</option>
                  <option value="own">I will provide my own address</option>
                </Select>
              </Field>
              {isHK ? (
                <Field label="Company secretary" htmlFor="secretary">
                  <Select id="secretary" name="secretary" defaultValue="jrf">
                    <option value="jrf">JR &amp; Firm company secretary</option>
                    <option value="own">Own secretary</option>
                  </Select>
                </Field>
              ) : (
                <Field label="Taxpayer status" htmlFor="taxpayer">
                  <Select id="taxpayer" name="taxpayer" defaultValue="general">
                    <option value="general">General taxpayer</option>
                    <option value="small">Small-scale taxpayer</option>
                  </Select>
                </Field>
              )}
            </div>

            <fieldset className="space-y-2">
              <Label>Additional support needed</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: "needBank", label: "Bank / fintech account" },
                  { id: "needAccounting", label: "Accounting & tax" },
                  { id: "needVisa", label: "Visa / work permit" },
                  ...(isCN ? [{ id: "needTrade", label: "Import / export license" }] : []),
                  ...(isHK ? [{ id: "needAoa", label: "Custom Articles of Association" }] : []),
                ].map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <input type="checkbox" name={c.id} className="size-4 rounded border-input" />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Special instructions" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} placeholder="Anything else we should know?" />
            </Field>
          </CardContent>
        </Card>

        <Disclaimer>{t.disclaimers.government}</Disclaimer>
        <Disclaimer variant="subtle">{t.disclaimers.accuracy}</Disclaimer>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button">Save draft</Button>
          <Button type="submit"><Send className="size-4" /> Submit application</Button>
        </div>
      </form>
    </div>
  );
}
