import { db } from '@/lib/db';
import { generateDeliverablesForClientPlan } from '@/lib/generate-deliverables';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Join plans + agency so we have billing_cycle, start_date, and billing_start_policy
    const result = await db.query(
      `SELECT cp.id, cp.client_id, cp.start_date,
              c.agency_id,
              p.id as plan_id, p.billing_cycle,
              a.billing_start_policy
       FROM client_plans cp
       JOIN clients c ON cp.client_id = c.id
       JOIN plans p ON cp.plan_id = p.id
       JOIN agencies a ON c.agency_id = a.id
       WHERE cp.status = 'active'`
    );

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of result.rows) {
      try {
        const count = await generateDeliverablesForClientPlan(
          {
            client_id: row.client_id,
            plan_id: row.plan_id,
            agency_id: row.agency_id,
            start_date: row.start_date,
            billing_cycle: row.billing_cycle,
            billing_start_policy: row.billing_start_policy ?? 'next_month',
          },
          now
        );
        if (count > 0) created += count;
        else skipped++;
      } catch (err) {
        const msg = `client ${row.client_id}: ${err instanceof Error ? err.message : 'unknown error'}`;
        console.error('Failed to generate deliverables for', msg);
        errors.push(msg);
      }
    }

    return Response.json({
      success: true,
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      created,
      skipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ error: 'Failed to generate deliverables' }, { status: 500 });
  }
}
