import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/client-auth';
import { getInvoicesByClient, getAgencyById } from '@/lib/db-queries';

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string | null;
  paidDate: string | null;
  status: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getClientSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await getInvoicesByClient(session.clientId, session.agencyId);

    // Get agency to retrieve currency
    const agency = await getAgencyById(session.agencyId);
    const currency = agency?.currency || 'USD';

    const formattedInvoices: InvoiceResponse[] = invoices.map((inv: any, index: number) => ({
      id: inv.id,
      invoiceNumber: `INV-${new Date(inv.created_at).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      amount: inv.amount.toString(),
      currency,
      dueDate: inv.due_date ? new Date(inv.due_date).toISOString() : null,
      paidDate: inv.paid_date ? new Date(inv.paid_date).toISOString() : null,
      status: inv.status,
      createdAt: new Date(inv.created_at).toISOString(),
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
