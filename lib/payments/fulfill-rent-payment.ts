import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, rentInvoices } from "@/lib/db/schema";
import { ensureNextRentInvoice } from "@/lib/rent-invoices";

export type FulfillRentPaymentInput = {
  invoiceId: string;
  tenantId: string;
  leaseId: string;
  amountCents: number;
  stripePaymentIntentId: string;
  method: string;
  status: "completed" | "processing" | "failed";
  reference?: string;
};

export async function fulfillRentPayment(input: FulfillRentPaymentInput) {
  const [existing] = await db
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, input.stripePaymentIntentId))
    .limit(1);

  if (existing?.status === "completed") {
    return { ok: true as const, duplicate: true };
  }

  const [invoice] = await db
    .select()
    .from(rentInvoices)
    .where(eq(rentInvoices.id, input.invoiceId))
    .limit(1);

  if (!invoice) {
    return { ok: false as const, reason: "invoice_not_found" };
  }

  if (invoice.status === "paid" && input.status === "completed") {
    return { ok: true as const, duplicate: true };
  }

  if (existing) {
    if (input.status === "completed") {
      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({ status: "completed", method: input.method })
          .where(eq(payments.id, existing.id));

        await tx
          .update(rentInvoices)
          .set({ status: "paid", paidAt: new Date() })
          .where(eq(rentInvoices.id, input.invoiceId));
      });
      await ensureNextRentInvoice(input.leaseId);
    }
    return { ok: true as const, duplicate: false };
  }

  await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      invoiceId: input.invoiceId,
      tenantId: input.tenantId,
      amountCents: input.amountCents,
      method: input.method,
      status: input.status,
      reference: input.reference ?? input.stripePaymentIntentId,
      stripePaymentIntentId: input.stripePaymentIntentId,
    });

    if (input.status === "completed") {
      await tx
        .update(rentInvoices)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(rentInvoices.id, input.invoiceId));
    }
  });

  if (input.status === "completed") {
    await ensureNextRentInvoice(input.leaseId);
  }

  return { ok: true as const, duplicate: false };
}
