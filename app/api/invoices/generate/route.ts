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

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = req.nextUrl.searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Fetch invoice data
    const invoice = await getInvoiceById(invoiceId, session.user.agencyId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch client, agency, and items in parallel
    const [client, agency, items] = await Promise.all([
      getClientById(invoice.client_id, session.user.agencyId),
      getAgencyById(session.user.agencyId),
      getInvoiceItems(invoiceId, session.user.agencyId),
    ]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Determine currency symbol
    const currencySymbol = agency.currency === 'NPR' ? 'Rs.' : '$';

    // Build bank details (only if all three fields are present)
    const bankDetails =
      agency.bank_name && agency.bank_account && agency.bank_routing
        ? {
            accountNumber: agency.bank_account,
            routingNumber: agency.bank_routing,
            bankName: agency.bank_name,
          }
        : undefined;

    // Generate PDF (pdf-lib returns Promise<Readable>)
    const today = new Date();
    const invoiceDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Not specified';

    const pdfStream = await generateInvoicePDF({
      invoiceNumber: `INV-${invoiceId.slice(0, 8).toUpperCase()}`,
      agencyName: agency.name,
      agencyEmail: agency.email ?? process.env.SMTP_FROM ?? 'contact@agencyos.dev',
      agencyPhone: undefined, // TODO: Add phone to agencies table
      agencyWebsite: undefined, // TODO: Add website to agencies table
      agencyAddress: agency.address || undefined,
      agencyLogoUrl: agency.logo_url || undefined,
      clientName: client.name,
      clientEmail: client.email || 'client@example.com',
      clientAddress: undefined, // TODO: Add address to clients table
      currencySymbol,
      items: items.map((i: any) => ({
        description: i.description,
        qty: i.quantity,
        rate: parseFloat(i.rate),
      })),
      totalAmount: parseFloat(invoice.amount),
      invoiceDate,
      dueDate,
      paymentTerms: 'Net 30 days',
      bankDetails,
    });

    // TODO: Upload PDF to storage (Vercel Blob, S3, etc.)
    const pdfUrl = `/invoices/${invoiceId}.pdf`;

    // Update invoice status and PDF URL
    await updateInvoiceStatus(invoiceId, session.user.agencyId, 'sent', pdfUrl);

    // Convert stream to buffer for NextResponse
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk, 'binary'));
      } else {
        chunks.push(Buffer.from(chunk as any));
      }
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
