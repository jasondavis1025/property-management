"use client";

import { useActionState } from "react";
import {
  createRentCheckoutSessionAction,
  type StripeActionState,
} from "@/lib/actions/stripe";
import { formatCurrency } from "@/lib/format";

const initial: StripeActionState = {};

export function PayRentForm({
  invoiceId,
  amountCents,
}: {
  invoiceId: string;
  amountCents: number;
}) {
  const [state, action, pending] = useActionState(
    createRentCheckoutSessionAction,
    initial,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <p className="text-sm text-zinc-600">
        You&apos;ll complete payment on Stripe&apos;s secure page (card or US bank
        account).
      </p>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {pending ? "Redirecting…" : `Pay ${formatCurrency(amountCents)} with Stripe`}
      </button>
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
