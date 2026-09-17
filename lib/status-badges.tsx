import { Badge } from "@/components/ui/badge";

export function invoiceStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge variant="success">Paid</Badge>;
    case "overdue":
      return <Badge variant="danger">Overdue</Badge>;
    case "pending":
      return <Badge variant="warning">Due</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function maintenanceStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    case "in_progress":
    case "scheduled":
      return <Badge variant="info">In progress</Badge>;
    case "submitted":
      return <Badge variant="warning">Submitted</Badge>;
    case "cancelled":
      return <Badge variant="default">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
