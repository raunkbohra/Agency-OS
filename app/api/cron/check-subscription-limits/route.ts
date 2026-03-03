// app/api/cron/check-subscription-limits/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  countAgencyClients,
  countAgencyPlans,
  countAgencyTeamMembers,
} from '@/lib/db-queries';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all agencies with active subscriptions
    const result = await db.query(`
      SELECT DISTINCT a.id, s.tier, s.max_clients, s.max_plans, s.max_team_members, s.status
      FROM agencies a
      JOIN agency_subscriptions s ON a.id = s.agency_id
      WHERE s.status IN ('active', 'past_due')
    `);

    const agencies = result.rows;
    let checked = 0;
    let warned = 0;
    let blocked = 0;

    for (const agency of agencies) {
      checked++;

      const clientCount = await countAgencyClients(agency.id);
      const planCount = await countAgencyPlans(agency.id);
      const teamCount = await countAgencyTeamMembers(agency.id);

      // Check if exceeds limits
      if (agency.max_clients && clientCount > agency.max_clients) {
        warned++;
        console.log(`Agency ${agency.id} exceeded client limit: ${clientCount}/${agency.max_clients}`);
      }

      if (agency.max_plans && planCount > agency.max_plans) {
        warned++;
        console.log(`Agency ${agency.id} exceeded plan limit: ${planCount}/${agency.max_plans}`);
      }

      if (agency.max_team_members && teamCount > agency.max_team_members) {
        warned++;
        console.log(`Agency ${agency.id} exceeded team limit: ${teamCount}/${agency.max_team_members}`);
      }

      // Check unpaid status (14+ days overdue)
      if (agency.status === 'past_due') {
        const subscription = await db.query(
          `SELECT updated_at FROM agency_subscriptions WHERE agency_id = $1`,
          [agency.id]
        );

        if (subscription.rows.length > 0) {
          const pastDueDate = new Date(subscription.rows[0].updated_at);
          const daysSincePastDue = Math.floor((Date.now() - pastDueDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSincePastDue >= 14) {
            blocked++;
            console.log(`Agency ${agency.id} has been past due for ${daysSincePastDue} days`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked,
      warned,
      blocked,
      message: `Checked ${checked} agencies: ${warned} warnings, ${blocked} blocked`,
    });
  } catch (error) {
    console.error('Subscription limit check error:', error);
    return NextResponse.json({ error: 'Failed to check limits' }, { status: 500 });
  }
}
