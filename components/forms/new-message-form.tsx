"use client";

import { useActionState } from "react";
import {
  createMessageThreadAction,
  type MessageActionState,
} from "@/lib/actions/messages";

const initial: MessageActionState = {};

export function NewMessageForm() {
  const [state, action, pending] = useActionState(createMessageThreadAction, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900">Subject</span>
        <input
          name="subject"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900">Message</span>
        <textarea
          name="body"
          required
          rows={4}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
