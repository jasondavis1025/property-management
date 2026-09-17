import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { fulfillRentPayment } from "@/lib/payments/fulfill-rent-payment";
import { getStripe } from "@/lib/stripe/client";
import {
  paymentMethodLabel,
  rentMetadataFromPaymentIntent,
} from "@/lib/stripe/payment-intent-meta";

async function handleSetupCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "setup" || session.metadata?.purpose !== "autopay") {
    return;
  }

  const tenantId = session.metadata.tenantId;
  if (!tenantId || !session.customer || !session.setup_intent) {
    return;
  }

  const stripe = getStripe();
  const setupIntent = await stripe.setupIntents.retrieve(
    typeof session.setup_intent === "string"
      ? session.setup_intent
      : session.setup_intent.id,
  );

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) {
    return;
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
}

async function handlePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  status: "completed" | "processing" | "failed",
) {
  const meta = rentMetadataFromPaymentIntent(paymentIntent);
  if (!meta) {
    return;
  }

  await fulfillRentPayment({
    invoiceId: meta.invoiceId,
    tenantId: meta.tenantId,
    leaseId: meta.leaseId,
    amountCents: paymentIntent.amount_received || paymentIntent.amount,
    stripePaymentIntentId: paymentIntent.id,
    method: paymentMethodLabel(paymentIntent),
    status,
    reference: paymentIntent.id,
  });
}

async function handleCheckoutPaymentCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment" || !session.metadata?.invoiceId) {
    return;
  }

  if (session.payment_status === "paid" && session.payment_intent) {
    const stripe = getStripe();
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    await handlePaymentIntent(paymentIntent, "completed");
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "setup") {
        await handleSetupCheckoutCompleted(session);
      } else {
        await handleCheckoutPaymentCompleted(session);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutPaymentCompleted(session);
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntent(paymentIntent, "completed");
      break;
    }
    case "payment_intent.processing": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntent(paymentIntent, "processing");
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntent(paymentIntent, "failed");
      break;
    }
    default:
      break;
  }
}
