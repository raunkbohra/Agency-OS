import { db } from '@/lib/db';
import {
  getPlanItems,
  createScopeAlert,
  getScopeAlertsByClient
} from '@/lib/db-queries';

export async function checkForScopeCreep(
  clientId: string,
  agencyId: string,
  clientPlanId: string
): Promise<void> {
  try {
    // Get plan items (planned deliverables)
    const planResult = await db.query(
      `SELECT id FROM plans WHERE id IN (
        SELECT plan_id FROM client_plans WHERE id = $1
      )`,
      [clientPlanId]
    );

    if (planResult.rows.length === 0) return;

    const planId = planResult.rows[0].id;
    const planItems = await getPlanItems(planId);

    // Get deliverable item counts grouped by plan_item_id and existing alerts (in parallel)
    const [itemCountsResult, existingAlerts] = await Promise.all([
      db.query(
        `SELECT di.plan_item_id, COUNT(*) as actual_count
         FROM deliverable_items di
         JOIN deliverables d ON di.deliverable_id = d.id
         WHERE d.client_id = $1 AND d.agency_id = $2
         AND di.plan_item_id IS NOT NULL
         GROUP BY di.plan_item_id`,
        [clientId, agencyId]
      ),
      getScopeAlertsByClient(clientId, agencyId, false),
    ]);

    // Build map of actual item counts by plan_item_id
    const actualCountByPlanItem = new Map<string, number>();
    itemCountsResult.rows.forEach((row: any) => {
      actualCountByPlanItem.set(row.plan_item_id, parseInt(row.actual_count));
    });

    // For each plan item, compare actual vs planned qty
    for (const planItem of planItems) {
      const planned = planItem.qty ?? 1;
      const actual = actualCountByPlanItem.get(planItem.id) || 0;

      // Check threshold: >50% overage
      if (planned > 0) {
        const overage = (actual - planned) / planned;

        if (overage > 0.5) {
          // Check if alert already exists
          const alertExists = existingAlerts.some(
            a => a.deliverable_id === planItem.id && a.status === 'active'
          );

          if (!alertExists) {
            await createScopeAlert({
              agencyId,
              clientId,
              deliverableId: planItem.id,
              alertType: 'over_scope',
              thresholdExceeded: overage
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Scope check error:', error);
  }
}
