import { db } from './db';
import { createInvoice, addInvoiceItem } from './db-queries';
import { isDuePeriod, calcFirstInvoice } from './generate-deliverables';

/**
 * Generate an invoice for one client plan for the given reference month.
 *
 * billingStartPolicy:
 *   'next_month' — skip the partial join month entirely; cron will handle next full month
 *   'prorated'   — generate prorated invoice for the remaining days in the join month
 *
 * Idempotent: skips if invoice already exists for this client + plan + billing_period.
 * Returns true if created, false if skipped.
 */
export async function generateInvoiceForClientPlan(
  clientPlan: {
    client_id: string;
    plan_id: string;
    agency_id: string;
    start_date: string | Date;
    billing_cycle: string;
    billing_start_policy: 'next_month' | 'prorated';
    plan_name: string;
    plan_price: number;
  },
  referenceDate: Date = new Date()
): Promise<boolean> {
  const startDate = new Date(clientPlan.start_date);
  const policy = clientPlan.billing_start_policy ?? 'next_month';
  const months = monthsSince(startDate, referenceDate);
  const isFirstPartialMonth = months === 0 && startDate.getDate() > 1;

  // next_month policy: skip the partial join month entirely
  if (policy === 'next_month' && isFirstPartialMonth) {
    return false;
  }

  if (!isDuePeriod(startDate, clientPlan.billing_cycle, referenceDate)) {
    return false;
  }

  const billingPeriod = `${referenceDate.getFullYear()}-${String(
    referenceDate.getMonth() + 1
  ).padStart(2, '0')}`;

  // Idempotency — don't double-generate for the same period
  const existing = await db.query(
    `SELECT id FROM invoices
     WHERE client_id = $1 AND billing_period = $2
     LIMIT 1`,
    [clientPlan.client_id, billingPeriod]
  );
  if (existing.rows.length > 0) return false;

  // Calculate amount and due date based on policy
  let amount: number;
  let dueDate: Date;

  if (policy === 'prorated' && isFirstPartialMonth) {
    // Prorated first invoice
    const { amount: proratedAmount, dueDate: proratedDueDate } = calcFirstInvoice(
      clientPlan.plan_price,
      startDate,
      'prorated'
    );
    amount = proratedAmount;
    dueDate = proratedDueDate;
  } else {
    // Full invoice
    // For 'next_month' policy: due on 1st of next month
    // For 'prorated' on subsequent months: end of month
    dueDate = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0
    ); // last day of the reference month
    amount = clientPlan.plan_price;
  }

  // Create the invoice
  const invoice = await createInvoice(
    clientPlan.agency_id,
    clientPlan.client_id,
    amount,
    dueDate.toISOString()
  );

  // Create invoice item with descriptive label
  const label = `${clientPlan.plan_name} — ${referenceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
  await addInvoiceItem(invoice.id, label, 1, amount);

  // Update the invoice with billing_period
  await db.query('UPDATE invoices SET billing_period = $1 WHERE id = $2', [
    billingPeriod,
    invoice.id,
  ]);

  return true;
}

/** Whole-month difference between two dates (negative = start is in the future) */
function monthsSince(startDate: Date, now: Date): number {
  return (
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  );
}
