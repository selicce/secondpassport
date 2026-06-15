import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileText,
  Receipt,
  MessagesSquare,
  PlusCircle,
  UserCircle,
  Users,
  FolderKanban,
  CreditCard,
  LifeBuoy,
  Layers,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Permission } from "@/lib/rbac";

export interface NavItem {
  key: keyof Dictionary["nav"];
  href: string;
  icon: LucideIcon;
  /** Staff item is shown only if the role has at least this permission. */
  permission?: Permission;
  /** Match nested routes for active state (default: exact + startsWith). */
  exact?: boolean;
}

export const CLIENT_NAV: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { key: "companies", href: "/companies", icon: Building2 },
  { key: "services", href: "/cases", icon: Briefcase },
  { key: "documents", href: "/documents", icon: FileText },
  { key: "invoices", href: "/invoices", icon: Receipt },
  { key: "messages", href: "/messages", icon: MessagesSquare },
  { key: "orderService", href: "/services", icon: PlusCircle },
  { key: "profile", href: "/profile", icon: UserCircle },
];

export const ADMIN_NAV: NavItem[] = [
  { key: "adminDashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { key: "clients", href: "/admin/clients", icon: Users, permission: "clients.view_all" },
  { key: "companies", href: "/admin/companies", icon: Building2, permission: "companies.view" },
  { key: "cases", href: "/admin/cases", icon: FolderKanban, permission: "cases.view" },
  { key: "documents", href: "/admin/documents", icon: FileText, permission: "documents.view" },
  { key: "invoices", href: "/admin/invoices", icon: Receipt, permission: "invoices.view" },
  { key: "payments", href: "/admin/payments", icon: CreditCard, permission: "payments.view" },
  { key: "tickets", href: "/admin/tickets", icon: LifeBuoy, permission: "tickets.view" },
  { key: "services", href: "/admin/services", icon: Layers, permission: "services.manage" },
  { key: "users", href: "/admin/users", icon: Users, permission: "users.manage" },
  { key: "auditLogs", href: "/admin/audit", icon: ScrollText, permission: "audit.view" },
  { key: "settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
];
