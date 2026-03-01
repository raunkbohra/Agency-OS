import { db } from '@/lib/db';
import { getPlanItems, createDeliverable } from '@/lib/db-queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get all active client plans
    const result = await db.query(
      `SELECT cp.*, c.id as client_id, c.agency_id, p.id as plan_id
       FROM client_plans cp
       JOIN clients c ON cp.client_id = c.id
       JOIN plans p ON cp.plan_id = p.id
       WHERE cp.status = 'active'`
    );

    const clientPlans = result.rows;
    let created = 0;

    for (const clientPlan of clientPlans) {
      try {
        // Check if deliverables already exist for this month
        const existing = await db.query(
          `SELECT id FROM deliverables WHERE client_id = $1 AND month_year = $2`,
          [clientPlan.client_id, monthYear]
        );

        if (existing.rows.length === 0) {
          const planItems = await getPlanItems(clientPlan.plan_id);
          const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          for (const item of planItems) {
            await createDeliverable({
              agencyId: clientPlan.agency_id,
              clientId: clientPlan.client_id,
              planId: clientPlan.plan_id,
              title: item.deliverable_type,
              monthYear,
              dueDate,
            });
            created++;
          }
        }
      } catch (planError) {
        console.error(`Failed to generate deliverables for client ${clientPlan.client_id}:`, planError);
        // Continue with next client plan
      }
    }

    return Response.json({
      success: true,
      message: `Created ${created} deliverables for ${monthYear}`,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ error: 'Failed to generate deliverables' }, { status: 500 });
  }
}
