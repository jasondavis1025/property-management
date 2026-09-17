import { Card, CardTitle } from "@/components/ui/card";
import { AutoPayForm } from "@/components/forms/autopay-form";
import { PayRentForm } from "@/components/forms/pay-rent-form";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { pickOpenRentInvoice } from "@/lib/open-invoice";
import {
  getPaymentsForTenant,
  getRentInvoicesForTenant,
  getTenantProfile,
} from "@/lib/data/tenant";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { syncCheckoutSessionForTenant } from "@/lib/stripe/sync-checkout-session";
import { invoiceStatusBadge } from "@/lib/status-badges";

export default async function PaymentsPage({
  searchParams,
}: PageProps<"/portal/payments">) {
  const session = await requireTenantSession();
  const params = await searchParams;

  if (params.session_id && typeof params.session_id === "string") {
    await syncCheckoutSessionForTenant(params.session_id, session.userId);
  }

  const [profile, invoices, payments] = await Promise.all([
    getTenantProfile(session.userId),
    getRentInvoicesForTenant(session.userId),
    getPaymentsForTenant(session.userId),
  ]);

  const currentInvoice = pickOpenRentInvoice(invoices);

  const notice =
    params.checkout === "success"
      ? "Payment received — thank you!"
      : params.checkout === "cancel"
        ? "Checkout was cancelled."
        : params.autopay === "setup_success"
          ? "Auto-pay is set up. Rent will be charged on the due date."
          : params.autopay === "setup_cancel"
            ? "Auto-pay setup was cancelled."
            : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Pay rent</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Pay with Stripe (card or US bank debit). Enable auto-pay to charge on each
          due date.
        </p>
      </div>

      {notice ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}

      <Card>
        <CardTitle>Auto-pay</CardTitle>
        <div className="mt-4">
          <AutoPayForm enabled={profile?.autoPayEnabled ?? false} />
        </div>
      </Card>

      {currentInvoice ? (
        <Card>
          <CardTitle>Amount due</CardTitle>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {formatCurrency(currentInvoice.amountCents)}
          </p>
          <p className="text-sm text-zinc-600">
            {currentInvoice.description} · Due {formatDate(currentInvoice.dueDate)}
          </p>
          <div className="mt-4">
            <PayRentForm
              invoiceId={currentInvoice.id}
              amountCents={currentInvoice.amountCents}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle>Balance</CardTitle>
          <p className="mt-2 text-sm text-emerald-700">
            No open rent charges. Thank you!
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Invoices</CardTitle>
        <ul className="mt-3 divide-y divide-zinc-100">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-zinc-900">{inv.description}</p>
                <p className="text-zinc-500">Due {formatDate(inv.dueDate)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatCurrency(inv.amountCents)}</span>
                {invoiceStatusBadge(inv.status)}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Payment history</CardTitle>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No payments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {payments.map(({ payment, invoice }) => (
              <li key={payment.id} className="py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-zinc-900">
                    {formatCurrency(payment.amountCents)} — {invoice.description}
                  </span>
                  <span className="text-zinc-500">
                    {formatDateTime(payment.createdAt)}
                  </span>
                </div>
                <p className="text-zinc-500 capitalize">
                  {payment.method} · {payment.status}
                  {payment.reference ? ` · ${payment.reference}` : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
