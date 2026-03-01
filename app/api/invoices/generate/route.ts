import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import {
  getClientById,
  getInvoiceById,
  getInvoiceItems,
  updateInvoiceStatus,
  getAgencyById,
} from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Fetch invoice data
    const invoice = await getInvoiceById(invoiceId, session.user.agencyId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch client details
    const client = await getClientById(invoice.client_id, session.user.agencyId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch agency details
    const agency = await getAgencyById(session.user.agencyId);
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Fetch invoice items
    const items = await getInvoiceItems(invoiceId, session.user.agencyId);

    // Generate PDF
    const pdfStream = await generateInvoicePDF({
      invoiceNumber: `INV-${invoiceId.slice(0, 8).toUpperCase()}`,
      agencyName: agency.name,
      agencyEmail: 'contact@agency.com', // TODO: Make this configurable
      clientName: client.name,
      clientEmail: client.email || 'client@example.com',
      items: items.map((i: any) => ({
        description: i.description,
        qty: i.quantity,
        rate: parseFloat(i.rate),
      })),
      totalAmount: parseFloat(invoice.amount),
      dueDate: invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Not specified',
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456',
        bankName: 'Bank Name',
      },
    });

    // TODO: Upload PDF to storage (Vercel Blob, S3, etc.)
    const pdfUrl = `/invoices/${invoiceId}.pdf`;

    // Update invoice status and PDF URL
    await updateInvoiceStatus(invoiceId, session.user.agencyId, 'sent', pdfUrl);

    // Convert stream to buffer for NextResponse
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Buffer);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
