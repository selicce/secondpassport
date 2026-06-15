import { PortalChrome } from "./portal-chrome";
import { getLocale } from "@/lib/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { listNotificationsForUser, listAllUsers, isDemoMode } from "@/lib/data";
import type { UserProfile } from "@/lib/types";

/**
 * Server shell: resolves locale, dictionary, notifications and (in demo mode)
 * the role-switcher options, then hands serializable props to the client chrome.
 */
export async function AppShell({
  user,
  variant,
  children,
}: {
  user: UserProfile;
  variant: "client" | "admin";
  children: React.ReactNode;
}) {
  const locale = await getLocale(user);
  const dict = getDictionary(locale);
  const [notifications, allUsers] = await Promise.all([
    listNotificationsForUser(user.id),
    isDemoMode() ? listAllUsers() : Promise.resolve([]),
  ]);

  return (
    <PortalChrome
      variant={variant}
      user={{
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarColor: user.avatarColor,
      }}
      navLabels={dict.nav as unknown as Record<string, string>}
      signOutLabel={dict.common.signOut}
      locale={locale}
      isDemo={isDemoMode()}
      demoUsers={allUsers.map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }))}
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        href: n.href,
        read: n.read,
      }))}
    >
      {children}
    </PortalChrome>
  );
}
