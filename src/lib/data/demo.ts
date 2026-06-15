/**
 * Demo data provider — in-memory fixtures. Active when NEXT_PUBLIC_DEMO_MODE is
 * not "false". Mirrors the Supabase provider's behavior (client-level filtering,
 * sort order) so the UI is identical in both modes.
 */
import {
  auditLog,
  cases,
  clients,
  companies,
  documents,
  invoices,
  notifications,
  payments,
  services,
  tickets,
  users,
} from "./fixtures";
import type { DataRepo } from "./repo";

export const demoRepo: DataRepo = {
  async getUserById(id) {
    return users.find((u) => u.id === id);
  },
  async listStaffUsers() {
    return users.filter((u) => u.role !== "client");
  },
  async listAllUsers() {
    return [...users];
  },

  async getClientById(id) {
    return clients.find((c) => c.id === id);
  },
  async listClients() {
    return [...clients];
  },

  async listCompaniesForClient(clientId) {
    return companies.filter((c) => c.clientId === clientId);
  },
  async getCompany(id) {
    return companies.find((c) => c.id === id);
  },
  async listAllCompanies() {
    return [...companies];
  },

  async listServices() {
    return services.filter((s) => s.active);
  },
  async getService(id) {
    return services.find((s) => s.id === id);
  },
  async getServiceByCategory(category) {
    return services.find((s) => s.category === category);
  },

  async listCasesForClient(clientId) {
    return cases.filter((c) => c.clientId === clientId);
  },
  async getCase(id) {
    return cases.find((c) => c.id === id);
  },
  async listAllCases() {
    return [...cases];
  },

  async listDocumentsForClient(clientId) {
    return documents.filter((d) => d.clientId === clientId);
  },
  async listDocumentsForCase(caseId) {
    return documents.filter((d) => d.caseId === caseId);
  },
  async getDocument(id) {
    return documents.find((d) => d.id === id);
  },
  async listAllDocuments() {
    return [...documents];
  },

  async listInvoicesForClient(clientId) {
    return invoices.filter((i) => i.clientId === clientId);
  },
  async getInvoice(id) {
    return invoices.find((i) => i.id === id);
  },
  async listAllInvoices() {
    return [...invoices];
  },
  async listPaymentsForInvoice(invoiceId) {
    return payments.filter((p) => p.invoiceId === invoiceId);
  },
  async listAllPayments() {
    return [...payments];
  },

  async listTicketsForClient(clientId) {
    return tickets.filter((t) => t.clientId === clientId);
  },
  async getTicket(id) {
    return tickets.find((t) => t.id === id);
  },
  async listAllTickets() {
    return [...tickets];
  },

  async listNotificationsForUser(userId) {
    return notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async listAuditLog() {
    return [...auditLog].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
