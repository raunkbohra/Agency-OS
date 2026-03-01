import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface InvoiceData {
  invoiceNumber: string;
  agencyName: string;
  agencyEmail: string;
  clientName: string;
  clientEmail: string;
  items: Array<{ description: string; qty: number; rate: number }>;
  totalAmount: number;
  dueDate: string;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
}

export function generateInvoicePDF(data: InvoiceData): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const stream = Readable.from([pdfBuffer]);
      resolve(stream);
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(`Invoice #${data.invoiceNumber}`, 50, 90);

    // Agency details
    doc.fontSize(12).font('Helvetica-Bold').text(data.agencyName, 50, 130);
    doc.fontSize(10).font('Helvetica').text(data.agencyEmail, 50, 150);

    // Client details
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 300, 130);
    doc.fontSize(10).font('Helvetica').text(data.clientName, 300, 150);
    doc.text(data.clientEmail, 300, 170);

    // Due date
    doc.fontSize(10).text(`Due Date: ${data.dueDate}`, 300, 200);

    // Items table header
    doc.fontSize(12).font('Helvetica-Bold').text('Description', 50, 280);
    doc.text('Qty', 300, 280);
    doc.text('Rate', 400, 280);
    doc.text('Amount', 480, 280);

    // Items
    let y = 310;
    data.items.forEach((item) => {
      doc.fontSize(10).font('Helvetica').text(item.description, 50, y);
      doc.text(item.qty.toString(), 300, y);
      doc.text(`₹${item.rate}`, 400, y);
      doc.text(`₹${(item.qty * item.rate).toFixed(2)}`, 480, y);
      y += 30;
    });

    // Total
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Total: ₹${data.totalAmount.toFixed(2)}`, 400, y + 20);

    // Bank details
    if (data.bankDetails) {
      y += 80;
      doc.fontSize(12).font('Helvetica-Bold').text('Bank Transfer Details:', 50, y);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Bank: ${data.bankDetails.bankName}`, 50, y + 25);
      doc.text(`Account: ${data.bankDetails.accountNumber}`, 50, y + 45);
      doc.text(`Routing: ${data.bankDetails.routingNumber}`, 50, y + 65);
    }

    doc.end();
  });
}
