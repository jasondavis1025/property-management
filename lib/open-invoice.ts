import type { RentInvoice } from "@/lib/db/schema";

export function pickOpenRentInvoice(invoices: RentInvoice[]) {
  return invoices.find(
    (inv) => inv.status === "pending" || inv.status === "overdue",
  );
}
