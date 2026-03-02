import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getClientById, getClientPlansByClient } from '@/lib/db-queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const result = await db.query(
      `SELECT cp.id as client_plan_id, cp.plan_id, cp.status, p.name as plan_name
       FROM client_plans cp
       JOIN plans p ON cp.plan_id = p.id
       JOIN clients c ON cp.client_id = c.id
       WHERE cp.client_id = $1 AND c.agency_id = $2
       ORDER BY cp.created_at DESC`,
      [id, session.user.agencyId]
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error('Error fetching client plans:', error);
    return Response.json({ error: 'Failed to fetch client plans' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = await getClientById(id);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (client.agency_id !== session.user.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, status } = body;

    // Get current client plan
    const clientPlans = await getClientPlansByClient(id);
    if (clientPlans.length === 0) {
      return NextResponse.json(
        { error: 'Client has no active plan' },
        { status: 400 }
      );
    }

    const currentPlan = clientPlans[0];

    // Update the plan_id and status in the client_plans table
    const result = await db.query(
      'UPDATE client_plans SET plan_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [planId, status, currentPlan.id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating client plan:', error);
    return NextResponse.json(
      { error: 'Failed to update client plan' },
      { status: 500 }
    );
  }
}
