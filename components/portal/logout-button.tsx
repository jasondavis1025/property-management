"use client";

import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Sign out
      </button>
    </form>
  );
}
