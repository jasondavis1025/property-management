"use client";

import { useActionState } from "react";
import {
  submitMaintenanceAction,
  type MaintenanceActionState,
} from "@/lib/actions/maintenance";

const initial: MaintenanceActionState = {};

export function MaintenanceForm() {
  const [state, action, pending] = useActionState(submitMaintenanceAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-900">Category</span>
          <select
            name="category"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            defaultValue="Plumbing"
          >
            <option>Plumbing</option>
            <option>Electrical</option>
            <option>HVAC</option>
            <option>Appliance</option>
            <option>Pest control</option>
            <option>Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-900">Priority</span>
          <select
            name="priority"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            defaultValue="normal"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900">Title</span>
        <input
          name="title"
          required
          minLength={3}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          placeholder="Brief summary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900">Description</span>
        <textarea
          name="description"
          required
          minLength={10}
          rows={4}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          placeholder="Describe the issue and when staff can enter if needed."
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-900">
        <input type="checkbox" name="permissionToEnter" defaultChecked />
        <span>Permission to enter if I am not home</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
