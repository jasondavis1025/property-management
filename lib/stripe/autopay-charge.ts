import { and, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { leases, payments, rentInvoices, users } from "@/lib/db/schema";
import { fulfillRentPayment } from "@/lib/payments/fulfill-rent-payment";
import { syncOverdueInvoicesForLeases } from "@/lib/rent-invoices";
import { getStripe } from "@/lib/stripe/client";
import { paymentMethodLabel } from "@/lib/stripe/payment-intent-meta";

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function runAutoPayCharges() {
  const tenants = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, "tenant"),
        eq(users.autoPayEnabled, true),
      ),
    );

  const results: { tenantId: string; invoiceId: string; outcome: string }[] = [];

  for (const tenant of tenants) {
    if (!tenant.stripeCustomerId || !tenant.autoPayPaymentMethodId) {
      results.push({
        tenantId: tenant.id,
        invoiceId: "-",
        outcome: "skipped_missing_stripe",
      });
      continue;
    }

    const leaseRows = await db
      .select({ id: leases.id })
      .from(leases)
      .where(and(eq(leases.tenantId, tenant.id), eq(leases.status, "active")));

    const leaseIds = leaseRows.map((r) => r.id);
    if (leaseIds.length === 0) continue;

    await syncOverdueInvoicesForLeases(leaseIds);

    const dueInvoices = await db
      .select()
      .from(rentInvoices)
      .where(
        and(
          inArray(rentInvoices.leaseId, leaseIds),
          inArray(rentInvoices.status, ["pending", "overdue"]),
          lte(rentInvoices.dueDate, endOfToday()),
        ),
      );

    for (const invoice of dueInvoices) {
      const [lease] = await db
        .select()
        .from(leases)
        .where(eq(leases.id, invoice.leaseId))
        .limit(1);

      if (!lease) continue;

      const [openPayment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.invoiceId, invoice.id),
            inArray(payments.status, ["completed", "processing"]),
          ),
        )
        .limit(1);

      if (openPayment) {
        results.push({
          tenantId: tenant.id,
          invoiceId: invoice.id,
          outcome: "skipped_already_paid_or_processing",
        });
        continue;
      }

      const stripe = getStripe();

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: invoice.amountCents,
          currency: "usd",
          customer: tenant.stripeCustomerId,
          payment_method: tenant.autoPayPaymentMethodId,
          off_session: true,
          confirm: true,
          metadata: {
            invoiceId: invoice.id,
            tenantId: tenant.id,
            leaseId: lease.id,
            autopay: "true",
          },
        });

        if (paymentIntent.status === "succeeded") {
          await fulfillRentPayment({
            invoiceId: invoice.id,
            tenantId: tenant.id,
            leaseId: lease.id,
            amountCents: paymentIntent.amount_received,
            stripePaymentIntentId: paymentIntent.id,
            method: paymentMethodLabel(paymentIntent),
            status: "completed",
          });
          results.push({
            tenantId: tenant.id,
            invoiceId: invoice.id,
            outcome: "succeeded",
          });
        } else if (paymentIntent.status === "processing") {
          await fulfillRentPayment({
            invoiceId: invoice.id,
            tenantId: tenant.id,
            leaseId: lease.id,
            amountCents: paymentIntent.amount,
            stripePaymentIntentId: paymentIntent.id,
            method: paymentMethodLabel(paymentIntent),
            status: "processing",
          });
          results.push({
            tenantId: tenant.id,
            invoiceId: invoice.id,
            outcome: "processing",
          });
        } else {
          results.push({
            tenantId: tenant.id,
            invoiceId: invoice.id,
            outcome: `status_${paymentIntent.status}`,
          });
        }
      } catch (err) {
        console.error("Auto-pay charge failed:", tenant.id, invoice.id, err);
        results.push({
          tenantId: tenant.id,
          invoiceId: invoice.id,
          outcome: "error",
        });
      }
    }
  }

  return results;
}
