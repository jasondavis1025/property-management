import Link from "next/link";
import { LogoutButton } from "@/components/portal/logout-button";
import { PortalSidebar } from "@/components/portal/sidebar";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { getTenantProfile } from "@/lib/data/tenant";

export default async function PortalLayout({
  children,
}: LayoutProps<"/portal">) {
  const session = await requireTenantSession();
  const profile = await getTenantProfile(session.userId);

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 scheme-light">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/portal" className="text-lg font-semibold text-zinc-900">
            Oakview Resident Portal
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-600 sm:inline">
              {profile?.firstName} {profile?.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:items-start">
        <PortalSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
