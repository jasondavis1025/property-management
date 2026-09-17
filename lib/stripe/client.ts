import Stripe from "stripe";

let stripe: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
}

export function getCheckoutPaymentMethodTypes(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const raw = process.env.STRIPE_PAYMENT_METHODS ?? "card,us_bank_account";
  return raw.split(",").map((s) => s.trim()) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
}
