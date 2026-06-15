"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X, Globe, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { BrandMark } from "@/components/brand";
import { CLIENT_NAV, ADMIN_NAV, type NavItem } from "./nav-config";
import { can, ROLE_LABELS, type Role } from "@/lib/rbac";
import type { Language } from "@/lib/types";
import { LOCALE_LABELS } from "@/lib/i18n/config";
import { setLocaleAction, setDemoUserAction, signOutAction } from "@/app/actions/session";

interface ChromeUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarColor?: string;
}
interface ChromeNotification {
  id: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
}
interface DemoUserOption {
  id: string;
  fullName: string;
  role: Role;
}

export function PortalChrome({
  user,
  variant,
  navLabels,
  signOutLabel,
  notifications,
  locale,
  demoUsers,
  isDemo,
  children,
}: {
  user: ChromeUser;
  variant: "client" | "admin";
  navLabels: Record<string, string>;
  signOutLabel: string;
  notifications: ChromeNotification[];
  locale: Language;
  demoUsers: DemoUserOption[];
  isDemo: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const items = (variant === "admin" ? ADMIN_NAV : CLIENT_NAV).filter(
    (i) => !i.permission || can(user.role, i.permission),
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="surface-navy fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border lg:flex">
        <SidebarContent items={items} navLabels={navLabels} pathname={pathname} variant={variant} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="surface-navy absolute inset-y-0 left-0 flex w-72 flex-col">
            <button
              className="absolute right-3 top-4 text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              items={items}
              navLabels={navLabels}
              pathname={pathname}
              variant={variant}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
                variant === "admin"
                  ? "bg-primary/10 text-primary"
                  : "bg-gold/10 text-gold",
              )}
            >
              {variant === "admin" ? "Staff Workspace" : "Client Portal"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {isDemo && <DemoRoleSwitcher current={user.id} options={demoUsers} />}
            <LocaleSwitcher current={locale} />
            <NotificationBell notifications={notifications} />
            <UserMenu user={user} signOutLabel={signOutLabel} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  items,
  navLabels,
  pathname,
  variant,
  onNavigate,
}: {
  items: NavItem[];
  navLabels: Record<string, string>;
  pathname: string;
  variant: "client" | "admin";
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href={variant === "admin" ? "/admin" : "/dashboard"} onClick={onNavigate}>
          <BrandMark tagline={variant === "admin" ? "Admin Console" : "Client Portal"} />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("size-[18px]", active ? "text-sidebar-accent" : "text-sidebar-foreground/70")} />
              {navLabels[item.key] ?? item.key}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="flex items-center gap-2 text-[11px] leading-relaxed text-sidebar-foreground/60">
          <ShieldCheck className="size-3.5 text-sidebar-accent" />
          Encrypted &amp; access-controlled
        </p>
      </div>
    </div>
  );
}

function LocaleSwitcher({ current }: { current: Language }) {
  const [pending, start] = React.useTransition();
  return (
    <label className="relative inline-flex items-center">
      <Globe className="pointer-events-none absolute left-2 size-4 text-muted-foreground" />
      <select
        aria-label="Language"
        defaultValue={current}
        disabled={pending}
        onChange={(e) => start(() => setLocaleAction(e.target.value))}
        className="h-9 cursor-pointer appearance-none rounded-md border border-input bg-card pl-7 pr-7 text-sm focus-ring"
      >
        {Object.entries(LOCALE_LABELS).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DemoRoleSwitcher({ current, options }: { current: string; options: DemoUserOption[] }) {
  const [pending, start] = React.useTransition();
  return (
    <label className="relative hidden items-center md:inline-flex" title="Demo: switch user / role">
      <select
        aria-label="Demo role"
        value={current}
        disabled={pending}
        onChange={(e) => start(() => setDemoUserAction(e.target.value))}
        className="h-9 max-w-[180px] cursor-pointer appearance-none truncate rounded-md border border-dashed border-gold/40 bg-gold/5 pl-3 pr-7 text-xs font-medium text-foreground focus-ring"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.fullName} · {ROLE_LABELS[o.role]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-muted-foreground" />
    </label>
  );
}

function NotificationBell({ notifications }: { notifications: ChromeNotification[] }) {
  const [open, setOpen] = React.useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-accent"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && <span className="text-xs text-muted-foreground">{unread} unread</span>}
            </div>
            <div className="max-h-80 divide-y divide-border overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">You’re all caught up.</p>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href ?? "#"}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-accent"
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className={cn(n.read && "pl-4")}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu({ user, signOutLabel }: { user: ChromeUser; signOutLabel: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-accent"
      >
        <Avatar name={user.fullName} color={user.avatarColor} size={32} />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight">{user.fullName}</span>
          <span className="block text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium">{user.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="p-1.5">
              <Link
                href={user.role === "client" ? "/profile" : "/admin/settings"}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                Account settings
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  {signOutLabel}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
