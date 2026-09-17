"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { db } from "@/lib/db";
import { messageThreads, messages, users } from "@/lib/db/schema";

const newThreadSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(1).max(5000),
});

const replySchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(5000),
});

export type MessageActionState = {
  error?: string;
  success?: string;
  threadId?: string;
};

async function getStaffUserId() {
  const [staff] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "staff"))
    .limit(1);
  return staff?.id ?? null;
}

export async function createMessageThreadAction(
  _prev: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await requireTenantSession();
  const parsed = newThreadSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: "Subject and message are required." };
  }

  const staffId = await getStaffUserId();

  const [thread] = await db
    .insert(messageThreads)
    .values({
      tenantId: session.userId,
      subject: parsed.data.subject,
    })
    .returning();

  await db.insert(messages).values({
    threadId: thread.id,
    senderId: session.userId,
    body: parsed.data.body,
  });

  if (staffId) {
    await db.insert(messages).values({
      threadId: thread.id,
      senderId: staffId,
      body: "Thanks for reaching out. A member of our team will respond shortly during business hours.",
    });
  }

  revalidatePath("/portal/messages");

  return { success: "Message sent.", threadId: thread.id };
}

export async function replyToThreadAction(
  _prev: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await requireTenantSession();
  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: "Could not send reply." };
  }

  const [thread] = await db
    .select()
    .from(messageThreads)
    .where(eq(messageThreads.id, parsed.data.threadId))
    .limit(1);

  if (!thread || thread.tenantId !== session.userId) {
    return { error: "Thread not found." };
  }

  await db.insert(messages).values({
    threadId: thread.id,
    senderId: session.userId,
    body: parsed.data.body,
  });

  await db
    .update(messageThreads)
    .set({ updatedAt: new Date() })
    .where(eq(messageThreads.id, thread.id));

  revalidatePath("/portal/messages");
  revalidatePath(`/portal/messages/${thread.id}`);

  return { success: "Reply sent." };
}
