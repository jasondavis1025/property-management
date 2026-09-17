import { Card, CardTitle } from "@/components/ui/card";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import {
  getActiveLeaseForTenant,
  getDocumentsForTenant,
} from "@/lib/data/tenant";
import { formatDate } from "@/lib/format";

export default async function DocumentsPage() {
  const session = await requireTenantSession();
  const leaseContext = await getActiveLeaseForTenant(session.userId);
  const docs = await getDocumentsForTenant(
    session.userId,
    leaseContext?.property.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Documents</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Download your lease, receipts, and community notices.
        </p>
      </div>

      <Card>
        <CardTitle>Available files</CardTitle>
        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No documents on file yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">{doc.title}</p>
                  <p className="text-zinc-500 capitalize">
                    {doc.category.replace("_", " ")} · Uploaded{" "}
                    {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                <a
                  href={`/api/documents/${doc.id}`}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-teal-700 hover:bg-zinc-50"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
