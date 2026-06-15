/**
 * Role-based access control.
 *
 * Five roles per the JR & Firm operating model. Permissions are coarse-grained
 * capability flags; every protected route and server action checks `can()`.
 * The same matrix is mirrored in the database via RLS policies (see
 * supabase/migrations) so access is enforced at the data layer too — the UI
 * checks here are defense-in-depth, never the sole gate.
 */

export const ROLES = [
  "client",
  "case_manager", // Customer service / case manager
  "finance",
  "admin",
  "super_admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  client: "Client",
  case_manager: "Case Manager",
  finance: "Finance",
  admin: "Administrator",
  super_admin: "Super Admin",
};

/** Everything a staff member might be allowed to do. */
export type Permission =
  | "client.view_own"
  | "clients.view_all"
  | "clients.manage"
  | "companies.view"
  | "companies.manage"
  | "cases.view"
  | "cases.manage"
  | "cases.assign"
  | "documents.view"
  | "documents.review" // approve / reject / request replacement
  | "documents.upload_completed"
  | "invoices.view"
  | "invoices.manage"
  | "payments.view"
  | "payments.reconcile" // mark offline received, reminders
  | "payments.settings"
  | "tickets.view"
  | "tickets.respond"
  | "tickets.assign"
  | "services.manage"
  | "users.manage"
  | "roles.manage"
  | "settings.manage"
  | "audit.view";

const STAFF_BASE: Permission[] = [
  "clients.view_all",
  "companies.view",
  "cases.view",
  "documents.view",
  "tickets.view",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  client: ["client.view_own"],

  case_manager: [
    ...STAFF_BASE,
    "cases.manage",
    "documents.review",
    "documents.upload_completed",
    "tickets.respond",
    "invoices.view",
    "payments.view", // can see payment status, cannot change financial settings
  ],

  finance: [
    ...STAFF_BASE,
    "invoices.view",
    "invoices.manage",
    "payments.view",
    "payments.reconcile",
  ],

  admin: [
    ...STAFF_BASE,
    "clients.manage",
    "companies.manage",
    "cases.manage",
    "cases.assign",
    "documents.review",
    "documents.upload_completed",
    "invoices.view",
    "invoices.manage",
    "payments.view",
    "payments.reconcile",
    "tickets.respond",
    "tickets.assign",
    "services.manage",
    "audit.view",
  ],

  super_admin: [
    "clients.view_all",
    "clients.manage",
    "companies.view",
    "companies.manage",
    "cases.view",
    "cases.manage",
    "cases.assign",
    "documents.view",
    "documents.review",
    "documents.upload_completed",
    "invoices.view",
    "invoices.manage",
    "payments.view",
    "payments.reconcile",
    "payments.settings",
    "tickets.view",
    "tickets.respond",
    "tickets.assign",
    "services.manage",
    "users.manage",
    "roles.manage",
    "settings.manage",
    "audit.view",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isStaff(role: Role): boolean {
  return role !== "client";
}

export function hasAnyPermission(role: Role, perms: Permission[]): boolean {
  return perms.some((p) => can(role, p));
}
