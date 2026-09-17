import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { fulfillRentPayment } from "@/lib/payments/fulfill-rent-payment";
import { getStripe } from "@/lib/stripe/client";
import { paymentMethodLabel } from "@/lib/stripe/payment-intent-meta";

/** Fallback when webhooks are not forwarded (common in local dev). */
export async function syncCheckoutSessionForTenant(
  sessionId: string,
  tenantId: string,
) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.tenantId !== tenantId) {
    return { ok: false as const, reason: "forbidden" };
  }

  if (session.mode === "setup" && session.metadata?.purpose === "autopay") {
    if (session.status !== "complete" || !session.setup_intent) {
      return { ok: false as const, reason: "incomplete" };
    }

    const setupIntent = await stripe.setupIntents.retrieve(
      typeof session.setup_intent === "string"
        ? session.setup_intent
        : session.setup_intent.id,
    );
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (!paymentMethodId || !session.customer) {
      return { ok: false as const, reason: "no_payment_method" };
    }

    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer.id;

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        autoPayEnabled: true,
        autoPayPaymentMethodId: paymentMethodId,
      })
      .where(eq(users.id, tenantId));

    return { ok: true as const, kind: "autopay" as const };
  }

  if (session.mode === "payment") {
    const invoiceId = session.metadata?.invoiceId;
    const leaseId = session.metadata?.leaseId;
    if (!invoiceId || !leaseId) {
      return { ok: false as const, reason: "missing_metadata" };
    }

    if (session.payment_status !== "paid" || !session.payment_intent) {
      return { ok: false as const, reason: "not_paid_yet" };
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    await fulfillRentPayment({
      invoiceId,
      tenantId,
      leaseId,
      amountCents: paymentIntent.amount_received,
      stripePaymentIntentId: paymentIntent.id,
      method: paymentMethodLabel(paymentIntent),
      status: "completed",
    });

    return { ok: true as const, kind: "payment" as const };
  }

  return { ok: false as const, reason: "unknown_mode" };
}
