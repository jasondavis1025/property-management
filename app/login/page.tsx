import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await getSession();
  if (session?.role === "tenant") {
    redirect("/portal");
  }

  const params = await searchParams;
  const staffNotice = params.error === "staff";

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link href="/" className="mb-8 text-center text-sm text-teal-700 hover:underline">
          ← Oakview Resident Portal
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm scheme-light">
          <h1 className="text-xl font-semibold text-zinc-900">Resident sign in</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Access rent payments, maintenance, documents, and messages.
          </p>
          {staffNotice ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Staff accounts cannot use the resident portal. Sign in with your tenant
              email, or add a property-manager dashboard later.
            </p>
          ) : null}
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-6 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            Demo after seeding:{" "}
            <span className="font-mono">alex.jordan@example.com</span> /{" "}
            <span className="font-mono">resident123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
