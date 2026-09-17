"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { db } from "@/lib/db";
import { maintenanceRequests } from "@/lib/db/schema";
import { getActiveLeaseForTenant } from "@/lib/data/tenant";

const maintenanceSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  priority: z.enum(["low", "normal", "urgent", "emergency"]),
  permissionToEnter: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type MaintenanceActionState = {
  error?: string;
  success?: string;
};

export async function submitMaintenanceAction(
  _prev: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const session = await requireTenantSession();
  const leaseContext = await getActiveLeaseForTenant(session.userId);

  if (!leaseContext) {
    return { error: "No active lease found for your account." };
  }

  const parsed = maintenanceSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    permissionToEnter: formData.get("permissionToEnter"),
  });

  if (!parsed.success) {
    return { error: "Please complete all required fields." };
  }

  await db.insert(maintenanceRequests).values({
    tenantId: session.userId,
    unitId: leaseContext.unit.id,
    category: parsed.data.category,
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    permissionToEnter: parsed.data.permissionToEnter,
    status: "submitted",
  });

  revalidatePath("/portal/maintenance");
  revalidatePath("/portal");

  return { success: "Maintenance request submitted. Property staff will follow up soon." };
}
