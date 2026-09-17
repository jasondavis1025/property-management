import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { leases, rentInvoices } from "@/lib/db/schema";
import { addMonths, startOfMonth } from "@/scripts/date-utils";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function syncOverdueInvoicesForLeases(leaseIds: string[]) {
  if (leaseIds.length === 0) return;

  await db
    .update(rentInvoices)
    .set({ status: "overdue" })
    .where(
      and(
        inArray(rentInvoices.leaseId, leaseIds),
        eq(rentInvoices.status, "pending"),
        lt(rentInvoices.dueDate, startOfToday()),
      ),
    );
}

export async function syncOverdueInvoicesForTenant(userId: string) {
  const leaseRows = await db
    .select({ id: leases.id })
    .from(leases)
    .where(eq(leases.tenantId, userId));

  await syncOverdueInvoicesForLeases(leaseRows.map((r) => r.id));
}

export async function ensureNextRentInvoice(leaseId: string) {
  const [lease] = await db
    .select()
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (!lease || lease.status !== "active") return;

  const open = await db
    .select({ id: rentInvoices.id })
    .from(rentInvoices)
    .where(
      and(
        eq(rentInvoices.leaseId, leaseId),
        inArray(rentInvoices.status, ["pending", "overdue"]),
      ),
    )
    .limit(1);

  if (open.length > 0) return;

  const latest = await db
    .select()
    .from(rentInvoices)
    .where(eq(rentInvoices.leaseId, leaseId))
    .orderBy(desc(rentInvoices.dueDate))
    .limit(1);

  const baseDue = latest[0]?.dueDate ?? startOfMonth(new Date());
  const nextDue = addMonths(startOfMonth(baseDue), 1);

  await db.insert(rentInvoices).values({
    leaseId,
    dueDate: nextDue,
    amountCents: lease.monthlyRentCents,
    status: "pending",
    description: `Rent — ${nextDue.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
  });
}
