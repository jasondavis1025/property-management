import { Card, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/profile-form";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { getActiveLeaseForTenant, getTenantProfile } from "@/lib/data/tenant";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function ProfilePage() {
  const session = await requireTenantSession();
  const [profile, leaseContext] = await Promise.all([
    getTenantProfile(session.userId),
    getActiveLeaseForTenant(session.userId),
  ]);

  if (!profile) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Update your contact details and review lease information.
        </p>
      </div>

      <Card>
        <CardTitle>Contact information</CardTitle>
        <div className="mt-4">
          <ProfileForm
            email={profile.email}
            firstName={profile.firstName}
            lastName={profile.lastName}
            phone={profile.phone}
          />
        </div>
      </Card>

      {leaseContext ? (
        <Card>
          <CardTitle>Lease summary</CardTitle>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Unit</dt>
              <dd className="font-medium text-zinc-900">
                {leaseContext.unit.unitNumber}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Monthly rent</dt>
              <dd className="font-medium text-zinc-900">
                {formatCurrency(leaseContext.lease.monthlyRentCents)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Lease start</dt>
              <dd className="font-medium text-zinc-900">
                {formatDate(leaseContext.lease.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Lease end</dt>
              <dd className="font-medium text-zinc-900">
                {leaseContext.lease.endDate
                  ? formatDate(leaseContext.lease.endDate)
                  : "—"}
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
