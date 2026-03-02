import { PDFDocument, rgb } from 'pdf-lib';
import { Readable } from 'stream';

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

export async function generateInvoicePDF(data: InvoiceData): Promise<Readable> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Add logo if available
    if (data.agencyLogoUrl) {
      try {
        const logoResponse = await fetch(data.agencyLogoUrl);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoImage = await pdfDoc.embedPng(Buffer.from(logoBuffer));
          page.drawImage(logoImage, {
            x: margin,
            y: y - 50,
            width: 80,
            height: 50
          });
          y -= 65;
        }
      } catch (err) {
        console.warn('Failed to load logo:', err);
      }
    }

    // Header
    page.drawText('INVOICE', {
      x: margin,
      y: y - 24,
      size: 24,
      color: rgb(0, 0, 0)
    });

    page.drawText(`Invoice #${data.invoiceNumber}`, {
      x: margin,
      y: y - 44,
      size: 10,
      color: rgb(0.4, 0.4, 0.4)
    });

    y -= 80;

    // Agency details
    page.drawText(data.agencyName, {
      x: margin,
      y,
      size: 12,
      color: rgb(0, 0, 0)
    });

    page.drawText(data.agencyEmail, {
      x: margin,
      y: y - 20,
      size: 10,
      color: rgb(0.4, 0.4, 0.4)
    });

    // Client details
    page.drawText('Bill To:', {
      x: 300,
      y,
      size: 12,
      color: rgb(0, 0, 0)
    });

    page.drawText(data.clientName, {
      x: 300,
      y: y - 20,
      size: 10,
      color: rgb(0, 0, 0)
    });

    page.drawText(data.clientEmail, {
      x: 300,
      y: y - 40,
      size: 10,
      color: rgb(0.4, 0.4, 0.4)
    });

    // Due date
    page.drawText(`Due Date: ${data.dueDate}`, {
      x: 300,
      y: y - 70,
      size: 10,
      color: rgb(0, 0, 0)
    });

    y -= 150;

    // Items header
    page.drawText('Description', {
      x: margin,
      y,
      size: 11,
      color: rgb(0, 0, 0)
    });

    page.drawText('Qty', {
      x: 300,
      y,
      size: 11,
      color: rgb(0, 0, 0)
    });

    page.drawText('Rate', {
      x: 400,
      y,
      size: 11,
      color: rgb(0, 0, 0)
    });

    page.drawText('Amount', {
      x: 480,
      y,
      size: 11,
      color: rgb(0, 0, 0)
    });

    y -= 30;

    // Items
    data.items.forEach((item) => {
      page.drawText(item.description.substring(0, 30), {
        x: margin,
        y,
        size: 10,
        color: rgb(0, 0, 0)
      });

      page.drawText(item.qty.toString(), {
        x: 300,
        y,
        size: 10,
        color: rgb(0, 0, 0)
      });

      page.drawText(`${data.currencySymbol}${item.rate}`, {
        x: 400,
        y,
        size: 10,
        color: rgb(0, 0, 0)
      });

      page.drawText(`${data.currencySymbol}${(item.qty * item.rate).toFixed(2)}`, {
        x: 480,
        y,
        size: 10,
        color: rgb(0, 0, 0)
      });

      y -= 30;
    });

    // Total
    y -= 10;
    page.drawText(`Total: ${data.currencySymbol}${data.totalAmount.toFixed(2)}`, {
      x: 400,
      y,
      size: 14,
      color: rgb(0, 0, 0)
    });

    // Bank details
    if (data.bankDetails) {
      y -= 80;
      page.drawText('Bank Transfer Details:', {
        x: margin,
        y,
        size: 11,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Bank: ${data.bankDetails.bankName}`, {
        x: margin,
        y: y - 20,
        size: 10,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Account: ${data.bankDetails.accountNumber}`, {
        x: margin,
        y: y - 40,
        size: 10,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Routing: ${data.bankDetails.routingNumber}`, {
        x: margin,
        y: y - 60,
        size: 10,
        color: rgb(0, 0, 0)
      });
    }

    const pdfBytes = await pdfDoc.save();
    const stream = Readable.from([Buffer.from(pdfBytes)]);
    return stream;
  } catch (error) {
    return Promise.reject(error);
  }
}
