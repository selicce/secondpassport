import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/rbac";

/** Entry point: route to the right home based on auth + role. */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  redirect(isStaff(user.role) ? "/admin" : "/dashboard");
}
