import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { syncOverdueInvoicesForTenant } from "@/lib/rent-invoices";
import {
  announcements,
  documents,
  leases,
  maintenanceRequests,
  messageThreads,
  messages,
  payments,
  properties,
  rentInvoices,
  units,
  users,
} from "@/lib/db/schema";

export async function getTenantProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      autoPayEnabled: users.autoPayEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function getActiveLeaseForTenant(userId: string) {
  const rows = await db
    .select({
      lease: leases,
      unit: units,
      property: properties,
    })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(and(eq(leases.tenantId, userId), eq(leases.status, "active")))
    .limit(1);

  return rows[0] ?? null;
}

export async function getRentInvoicesForTenant(userId: string) {
  await syncOverdueInvoicesForTenant(userId);

  const leaseRows = await db
    .select({ id: leases.id })
    .from(leases)
    .where(eq(leases.tenantId, userId));

  const leaseIds = leaseRows.map((r) => r.id);
  if (leaseIds.length === 0) return [];

  return db
    .select()
    .from(rentInvoices)
    .where(inArray(rentInvoices.leaseId, leaseIds))
    .orderBy(desc(rentInvoices.dueDate));
}

export async function getPaymentsForTenant(userId: string) {
  return db
    .select({
      payment: payments,
      invoice: rentInvoices,
    })
    .from(payments)
    .innerJoin(rentInvoices, eq(payments.invoiceId, rentInvoices.id))
    .where(eq(payments.tenantId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function getMaintenanceForTenant(userId: string) {
  return db
    .select({
      request: maintenanceRequests,
      unit: units,
    })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .where(eq(maintenanceRequests.tenantId, userId))
    .orderBy(desc(maintenanceRequests.createdAt));
}

export async function getDocumentsForTenant(userId: string, propertyId?: string) {
  const conditions = propertyId
    ? or(eq(documents.tenantId, userId), eq(documents.propertyId, propertyId))
    : eq(documents.tenantId, userId);

  return db
    .select()
    .from(documents)
    .where(conditions)
    .orderBy(desc(documents.uploadedAt));
}

export async function getMessageThreadsForTenant(userId: string) {
  return db
    .select()
    .from(messageThreads)
    .where(eq(messageThreads.tenantId, userId))
    .orderBy(desc(messageThreads.updatedAt));
}

export async function getMessagesInThread(threadId: string, tenantId: string) {
  const [thread] = await db
    .select()
    .from(messageThreads)
    .where(
      and(eq(messageThreads.id, threadId), eq(messageThreads.tenantId, tenantId)),
    )
    .limit(1);

  if (!thread) return null;

  const threadMessages = await db
    .select({
      message: messages,
      sender: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      },
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.createdAt);

  return { thread, messages: threadMessages };
}

export async function getAnnouncementsForProperty(propertyId: string) {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.propertyId, propertyId))
    .orderBy(desc(announcements.publishedAt));
}

export async function getInvoiceForTenant(invoiceId: string, userId: string) {
  const rows = await db
    .select({
      invoice: rentInvoices,
      lease: leases,
    })
    .from(rentInvoices)
    .innerJoin(leases, eq(rentInvoices.leaseId, leases.id))
    .where(
      and(eq(rentInvoices.id, invoiceId), eq(leases.tenantId, userId)),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getDocumentForTenant(documentId: string, userId: string) {
  const lease = await getActiveLeaseForTenant(userId);
  const propertyId = lease?.property.id;

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) return null;
  if (doc.tenantId === userId) return doc;
  if (propertyId && doc.propertyId === propertyId && !doc.tenantId) return doc;
  return null;
}
