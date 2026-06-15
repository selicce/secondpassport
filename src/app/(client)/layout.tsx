import { AppShell } from "@/components/layout/app-shell";
import { requireClient } from "@/lib/session";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  return (
    <AppShell user={user} variant="client">
      {children}
    </AppShell>
  );
}
