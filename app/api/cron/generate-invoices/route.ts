import { db } from '@/lib/db';
import { generateInvoiceForClientPlan } from '@/lib/generate-invoices';
import { sendInvoiceEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Join plans and clients to get all necessary data
    const result = await db.query(
      `SELECT cp.id, cp.client_id, cp.start_date, cp.billing_start_policy,
              c.agency_id, c.name as client_name, c.email as client_email,
              p.id as plan_id, p.billing_cycle, p.price as plan_price, p.name as plan_name
       FROM client_plans cp
       JOIN clients c ON cp.client_id = c.id
       JOIN plans p ON cp.plan_id = p.id
       WHERE cp.status = 'active'`
    );

    // Cache agencies to avoid N+1 queries
    const agencyCache = new Map<string, any>();
    const getAgency = async (agencyId: string) => {
      if (!agencyCache.has(agencyId)) {
        const agencyResult = await db.query(
          'SELECT * FROM agencies WHERE id = $1',
          [agencyId]
        );
        agencyCache.set(agencyId, agencyResult.rows[0] || null);
      }
      return agencyCache.get(agencyId);
    };

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of result.rows) {
      try {
        const invoiceId = await generateInvoiceForClientPlan(
          {
            client_id: row.client_id,
            plan_id: row.plan_id,
            agency_id: row.agency_id,
            start_date: row.start_date,
            billing_cycle: row.billing_cycle,
            billing_start_policy: row.billing_start_policy ?? 'next_month',
            plan_name: row.plan_name,
            plan_price: parseFloat(row.plan_price),
          },
          now
        );

        if (invoiceId) {
          created++;

          // Fetch agency for email
          const agency = await getAgency(row.agency_id);
          if (!agency) continue;

          // Send invoice email
          try {
            const currencySymbol = agency.currency === 'NPR' ? 'Rs.' : '$';
            const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const payUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/invoices/${invoiceId}/pay`;

            // Get invoice details
            const invoiceResult = await db.query(
              'SELECT due_date, amount FROM invoices WHERE id = $1',
              [invoiceId]
            );
            const invoice = invoiceResult.rows[0];

            await sendInvoiceEmail({
              to: row.client_email,
              clientName: row.client_name,
              agencyName: agency.name,
              invoiceId,
              invoiceNumber: `INV-${invoiceId.slice(0, 8).toUpperCase()}`,
              amount: parseFloat(invoice.amount),
              currencySymbol,
              billingPeriod,
              dueDate: invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Not specified',
              payUrl,
            });
          } catch (emailErr) {
            console.error(`Failed to send invoice email for ${invoiceId}:`, emailErr);
            // Don't fail the whole cron job if email fails
          }
        } else {
          skipped++;
        }
      } catch (err) {
        const msg = `client ${row.client_id}: ${err instanceof Error ? err.message : 'unknown error'}`;
        console.error('Failed to generate invoice for', msg);
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
    return Response.json({ error: 'Failed to generate invoices' }, { status: 500 });
  }
}
