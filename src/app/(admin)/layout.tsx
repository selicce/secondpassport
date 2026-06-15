import { AppShell } from "@/components/layout/app-shell";
import { requireStaff } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <AppShell user={user} variant="admin">
      {children}
    </AppShell>
  );
}
