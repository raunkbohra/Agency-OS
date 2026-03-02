import { PDFDocument, rgb, PDFPage } from 'pdf-lib';
import { Readable } from 'stream';

export interface InvoiceData {
  invoiceNumber: string;
  agencyName: string;
  agencyEmail: string;
  agencyAddress?: string;
  agencyPhone?: string;
  agencyWebsite?: string;
  agencyLogoUrl?: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  currencySymbol: string;
  items: Array<{ description: string; qty: number; rate: number }>;
  totalAmount: number;
  invoiceDate?: string;
  dueDate: string;
  paymentTerms?: string;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
}

// Monochrome colors
const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.2, 0.2, 0.2),
  mediumGray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.9, 0.9, 0.9),
  white: rgb(1, 1, 1),
};

function drawRectangle(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: any
) {
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color,
  });
}

function drawLine(page: PDFPage, x1: number, y: number, x2: number, thickness: number = 1) {
  drawRectangle(page, x1, y, x2 - x1, thickness, COLORS.black);
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Readable> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();
    const margin = 40;
    const contentWidth = width - 2 * margin;
    let y = height - 35; // Start lower to prevent overflow

    // ─── HEADER ───
    // Logo
    let logoWidth = 0;
    if (data.agencyLogoUrl) {
      try {
        const logoResponse = await fetch(data.agencyLogoUrl);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoImage = await pdfDoc.embedPng(Buffer.from(logoBuffer));
          logoWidth = 50;
          page.drawImage(logoImage, {
            x: margin,
            y: y - 40,
            width: 50,
            height: 40,
          });
        }
      } catch (err) {
        console.warn('Failed to load logo:', err);
      }
    }

    // Company name and details
    const companyX = margin + logoWidth + (logoWidth > 0 ? 15 : 0);
    page.drawText(data.agencyName.toUpperCase(), {
      x: companyX,
      y: y - 15,
      size: 16,
      color: COLORS.black,
    });

    page.drawText(data.agencyEmail, {
      x: companyX,
      y: y - 30,
      size: 8,
      color: COLORS.mediumGray,
    });

    // Right-aligned invoice heading
    page.drawText('INVOICE', {
      x: width - margin - 80,
      y: y - 15,
      size: 20,
      color: COLORS.black,
    });

    y -= 55;

    // ─── INVOICE DETAILS ROW ───
    const boxW = (contentWidth - 20) / 3;
    page.drawText('Invoice #:', {
      x: margin,
      y: y,
      size: 8,
      color: COLORS.mediumGray,
    });
    page.drawText(data.invoiceNumber, {
      x: margin,
      y: y - 12,
      size: 10,
      color: COLORS.black,
    });

    if (data.invoiceDate) {
      page.drawText('Date:', {
        x: margin + boxW,
        y: y,
        size: 8,
        color: COLORS.mediumGray,
      });
      page.drawText(data.invoiceDate, {
        x: margin + boxW,
        y: y - 12,
        size: 10,
        color: COLORS.black,
      });
    }

    page.drawText('Due:', {
      x: margin + boxW * 2,
      y: y,
      size: 8,
      color: COLORS.mediumGray,
    });
    page.drawText(data.dueDate, {
      x: margin + boxW * 2,
      y: y - 12,
      size: 10,
      color: COLORS.black,
    });

    y -= 25;

    // ─── BILL TO ───
    page.drawText('Bill To:', {
      x: margin,
      y: y,
      size: 9,
      color: COLORS.mediumGray,
    });

    page.drawText(data.clientName, {
      x: margin,
      y: y - 12,
      size: 11,
      color: COLORS.black,
    });

    page.drawText(data.clientEmail, {
      x: margin,
      y: y - 24,
      size: 8,
      color: COLORS.mediumGray,
    });

    if (data.clientAddress) {
      let addressY = y - 34;
      for (const line of data.clientAddress.split('\n').slice(0, 2)) {
        page.drawText(line.trim(), {
          x: margin,
          y: addressY,
          size: 8,
          color: COLORS.mediumGray,
        });
        addressY -= 10;
      }
    }

    y -= 50;

    // ─── TABLE ───
    const headerY = y;
    const rowHeight = 18;

    // Header row - light gray background
    drawRectangle(page, margin, headerY, contentWidth, rowHeight, COLORS.lightGray);
    page.drawText('Description', {
      x: margin + 5,
      y: headerY - 12,
      size: 9,
      color: COLORS.black,
    });
    page.drawText('Qty', {
      x: margin + 280,
      y: headerY - 12,
      size: 9,
      color: COLORS.black,
    });
    page.drawText('Rate', {
      x: margin + 330,
      y: headerY - 12,
      size: 9,
      color: COLORS.black,
    });
    page.drawText('Amount', {
      x: margin + 420,
      y: headerY - 12,
      size: 9,
      color: COLORS.black,
    });

    y -= rowHeight + 2;

    // Data rows
    for (const item of data.items) {
      drawRectangle(page, margin, y, contentWidth, rowHeight, COLORS.white);
      drawLine(page, margin, y, margin + contentWidth, 0.5);

      page.drawText(item.description.substring(0, 40), {
        x: margin + 5,
        y: y - 12,
        size: 9,
        color: COLORS.black,
      });

      page.drawText(item.qty.toString(), {
        x: margin + 280,
        y: y - 12,
        size: 9,
        color: COLORS.black,
      });

      page.drawText(`${data.currencySymbol}${item.rate.toFixed(2)}`, {
        x: margin + 330,
        y: y - 12,
        size: 9,
        color: COLORS.black,
      });

      page.drawText(`${data.currencySymbol}${(item.qty * item.rate).toFixed(2)}`, {
        x: margin + 420,
        y: y - 12,
        size: 9,
        color: COLORS.black,
      });

      y -= rowHeight;
    }

    // Bottom border
    drawLine(page, margin, y, margin + contentWidth, 0.5);
    y -= 12;

    // Total
    page.drawText('Total:', {
      x: margin + 320,
      y: y,
      size: 11,
      color: COLORS.black,
    });
    page.drawText(`${data.currencySymbol}${data.totalAmount.toFixed(2)}`, {
      x: margin + 420,
      y: y,
      size: 12,
      color: COLORS.black,
    });

    y -= 30;

    // ─── BANK DETAILS (at bottom) ───
    if (data.bankDetails) {
      page.drawText('Bank Transfer Details', {
        x: margin,
        y: y,
        size: 9,
        color: COLORS.mediumGray,
      });

      page.drawText(`Bank: ${data.bankDetails.bankName}`, {
        x: margin,
        y: y - 12,
        size: 8,
        color: COLORS.black,
      });

      page.drawText(`Account: ${data.bankDetails.accountNumber}`, {
        x: margin,
        y: y - 22,
        size: 8,
        color: COLORS.black,
      });

      page.drawText(`Routing: ${data.bankDetails.routingNumber}`, {
        x: margin,
        y: y - 32,
        size: 8,
        color: COLORS.black,
      });

      y -= 45;
    }

    // Payment terms
    if (data.paymentTerms) {
      page.drawText(data.paymentTerms, {
        x: margin,
        y: y,
        size: 8,
        color: COLORS.mediumGray,
      });
      y -= 12;
    }

    // Thank you
    page.drawText('Thank you for your business!', {
      x: margin,
      y: y,
      size: 9,
      color: COLORS.black,
    });

    const pdfBytes = await pdfDoc.save();
    const stream = Readable.from([Buffer.from(pdfBytes)]);
    return stream;
  } catch (error) {
    console.error('PDF generation error:', error);
    return Promise.reject(error);
  }
}
