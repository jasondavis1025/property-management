"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { clearSession, createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthActionState = {
  error?: string;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password (min 8 characters)." };
  }

  const { email, password } = parsed.data;

  let user;
  try {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
  } catch (err) {
    console.error("Login database error:", err);
    const code =
      err instanceof Error &&
      "cause" in err &&
      err.cause instanceof Error &&
      "code" in err.cause
        ? String((err.cause as NodeJS.ErrnoException).code)
        : null;

    if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
      return {
        error:
          "Cannot reach PostgreSQL. Confirm the server is running in pgAdmin, then check DATABASE_URL in .env.local (port is usually 5432; encode special characters in your password, e.g. @ as %40).",
      };
    }

    return {
      error:
        "Sign-in failed due to a database error. Run npm run db:push and npm run db:seed, then try again.",
    };
  }

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  if (user.role !== "tenant") {
    return {
      error: "This login is for residents only. Staff accounts use a separate admin portal (not included in this demo).",
    };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  redirect("/portal");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
