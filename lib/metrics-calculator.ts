import { db } from '@/lib/db';
import { calculateClientRiskScore } from '@/lib/db-queries';

export interface FinancialMetrics {
  mrr: number;
  arr: number;
  collectionRate: number;
  outstandingValue: number;
}

export interface OperationalMetrics {
  completionPercentage: number;
  onTimePercentage: number;
  avgDaysToComplete: number;
}

export async function calculateFinancialMetrics(agencyId: string): Promise<FinancialMetrics> {
  // MRR: Sum of active client plan prices
  const mrrResult = await db.query(
    `SELECT COALESCE(SUM(p.price), 0) as total FROM client_plans cp
     JOIN plans p ON cp.plan_id = p.id
     WHERE cp.client_id IN (SELECT id FROM clients WHERE agency_id = $1)
     AND cp.status = 'active'`,
    [agencyId]
  );
  const mrr = parseFloat(mrrResult.rows[0].total) || 0;

  // Collection rate
  const collectionResult = await db.query(
    `SELECT
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
      COUNT(*) as total
     FROM invoices WHERE agency_id = $1`,
    [agencyId]
  );
  const collection = collectionResult.rows[0];
  const collectionRate = collection.total > 0 ? (collection.paid / collection.total) * 100 : 0;

  // Outstanding
  const outstandingResult = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM invoices
     WHERE agency_id = $1 AND status != 'paid'`,
    [agencyId]
  );
  const outstandingValue = parseFloat(outstandingResult.rows[0].total) || 0;

  return {
    mrr,
    arr: mrr * 12,
    collectionRate: Math.round(collectionRate),
    outstandingValue
  };
}

export async function calculateOperationalMetrics(agencyId: string): Promise<OperationalMetrics> {
  // Completion percentage
  const completionResult = await db.query(
    `SELECT
      COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
      COUNT(*) as total
     FROM deliverables WHERE agency_id = $1`,
    [agencyId]
  );
  const completion = completionResult.rows[0];
  const completionPercentage = completion.total > 0 ? (completion.done / completion.total) * 100 : 0;

  // On-time delivery
  const onTimeResult = await db.query(
    `SELECT
      COUNT(CASE WHEN updated_at <= due_date THEN 1 END) as ontime,
      COUNT(*) as total
     FROM deliverables WHERE agency_id = $1 AND status = 'done'`,
    [agencyId]
  );
  const onTime = onTimeResult.rows[0];
  const onTimePercentage = onTime.total > 0 ? (onTime.ontime / onTime.total) * 100 : 0;

  // Avg days to complete
  const avgDaysResult = await db.query(
    `SELECT AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days
     FROM deliverables WHERE agency_id = $1 AND status = 'done'`,
    [agencyId]
  );
  const avgDaysToComplete = Math.round(parseFloat(avgDaysResult.rows[0].avg_days) || 0);

  return {
    completionPercentage: Math.round(completionPercentage),
    onTimePercentage: Math.round(onTimePercentage),
    avgDaysToComplete
  };
}
