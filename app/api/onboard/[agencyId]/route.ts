import { db } from '@/lib/db';
import { createClient, createClientPlan, getPlansByAgency, setClientInviteToken } from '@/lib/db-queries';
import { generateDeliverablesForClientPlan, calcFirstInvoice } from '@/lib/generate-deliverables';
import { sendClientInviteEmail } from '@/lib/email';
import crypto from 'crypto';

export async function GET(req: Request, { params }: { params: Promise<{ agencyId: string }> }) {
  const { agencyId } = await params;
  const agencyResult = await db.query(
    'SELECT id, name FROM agencies WHERE id = $1',
    [agencyId]
  );
  if (!agencyResult.rows[0]) return Response.json({ error: 'Agency not found' }, { status: 404 });

  const plans = await getPlansByAgency(agencyId);

  return Response.json({
    id: agencyResult.rows[0].id,
    name: agencyResult.rows[0].name,
    plans: plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      billing_cycle: p.billing_cycle,
      description: p.description,
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ agencyId: string }> }) {
  const { agencyId } = await params;

  const agencyResult = await db.query(
    'SELECT id, name FROM agencies WHERE id = $1',
    [agencyId]
  );
  if (!agencyResult.rows[0]) return Response.json({ error: 'Agency not found' }, { status: 404 });

  const body = await req.json();
  const { name, email, companyName, phone, planId } = body;

  if (!name?.trim() || !email?.trim()) {
    return Response.json({ error: 'Name and email are required' }, { status: 400 });
  }

  // Check for duplicate email in this agency
  const existing = await db.query(
    'SELECT id FROM clients WHERE agency_id = $1 AND email = $2',
    [agencyId, email.toLowerCase().trim()]
  );
  if (existing.rows[0]) {
    return Response.json({ error: 'A client with this email already exists' }, { status: 409 });
  }

  // Onboarding clients always start on next full period (agency sets policy at creation time)
  const billingPolicy: 'next_month' | 'prorated' = 'next_month';

  try {
    const client = await createClient(
      agencyId,
      name.trim(),
      email.toLowerCase().trim(),
      phone?.trim() || undefined,
      companyName?.trim() || undefined
    );

    // Generate invite token and set expiry (72 hours)
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await setClientInviteToken(client.id, inviteToken, expiresAt);

    // Build setup URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const setupUrl = `${baseUrl}/client-portal/setup/${inviteToken}`;

    // Send invite email (non-blocking)
    const agencyName = agencyResult.rows[0].name || 'Agency';
    sendClientInviteEmail({
      to: email.toLowerCase().trim(),
      clientName: name.trim(),
      agencyName,
      setupUrl,
    }).catch(err => console.error('Failed to send client invite email:', err));

    // Assign plan and immediately generate deliverables if a plan was selected
    if (planId) {
      const planResult = await db.query(
        'SELECT id, billing_cycle, price FROM plans WHERE id = $1 AND agency_id = $2',
        [planId, agencyId]
      );
      const plan = planResult.rows[0];

      if (plan) {
        const startDate = new Date();
        await createClientPlan(client.id, plan.id, startDate, 'active', billingPolicy);

        await generateDeliverablesForClientPlan({
          client_id: client.id,
          plan_id: plan.id,
          agency_id: agencyId,
          start_date: startDate,
          billing_cycle: plan.billing_cycle,
          billing_start_policy: billingPolicy,
        }).catch(err =>
          console.error('Failed to generate initial deliverables for onboarded client:', err)
        );

        // First invoice based on billing start policy
        const { amount, dueDate } = calcFirstInvoice(Number(plan.price), startDate, billingPolicy);
        await db.query(
          `INSERT INTO invoices (agency_id, client_id, amount, status, due_date)
           VALUES ($1, $2, $3, 'draft', $4)`,
          [agencyId, client.id, amount, dueDate.toISOString()]
        );
      }
    }

    return Response.json(
      { success: true, client: { id: client.id, email: client.email, name: client.name } },
      { status: 201 }
    );
  } catch (err) {
    return Response.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
