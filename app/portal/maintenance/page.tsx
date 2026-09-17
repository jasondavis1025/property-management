import { Card, CardTitle } from "@/components/ui/card";
import { MaintenanceForm } from "@/components/forms/maintenance-form";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { getMaintenanceForTenant } from "@/lib/data/tenant";
import { formatDateTime } from "@/lib/format";
import { maintenanceStatusBadge } from "@/lib/status-badges";

export default async function MaintenancePage() {
  const session = await requireTenantSession();
  const requests = await getMaintenanceForTenant(session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Maintenance</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Submit repair requests and track status updates from property management.
        </p>
      </div>

      <Card>
        <CardTitle>New request</CardTitle>
        <div className="mt-4">
          <MaintenanceForm />
        </div>
      </Card>

      <Card>
        <CardTitle>Your requests</CardTitle>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No requests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {requests.map(({ request, unit }) => (
              <li key={request.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900">{request.title}</p>
                    <p className="text-sm text-zinc-500">
                      {request.category} · Unit {unit.unitNumber} ·{" "}
                      {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                  {maintenanceStatusBadge(request.status)}
                </div>
                <p className="mt-2 text-sm text-zinc-700">{request.description}</p>
                <p className="mt-1 text-xs text-zinc-500 capitalize">
                  Priority: {request.priority.replace("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
