"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/lib/actions/profile";

const initial: ProfileActionState = {};

export function ProfileForm({
  firstName,
  lastName,
  phone,
  email,
}: {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900">Email</span>
        <input
          value={email}
          disabled
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-900">First name</span>
          <input
            name="firstName"
            defaultValue={firstName}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-900">Last name</span>
          <input
            name="lastName"
            defaultValue={lastName}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900">Phone</span>
        <input
          name="phone"
          defaultValue={phone ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
