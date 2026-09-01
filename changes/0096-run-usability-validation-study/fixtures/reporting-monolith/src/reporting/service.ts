// Reporting module — the seam this codebase needs to separate. It reaches
// directly into billing's module (an in-process import, not an API call) to
// build its summary: the two concerns share a deploy, a process, and a
// release cycle today.
import { listInvoices } from "../billing/service.js";

export interface Summary {
  totalInvoices: number;
  paidAmountCents: number;
  openAmountCents: number;
  tenants: string[];
}

export function getSummary(): Summary {
  const invoices = listInvoices();
  const paidAmountCents = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amountCents, 0);
  const openAmountCents = invoices.filter((i) => i.status === "open").reduce((sum, i) => sum + i.amountCents, 0);
  const tenants = [...new Set(invoices.map((i) => i.tenantId))];
  return { totalInvoices: invoices.length, paidAmountCents, openAmountCents, tenants };
}
