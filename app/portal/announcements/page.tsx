import { Card, CardTitle } from "@/components/ui/card";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import {
  getActiveLeaseForTenant,
  getAnnouncementsForProperty,
} from "@/lib/data/tenant";
import { formatDateTime } from "@/lib/format";

export default async function AnnouncementsPage() {
  const session = await requireTenantSession();
  const leaseContext = await getActiveLeaseForTenant(session.userId);
  const announcements = leaseContext
    ? await getAnnouncementsForProperty(leaseContext.property.id)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Announcements</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Community updates from your property management team.
        </p>
      </div>

      {!leaseContext ? (
        <Card>
          <p className="text-sm text-zinc-500">No property linked to your account.</p>
        </Card>
      ) : announcements.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">No announcements right now.</p>
        </Card>
      ) : (
        announcements.map((item) => (
          <Card key={item.id}>
            <CardTitle>{item.title}</CardTitle>
            <p className="mt-1 text-xs text-zinc-500">
              Posted {formatDateTime(item.publishedAt)}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
              {item.body}
            </p>
          </Card>
        ))
      )}
    </div>
  );
}
