"use client";

import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-900">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          placeholder="you@example.com"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-900">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
