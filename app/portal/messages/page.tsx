import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { NewMessageForm } from "@/components/forms/new-message-form";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { getMessageThreadsForTenant } from "@/lib/data/tenant";
import { formatDateTime } from "@/lib/format";

export default async function MessagesPage() {
  const session = await requireTenantSession();
  const threads = await getMessageThreadsForTenant(session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Messages</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Contact the leasing office about billing, maintenance, or general questions.
        </p>
      </div>

      <Card>
        <CardTitle>New conversation</CardTitle>
        <div className="mt-4">
          <NewMessageForm />
        </div>
      </Card>

      <Card>
        <CardTitle>Inbox</CardTitle>
        {threads.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No messages yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={`/portal/messages/${thread.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">{thread.subject}</span>
                  <span className="text-zinc-500">
                    {formatDateTime(thread.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
