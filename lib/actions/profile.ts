"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const profileSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(30).optional(),
});

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireTenantSession();
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please check your profile details." };
  }

  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone ?? null,
    })
    .where(eq(users.id, session.userId));

  revalidatePath("/portal/profile");
  revalidatePath("/portal");

  return { success: "Profile updated." };
}
