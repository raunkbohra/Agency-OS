import { db } from './db';
import { getPlanItems } from './db-queries';

// How many months between generations for each billing cycle
const CYCLE_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
  'bi-weekly': 1,
  weekly: 1,
};

/** Whole-month difference between two dates (negative = start is in the future) */
function monthsSince(startDate: Date, now: Date): number {
  return (
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  );
}

/** Total days in a given month */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Is it time to generate deliverables for this billing period?
 * - Quarterly: client starting Feb only generates in Feb, May, Aug, Nov
 * - Yearly: only in the anniversary month
 */
export function isDuePeriod(
  startDate: Date,
  billingCycle: string,
  now: Date = new Date()
): boolean {
  const months = monthsSince(startDate, now);
  if (months < 0) return false;
  const cycleLengthMonths = CYCLE_MONTHS[billingCycle] ?? 1;
  return months % cycleLengthMonths === 0;
}

/**
 * For 'prorated' policy: how many of each deliverable to create for a partial first month.
 * Uses ceiling so clients always get at least 1 of each item they're paying for.
 */
function proratedQty(qty: number, startDate: Date): number {
  const totalDays = daysInMonth(startDate.getFullYear(), startDate.getMonth());
  const remainingDays = totalDays - startDate.getDate() + 1;
  const ratio = remainingDays / totalDays;
  return Math.max(1, Math.ceil(qty * ratio));
}

/** Format a month name from a Date */
function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Generate ONE deliverable bundle per client plan for the given reference month,
 * with deliverable_items for each plan item × qty.
 *
 * Idempotent: skips if deliverables already exist for this client + plan + month_year.
 * Returns number of items created (0 if skipped).
 */
export async function generateDeliverablesForClientPlan(
  clientPlan: {
    client_id: string;
    plan_id: string;
    agency_id: string;
    start_date: string | Date;
    billing_cycle: string;
    billing_start_policy?: 'next_month' | 'prorated';
  },
  referenceDate: Date = new Date()
): Promise<number> {
  const startDate = new Date(clientPlan.start_date);
  const policy = clientPlan.billing_start_policy ?? 'next_month';
  const isFirstPartialMonth =
    monthsSince(startDate, referenceDate) === 0 && startDate.getDate() > 1;

  // next_month policy: skip the partial join month entirely
  if (policy === 'next_month' && isFirstPartialMonth) {
    return 0;
  }

  if (!isDuePeriod(startDate, clientPlan.billing_cycle, referenceDate)) {
    return 0;
  }

  const monthYear = `${referenceDate.getFullYear()}-${String(
    referenceDate.getMonth() + 1
  ).padStart(2, '0')}`;

  // Idempotency — don't double-generate for the same period
  const existing = await db.query(
    `SELECT id FROM deliverables
     WHERE client_id = $1 AND plan_id = $2 AND month_year = $3
     LIMIT 1`,
    [clientPlan.client_id, clientPlan.plan_id, monthYear]
  );
  if (existing.rows.length > 0) return 0;

  const planItems = await getPlanItems(clientPlan.plan_id);
  if (planItems.length === 0) return 0;

  // Due on the last day of the reference month
  const dueDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0
  );

  const bundleTitle = `${formatMonthYear(referenceDate)} Deliverables`;

  // Create the single bundle deliverable
  const bundleResult = await db.query(
    `INSERT INTO deliverables
     (agency_id, client_id, plan_id, title, month_year, due_date, status, is_period_bundle)
     VALUES ($1, $2, $3, $4, $5, $6, 'draft', true)
     RETURNING id`,
    [clientPlan.agency_id, clientPlan.client_id, clientPlan.plan_id, bundleTitle, monthYear, dueDate.toISOString()]
  );
  const bundleId = bundleResult.rows[0].id;

  // Build all items to insert
  const itemsToInsert: Array<{
    title: string;
    plan_item_id: string;
    sort_order: number;
  }> = [];

  let sortOrder = 0;
  for (const item of planItems) {
    const qty =
      policy === 'prorated' && isFirstPartialMonth
        ? proratedQty(item.qty ?? 1, startDate)
        : (item.qty ?? 1);

    for (let i = 0; i < qty; i++) {
      const title =
        qty > 1
          ? `${item.deliverable_type} #${i + 1}`
          : item.deliverable_type;

      itemsToInsert.push({
        title,
        plan_item_id: item.id,
        sort_order: sortOrder++,
      });
    }
  }

  // Batch insert all items
  if (itemsToInsert.length > 0) {
    const values: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    itemsToInsert.forEach((item) => {
      values.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3})`);
      params.push(bundleId, item.title, item.plan_item_id, item.sort_order);
      paramCount += 4;
    });

    await db.query(
      `INSERT INTO deliverable_items (deliverable_id, title, plan_item_id, sort_order)
       VALUES ${values.join(', ')}`,
      params
    );
  }

  return itemsToInsert.length;
}

/**
 * Calculate the first invoice amount and due date based on billing start policy.
 *
 * next_month: full price, due on the 1st of next month
 * prorated:   price × (remaining days / days in month), due end of current month
 */
export function calcFirstInvoice(
  price: number,
  startDate: Date,
  policy: 'next_month' | 'prorated'
): { amount: number; dueDate: Date } {
  if (policy === 'next_month') {
    // Full price, due on 1st of next month
    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
    return { amount: price, dueDate };
  }

  // prorated: proportional to remaining days
  const total = daysInMonth(startDate.getFullYear(), startDate.getMonth());
  const remaining = total - startDate.getDate() + 1;
  const amount = Math.round((price * remaining) / total * 100) / 100;
  const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // last day of month
  return { amount, dueDate };
}
