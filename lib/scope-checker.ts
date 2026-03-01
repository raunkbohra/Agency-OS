import { db } from '@/lib/db';
import {
  getPlanItems,
  getDeliverablesByClient,
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

    // Get actual deliverables
    const deliverables = await getDeliverablesByClient(clientId, agencyId);

    // For each plan item, count actual deliverables
    for (const planItem of planItems) {
      const planned = 1; // Each plan_item represents 1 planned deliverable
      const actual = deliverables.filter(
        d => d.title.includes(planItem.deliverable_type)
      ).length;

      // Check threshold: >50% overage
      const overage = (actual - planned) / planned;

      if (overage > 0.5) {
        // Check if alert already exists
        const existing = await getScopeAlertsByClient(clientId, agencyId, false);
        const alertExists = existing.some(
          a => a.deliverable_id === planItem.id && a.status === 'active'
        );

        if (!alertExists) {
          // Create alert
          await createScopeAlert({
            agencyId,
            clientId,
            deliverableId: planItem.id,
            alertType: 'over_scope',
            thresholdExceeded: overage
          });

          // TODO: Send email notification
        }
      }
    }
  } catch (error) {
    console.error('Scope check error:', error);
  }
}
