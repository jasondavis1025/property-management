"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getInvoiceForTenant } from "@/lib/data/tenant";
import { syncOverdueInvoicesForTenant } from "@/lib/rent-invoices";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import {
  getCheckoutPaymentMethodTypes,
  getStripe,
} from "@/lib/stripe/client";

export type StripeActionState = {
  error?: string;
};

export async function createRentCheckoutSessionAction(
  _prev: StripeActionState,
  formData: FormData,
): Promise<StripeActionState> {
  const session = await requireTenantSession();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) {
    return { error: "Missing invoice." };
  }
  await syncOverdueInvoicesForTenant(session.userId);

  const row = await getInvoiceForTenant(invoiceId, session.userId);
  if (!row) {
    return { error: "Invoice not found." };
  }
  if (row.invoice.status === "paid" || row.invoice.status === "cancelled") {
    return { error: "This invoice is already paid." };
  }

  const { customerId } = await getOrCreateStripeCustomer(session.userId);
  const stripe = getStripe();
  const baseUrl = getAppUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: row.invoice.amountCents,
          product_data: {
            name: row.invoice.description,
          },
        },
        quantity: 1,
      },
    ],
    payment_method_types: getCheckoutPaymentMethodTypes(),
    metadata: {
      invoiceId: row.invoice.id,
      tenantId: session.userId,
      leaseId: row.lease.id,
    },
    payment_intent_data: {
      metadata: {
        invoiceId: row.invoice.id,
        tenantId: session.userId,
        leaseId: row.lease.id,
      },
    },
    success_url: `${baseUrl}/portal/payments?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/portal/payments?checkout=cancel`,
  });

  if (!checkoutSession.url) {
    return { error: "Could not start Stripe Checkout." };
  }

  redirect(checkoutSession.url);
}

export async function createAutoPaySetupSessionAction(
  _prev: StripeActionState,
  _formData: FormData,
): Promise<StripeActionState> {
  const session = await requireTenantSession();
  const { customerId } = await getOrCreateStripeCustomer(session.userId);
  const stripe = getStripe();
  const baseUrl = getAppUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: getCheckoutPaymentMethodTypes(),
    metadata: {
      tenantId: session.userId,
      purpose: "autopay",
    },
    success_url: `${baseUrl}/portal/payments?autopay=setup_success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/portal/payments?autopay=setup_cancel`,
  });

  if (!checkoutSession.url) {
    return { error: "Could not start auto-pay setup." };
  }

  redirect(checkoutSession.url);
}

export async function disableAutoPayAction(
  _prev: StripeActionState,
  _formData: FormData,
): Promise<StripeActionState> {
  const session = await requireTenantSession();

  await db
    .update(users)
    .set({ autoPayEnabled: false })
    .where(eq(users.id, session.userId));

  return {};
}
