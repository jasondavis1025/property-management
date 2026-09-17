import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { pickOpenRentInvoice } from "@/lib/open-invoice";
import {
  getActiveLeaseForTenant,
  getMaintenanceForTenant,
  getRentInvoicesForTenant,
  getTenantProfile,
} from "@/lib/data/tenant";
import { formatCurrency, formatDate } from "@/lib/format";
import { invoiceStatusBadge } from "@/lib/status-badges";

export default async function PortalDashboardPage() {
  const session = await requireTenantSession();
  const [profile, leaseContext, invoices, maintenance] = await Promise.all([
    getTenantProfile(session.userId),
    getActiveLeaseForTenant(session.userId),
    getRentInvoicesForTenant(session.userId),
    getMaintenanceForTenant(session.userId),
  ]);

  const currentInvoice = pickOpenRentInvoice(invoices);
  const openMaintenance = maintenance.filter(
    (m) => m.request.status !== "completed" && m.request.status !== "cancelled",
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Welcome back, {profile?.firstName}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage rent, maintenance, documents, and messages in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Unit</CardTitle>
          {leaseContext ? (
            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              <p className="font-medium text-zinc-900">
                {leaseContext.property.name} — Unit {leaseContext.unit.unitNumber}
              </p>
              <p>
                {leaseContext.property.addressLine1}, {leaseContext.property.city},{" "}
                {leaseContext.property.state} {leaseContext.property.zip}
              </p>
              <p>Rent: {formatCurrency(leaseContext.lease.monthlyRentCents)}/mo</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No active lease on file.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Next payment</CardTitle>
          {currentInvoice ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-2xl font-semibold text-zinc-900">
                {formatCurrency(currentInvoice.amountCents)}
              </p>
              <p className="text-zinc-600">
                Due {formatDate(currentInvoice.dueDate)}
              </p>
              {invoiceStatusBadge(currentInvoice.status)}
              <Link
                href="/portal/payments"
                className="mt-2 inline-block text-sm font-medium text-teal-700 hover:underline"
              >
                Pay rent →
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-emerald-700">You&apos;re caught up on rent.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Open maintenance</CardTitle>
          <p className="mt-3 text-3xl font-semibold text-zinc-900">
            {openMaintenance.length}
          </p>
          <Link
            href="/portal/maintenance"
            className="mt-2 inline-block text-sm font-medium text-teal-700 hover:underline"
          >
            View requests →
          </Link>
        </Card>
      </div>

      <Card>
        <CardTitle>Quick links</CardTitle>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["/portal/payments", "View balance & payment history"],
            ["/portal/maintenance", "Submit a maintenance request"],
            ["/portal/documents", "Download lease & notices"],
            ["/portal/messages", "Message the office"],
            ["/portal/announcements", "Community announcements"],
            ["/portal/profile", "Update contact information"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-teal-700 hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
