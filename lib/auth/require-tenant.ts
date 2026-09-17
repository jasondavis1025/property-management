import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

export async function requireTenantSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "tenant") {
    redirect("/login?error=staff");
  }
  return session;
}
