import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
