import type Stripe from "stripe";

export function paymentMethodLabel(
  paymentIntent: Stripe.PaymentIntent,
): "card" | "bank" {
  const type = paymentIntent.payment_method_types?.[0];
  if (type === "us_bank_account" || type === "ach_debit") {
    return "bank";
  }
  return "card";
}

export function rentMetadataFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata?.invoiceId;
  const tenantId = paymentIntent.metadata?.tenantId;
  const leaseId = paymentIntent.metadata?.leaseId;
  if (!invoiceId || !tenantId || !leaseId) {
    return null;
  }
  return { invoiceId, tenantId, leaseId };
}
