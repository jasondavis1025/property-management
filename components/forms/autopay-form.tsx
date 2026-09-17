"use client";

import { useActionState } from "react";
import {
  createAutoPaySetupSessionAction,
  disableAutoPayAction,
  type StripeActionState,
} from "@/lib/actions/stripe";

const initial: StripeActionState = {};

export function AutoPayForm({ enabled }: { enabled: boolean }) {
  const [setupState, setupAction, setupPending] = useActionState(
    createAutoPaySetupSessionAction,
    initial,
  );
  const [disableState, disableAction, disablePending] = useActionState(
    disableAutoPayAction,
    initial,
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        When auto-pay is on, rent is charged on the due date to your saved card or
        bank account (bank debits may take a few days to settle).
      </p>
      {enabled ? (
        <>
          <p className="text-sm font-medium text-emerald-800">Auto-pay is enabled.</p>
          <form action={disableAction}>
            <button
              type="submit"
              disabled={disablePending}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
            >
              {disablePending ? "Turning off…" : "Turn off auto-pay"}
            </button>
          </form>
          {disableState.error ? (
            <p className="text-sm text-red-600">{disableState.error}</p>
          ) : null}
        </>
      ) : (
        <>
          <form action={setupAction}>
            <button
              type="submit"
              disabled={setupPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {setupPending ? "Redirecting…" : "Set up auto-pay"}
            </button>
          </form>
          {setupState.error ? (
            <p className="text-sm text-red-600">{setupState.error}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
