/**
 * The data-access contract. Both the demo (in-memory) and Supabase
 * implementations satisfy this interface, so `src/lib/data/index.ts` can select
 * one at runtime without any call site changing.
 */
import type {
  AuditEntry,
  CaseRecord,
  Client,
  Company,
  DocumentRecord,
  ID,
  Invoice,
  NotificationRecord,
  Payment,
  Service,
  ServiceCategory,
  Ticket,
  UserProfile,
} from "@/lib/types";

export interface DataRepo {
  // Users
  getUserById(id: ID): Promise<UserProfile | undefined>;
  listStaffUsers(): Promise<UserProfile[]>;
  listAllUsers(): Promise<UserProfile[]>;
  // Clients
  getClientById(id: ID): Promise<Client | undefined>;
  listClients(): Promise<Client[]>;
  // Companies
  listCompaniesForClient(clientId: ID): Promise<Company[]>;
  getCompany(id: ID): Promise<Company | undefined>;
  listAllCompanies(): Promise<Company[]>;
  // Services
  listServices(): Promise<Service[]>;
  getService(id: ID): Promise<Service | undefined>;
  getServiceByCategory(category: ServiceCategory): Promise<Service | undefined>;
  // Cases
  listCasesForClient(clientId: ID): Promise<CaseRecord[]>;
  getCase(id: ID): Promise<CaseRecord | undefined>;
  listAllCases(): Promise<CaseRecord[]>;
  // Documents
  listDocumentsForClient(clientId: ID): Promise<DocumentRecord[]>;
  listDocumentsForCase(caseId: ID): Promise<DocumentRecord[]>;
  getDocument(id: ID): Promise<DocumentRecord | undefined>;
  listAllDocuments(): Promise<DocumentRecord[]>;
  // Invoices & payments
  listInvoicesForClient(clientId: ID): Promise<Invoice[]>;
  getInvoice(id: ID): Promise<Invoice | undefined>;
  listAllInvoices(): Promise<Invoice[]>;
  listPaymentsForInvoice(invoiceId: ID): Promise<Payment[]>;
  listAllPayments(): Promise<Payment[]>;
  // Tickets
  listTicketsForClient(clientId: ID): Promise<Ticket[]>;
  getTicket(id: ID): Promise<Ticket | undefined>;
  listAllTickets(): Promise<Ticket[]>;
  // Notifications & audit
  listNotificationsForUser(userId: ID): Promise<NotificationRecord[]>;
  listAuditLog(): Promise<AuditEntry[]>;
}
