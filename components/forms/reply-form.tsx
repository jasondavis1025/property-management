"use client";

import { useActionState } from "react";
import { replyToThreadAction, type MessageActionState } from "@/lib/actions/messages";

const initial: MessageActionState = {};

export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState(replyToThreadAction, initial);

  return (
    <form action={action} className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4">
      <input type="hidden" name="threadId" value={threadId} />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Write a reply…"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Reply"}
      </button>
    </form>
  );
}
