import { db } from './db';
import { getPlanItems, createDeliverable } from './db-queries';

// How many months between generations for each billing cycle
const CYCLE_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
  'bi-weekly': 1, // sub-monthly — generate every month, cron can't go finer
  weekly: 1,
};

/** Whole-month difference between two dates (negative = start is in the future) */
function monthsSince(startDate: Date, now: Date): number {
  return (
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  );
}

/**
 * Is it time to generate deliverables for this billing period?
 *
 * Examples (start = Feb 1):
 *   monthly   → true every month
 *   quarterly → true in Feb, May, Aug, Nov
 *   yearly    → true in Feb each year
 */
export function isDuePeriod(
  startDate: Date,
  billingCycle: string,
  now: Date = new Date()
): boolean {
  const months = monthsSince(startDate, now);
  if (months < 0) return false; // client hasn't started yet
  const cycleLengthMonths = CYCLE_MONTHS[billingCycle] ?? 1;
  return months % cycleLengthMonths === 0;
}

/**
 * Generate deliverables for one client plan for the given reference month.
 *
 * - Respects billing cycle (quarterly clients only get deliverables every 3 months)
 * - Expands qty (Photo × 2 → "Photo #1", "Photo #2")
 * - Idempotent: skips if deliverables already exist for this client+plan+month
 *
 * Returns the number of deliverables created (0 if skipped).
 */
export async function generateDeliverablesForClientPlan(
  clientPlan: {
    client_id: string;
    plan_id: string;
    agency_id: string;
    start_date: string | Date;
    billing_cycle: string;
  },
  referenceDate: Date = new Date()
): Promise<number> {
  const startDate = new Date(clientPlan.start_date);

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

  let created = 0;
  for (const item of planItems) {
    const qty = item.qty ?? 1;
    for (let i = 0; i < qty; i++) {
      const title =
        qty > 1
          ? `${item.deliverable_type} #${i + 1}`
          : item.deliverable_type;

      await createDeliverable({
        agencyId: clientPlan.agency_id,
        clientId: clientPlan.client_id,
        planId: clientPlan.plan_id,
        title,
        monthYear,
        dueDate,
      });
      created++;
    }
  }

  return created;
}
