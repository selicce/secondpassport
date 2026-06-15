"use server";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/data";
import { createCaseFromService, submitIntake } from "@/lib/data/mutations";

/**
 * Place a service order. Prod: create a `cases` row (+ service_order) and route
 * to the cases list. Demo: just route. (Checklist generation + staff
 * notification are TODOs marked in mutations.createCaseFromService.)
 */
export async function orderServiceAction(serviceId: string) {
  if (!isDemoMode()) {
    await createCaseFromService(serviceId);
  }
  redirect("/cases?ordered=1");
}

/** Submit a structured intake (company registration / bank account). */
export async function submitIntakeAction(kind: "company" | "bank", formData: FormData) {
  if (!isDemoMode()) {
    const payload: Record<string, string> = {};
    for (const [k, v] of formData.entries()) payload[k] = String(v);
    await submitIntake(kind, payload);
  }
  redirect(kind === "bank" ? "/cases?intake=bank" : "/cases?intake=company");
}
