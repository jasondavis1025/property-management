import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { ReplyForm } from "@/components/forms/reply-form";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { getMessagesInThread } from "@/lib/data/tenant";
import { formatDateTime } from "@/lib/format";

export default async function MessageThreadPage({
  params,
}: PageProps<"/portal/messages/[threadId]">) {
  const session = await requireTenantSession();
  const { threadId } = await params;
  const data = await getMessagesInThread(threadId, session.userId);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/portal/messages"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Back to inbox
      </Link>
      <Card>
        <CardTitle>{data.thread.subject}</CardTitle>
        <ul className="mt-4 space-y-4">
          {data.messages.map(({ message, sender }) => {
            const isTenant = sender.id === session.userId;
            return (
              <li
                key={message.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  isTenant ? "bg-teal-50 text-zinc-800" : "bg-zinc-100 text-zinc-800"
                }`}
              >
                <p className="text-xs font-medium text-zinc-500">
                  {sender.firstName} {sender.lastName} ·{" "}
                  {formatDateTime(message.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
              </li>
            );
          })}
        </ul>
        <ReplyForm threadId={data.thread.id} />
      </Card>
    </div>
  );
}
