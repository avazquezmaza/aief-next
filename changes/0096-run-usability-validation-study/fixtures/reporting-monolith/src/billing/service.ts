// Billing module — unrelated concern, kept minimal. Present so this reads as a
// real monolith with more than one responsibility, not a single-purpose app.
export interface Invoice {
  id: number;
  tenantId: string;
  amountCents: number;
  status: "open" | "paid";
}

const invoices: Invoice[] = [
  { id: 1, tenantId: "tenant-a", amountCents: 12000, status: "paid" },
  { id: 2, tenantId: "tenant-a", amountCents: 8000, status: "open" },
  { id: 3, tenantId: "tenant-b", amountCents: 5000, status: "paid" }
];

export function listInvoices(): Invoice[] {
  return invoices;
}
