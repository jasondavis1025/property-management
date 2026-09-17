import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import {
  announcements,
  documents,
  leases,
  maintenanceRequests,
  messageThreads,
  messages,
  properties,
  rentInvoices,
  units,
  users,
} from "../lib/db/schema";
import { addMonths, startOfMonth, subMonths } from "./date-utils";

config({ path: ".env.local" });
config();

async function main() {
  console.log("Seeding resident portal demo data…");

  const tenantPassword = await hashPassword("resident123");
  const staffPassword = await hashPassword("staff123");

  let [existingTenant] = await db
    .select()
    .from(users)
    .where(eq(users.email, "alex.jordan@example.com"))
    .limit(1);

  if (!existingTenant) {
    [existingTenant] = await db
      .insert(users)
      .values({
        email: "alex.jordan@example.com",
        passwordHash: tenantPassword,
        firstName: "Alex",
        lastName: "Jordan",
        phone: "(555) 010-2244",
        role: "tenant",
      })
      .returning();
  }

  let [existingStaff] = await db
    .select()
    .from(users)
    .where(eq(users.email, "office@oakview.example.com"))
    .limit(1);

  if (!existingStaff) {
    [existingStaff] = await db
      .insert(users)
      .values({
        email: "office@oakview.example.com",
        passwordHash: staffPassword,
        firstName: "Morgan",
        lastName: "Lee",
        phone: "(555) 010-9000",
        role: "staff",
      })
      .returning();
  }

  const existingProperty = await db.select().from(properties).limit(1);
  if (existingProperty.length > 0) {
    console.log("Database already seeded — skipping property setup.");
    console.log("\nDemo tenant: alex.jordan@example.com / resident123\n");
    return;
  }

  const [property] = await db
    .insert(properties)
    .values({
      name: "Oakview Apartments",
      addressLine1: "1200 Oakview Drive",
      city: "Springfield",
      state: "IL",
      zip: "62704",
    })
    .returning();

  const [unit] = await db
    .insert(units)
    .values({
      propertyId: property.id,
      unitNumber: "204",
      bedrooms: 2,
      bathrooms: 1,
    })
    .returning();

  const leaseStart = subMonths(startOfMonth(new Date()), 6);

  const [lease] = await db
    .insert(leases)
    .values({
      unitId: unit.id,
      tenantId: existingTenant.id,
      startDate: leaseStart,
      endDate: addMonths(leaseStart, 12),
      monthlyRentCents: 145000,
      status: "active",
    })
    .returning();

  const invoiceMonths = [0, 1, 2].map((offset) => {
    const due = addMonths(startOfMonth(new Date()), -offset);
    return {
      leaseId: lease.id,
      dueDate: due,
      amountCents: 145000,
      status: offset === 0 ? ("pending" as const) : ("paid" as const),
      paidAt: offset === 0 ? null : due,
      description: `Rent — ${due.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
    };
  });

  await db.insert(rentInvoices).values(invoiceMonths);

  await db.insert(maintenanceRequests).values({
    tenantId: existingTenant.id,
    unitId: unit.id,
    category: "Plumbing",
    title: "Kitchen faucet dripping",
    description: "The kitchen faucet has a slow drip that started last week.",
    priority: "normal",
    status: "in_progress",
    permissionToEnter: true,
  });

  await db.insert(announcements).values({
    propertyId: property.id,
    title: "Pool maintenance — March 18",
    body: "The community pool will close for resurfacing on March 18 from 8 AM–4 PM. Thank you for your patience.",
  });

  await db.insert(documents).values([
    {
      tenantId: existingTenant.id,
      title: "Signed lease agreement",
      category: "lease",
      fileName: "lease-agreement.txt",
      storageKey: "lease-agreement.txt",
    },
    {
      tenantId: existingTenant.id,
      title: "Move-in condition report",
      category: "other",
      fileName: "move-in-report.txt",
      storageKey: "move-in-report.txt",
    },
    {
      propertyId: property.id,
      title: "Community policies handbook",
      category: "policy",
      fileName: "community-policies.txt",
      storageKey: "community-policies.txt",
    },
  ]);

  const [thread] = await db
    .insert(messageThreads)
    .values({
      tenantId: existingTenant.id,
      subject: "Question about parking pass",
    })
    .returning();

  await db.insert(messages).values([
    {
      threadId: thread.id,
      senderId: existingTenant.id,
      body: "Hi — could I get a second visitor parking pass for my guest this weekend?",
    },
    {
      threadId: thread.id,
      senderId: existingStaff.id,
      body: "Absolutely. Stop by the office with your unit number and we can issue one at the front desk.",
    },
  ]);

  console.log("\nDemo accounts:");
  console.log("  Tenant: alex.jordan@example.com / resident123");
  console.log("  Staff:  office@oakview.example.com / staff123\n");
}

main()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
