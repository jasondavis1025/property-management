"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/portal", label: "Dashboard", exact: true },
  { href: "/portal/payments", label: "Pay rent" },
  { href: "/portal/maintenance", label: "Maintenance" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/announcements", label: "Announcements" },
  { href: "/portal/profile", label: "Profile" },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-1 md:w-56 md:shrink-0">
      <div className="mb-4 px-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Resident Portal
        </p>
        <p className="text-sm text-zinc-500">Oakview Apartments</p>
      </div>
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-700 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
