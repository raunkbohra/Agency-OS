import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { join } from 'path';

// Configure PDFKit font directory
if (typeof window === 'undefined') {
  // Server-side only
  try {
    const pdfkitModule = require('pdfkit/js/data');
  } catch (e) {
    // Ignore if not found
  }
}

export interface InvoiceData {
  invoiceNumber: string;
  agencyName: string;
  agencyEmail: string;
  agencyLogoUrl?: string;
  clientName: string;
  clientEmail: string;
  currencySymbol: string;
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
    try {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: any) => {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk, 'binary'));
        }
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const stream = Readable.from([pdfBuffer]);
        resolve(stream);
      });

      doc.on('error', reject);

      let yPosition = 50;

      // Logo (if available)
      if (data.agencyLogoUrl) {
        try {
          doc.image(data.agencyLogoUrl, 50, yPosition, { width: 100, height: 50 });
          yPosition += 65;
        } catch (err) {
          console.warn('Failed to load logo image:', err);
        }
      }

      // Header
      doc.fontSize(24).text('INVOICE', 50, yPosition);
      doc.fontSize(10).text(`Invoice #${data.invoiceNumber}`, 50, yPosition + 40);

      // Agency details
      const headerOffset = yPosition;
      doc.fontSize(12).text(data.agencyName, 50, headerOffset + 80);
      doc.fontSize(10).text(data.agencyEmail, 50, headerOffset + 100);

      // Client details
      doc.fontSize(12).text('Bill To:', 300, headerOffset + 80);
      doc.fontSize(10).text(data.clientName, 300, headerOffset + 100);
      doc.text(data.clientEmail, 300, headerOffset + 120);

      // Due date
      doc.fontSize(10).text(`Due Date: ${data.dueDate}`, 300, headerOffset + 150);

      // Items table header
      doc.fontSize(12).text('Description', 50, headerOffset + 230);
      doc.text('Qty', 300, headerOffset + 230);
      doc.text('Rate', 400, headerOffset + 230);
      doc.text('Amount', 480, headerOffset + 230);

      // Items
      let y = headerOffset + 260;
      data.items.forEach((item) => {
        doc.fontSize(10).text(item.description, 50, y);
        doc.text(item.qty.toString(), 300, y);
        doc.text(`${data.currencySymbol}${item.rate}`, 400, y);
        doc.text(`${data.currencySymbol}${(item.qty * item.rate).toFixed(2)}`, 480, y);
        y += 30;
      });

      // Total
      doc
        .fontSize(14)
        .text(`Total: ${data.currencySymbol}${data.totalAmount.toFixed(2)}`, 400, y + 20);

      // Bank details
      if (data.bankDetails) {
        y += 80;
        doc.fontSize(12).text('Bank Transfer Details:', 50, y);
        doc.fontSize(10);
        doc.text(`Bank: ${data.bankDetails.bankName}`, 50, y + 25);
        doc.text(`Account: ${data.bankDetails.accountNumber}`, 50, y + 45);
        doc.text(`Routing: ${data.bankDetails.routingNumber}`, 50, y + 65);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
