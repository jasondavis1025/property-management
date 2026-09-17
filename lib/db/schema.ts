import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["tenant", "staff"]);
export const leaseStatusEnum = pgEnum("lease_status", [
  "active",
  "ended",
  "pending",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending",
  "paid",
  "overdue",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "completed",
  "failed",
  "processing",
]);
export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "low",
  "normal",
  "urgent",
  "emergency",
]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "submitted",
  "in_progress",
  "scheduled",
  "completed",
  "cancelled",
]);
export const documentCategoryEnum = pgEnum("document_category", [
  "lease",
  "notice",
  "receipt",
  "policy",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("tenant"),
  stripeCustomerId: text("stripe_customer_id"),
  autoPayEnabled: boolean("auto_pay_enabled").notNull().default(false),
  autoPayPaymentMethodId: text("auto_pay_payment_method_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  addressLine1: text("address_line1").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
});

export const units = pgTable("units", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
});

export const leases = pgTable("leases", {
  id: uuid("id").defaultRandom().primaryKey(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  monthlyRentCents: integer("monthly_rent_cents").notNull(),
  status: leaseStatusEnum("status").notNull().default("active"),
});

export const rentInvoices = pgTable("rent_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  leaseId: uuid("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  description: text("description").notNull().default("Monthly rent"),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => rentInvoices.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  method: text("method").notNull().default("card"),
  status: paymentStatusEnum("status").notNull().default("completed"),
  reference: text("reference"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: maintenancePriorityEnum("priority").notNull().default("normal"),
  status: maintenanceStatusEnum("status").notNull().default("submitted"),
  permissionToEnter: boolean("permission_to_enter").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  category: documentCategoryEnum("category").notNull().default("other"),
  fileName: text("file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messageThreads = pgTable("message_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => messageThreads.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Lease = typeof leases.$inferSelect;
export type RentInvoice = typeof rentInvoices.$inferSelect;
