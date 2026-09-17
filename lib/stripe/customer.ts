import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";

export async function getOrCreateStripeCustomer(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.stripeCustomerId) {
    return { customerId: user.stripeCustomerId, user };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { tenantId: user.id },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, user.id));

  return { customerId: customer.id, user: { ...user, stripeCustomerId: customer.id } };
}
