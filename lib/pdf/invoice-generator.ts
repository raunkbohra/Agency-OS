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
    const margin = 50;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    // ─── HEADER SECTION ───
    // Logo on top left
    let logoHeight = 50;
    let logoWidth = 50;
    const logoX = margin;
    const logoY = y;

    if (data.agencyLogoUrl) {
      try {
        const logoResponse = await fetch(data.agencyLogoUrl);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoImage = await pdfDoc.embedPng(Buffer.from(logoBuffer));
          page.drawImage(logoImage, {
            x: logoX,
            y: logoY - logoHeight,
            width: logoWidth,
            height: logoHeight,
          });
        }
      } catch (err) {
        console.warn('Failed to load logo:', err);
      }
    }

    // Company info on left (next to logo)
    const companyX = logoX + logoWidth + 15;
    const companyY = logoY - 10;

    page.drawText(data.agencyName, {
      x: companyX,
      y: companyY,
      size: 18,
      color: COLORS.black,
    });

    let addressY = companyY - 20;
    if (data.agencyAddress) {
      const addressLines = data.agencyAddress.split('\n').slice(0, 2);
      for (const line of addressLines) {
        page.drawText(line.trim(), {
          x: companyX,
          y: addressY,
          size: 9,
          color: COLORS.mediumGray,
        });
        addressY -= 11;
      }
    }

    y -= 65;

    // INVOICE title on right
    page.drawText('INVOICE', {
      x: width - margin - 120,
      y: height - 80,
      size: 28,
      color: COLORS.black,
    });

    y = height - margin - 100;

    // ─── BILL TO and INVOICE DETAILS (Two Column) ───
    const colWidth = contentWidth / 2;

    // Left column - Bill To
    page.drawText('Bill To', {
      x: margin,
      y: y,
      size: 11,
      color: COLORS.mediumGray,
    });

    y -= 14;

    page.drawText(data.clientName, {
      x: margin,
      y: y,
      size: 12,
      color: COLORS.black,
    });

    y -= 14;

    if (data.clientAddress) {
      const addressLines = data.clientAddress.split('\n').slice(0, 2);
      for (const line of addressLines) {
        page.drawText(line.trim(), {
          x: margin,
          y: y,
          size: 9,
          color: COLORS.mediumGray,
        });
        y -= 11;
      }
    }

    // Right column - Invoice details
    const invoiceY = height - margin - 100;
    const detailsX = margin + colWidth;

    page.drawText('Invoice #', {
      x: detailsX,
      y: invoiceY,
      size: 9,
      color: COLORS.mediumGray,
    });

    page.drawText(data.invoiceNumber, {
      x: width - margin - 80,
      y: invoiceY,
      size: 9,
      color: COLORS.black,
    });

    page.drawText('Invoice date', {
      x: detailsX,
      y: invoiceY - 18,
      size: 9,
      color: COLORS.mediumGray,
    });

    page.drawText(data.invoiceDate || '', {
      x: width - margin - 80,
      y: invoiceY - 18,
      size: 9,
      color: COLORS.black,
    });

    page.drawText('Due date', {
      x: detailsX,
      y: invoiceY - 36,
      size: 9,
      color: COLORS.mediumGray,
    });

    page.drawText(data.dueDate, {
      x: width - margin - 80,
      y: invoiceY - 36,
      size: 9,
      color: COLORS.black,
    });

    y -= 50;

    // ─── ITEMS TABLE ───
    const tableY = y;
    const rowHeight = 16;
    const qtyWidth = 40;
    const descWidth = contentWidth - qtyWidth - 80 - 60;
    const priceWidth = 60;
    const amountWidth = 80;

    // Header row with dark background
    drawRectangle(page, margin, tableY, contentWidth, rowHeight, COLORS.darkGray);

    page.drawText('QTY', {
      x: margin + 5,
      y: tableY - 11,
      size: 9,
      color: COLORS.white,
    });

    page.drawText('Description', {
      x: margin + qtyWidth + 5,
      y: tableY - 11,
      size: 9,
      color: COLORS.white,
    });

    page.drawText('Unit Price', {
      x: margin + qtyWidth + descWidth + 5,
      y: tableY - 11,
      size: 9,
      color: COLORS.white,
    });

    page.drawText('Amount', {
      x: margin + qtyWidth + descWidth + priceWidth + 5,
      y: tableY - 11,
      size: 9,
      color: COLORS.white,
    });

    y -= rowHeight;

    // Data rows
    for (const item of data.items) {
      drawRectangle(page, margin, y, contentWidth, rowHeight, COLORS.white);
      drawLine(page, margin, y, margin + contentWidth, 0.5);

      page.drawText(item.qty.toString(), {
        x: margin + 5,
        y: y - 11,
        size: 9,
        color: COLORS.black,
      });

      page.drawText(item.description.substring(0, 50), {
        x: margin + qtyWidth + 5,
        y: y - 11,
        size: 9,
        color: COLORS.black,
      });

      page.drawText(`${data.currencySymbol}${item.rate.toFixed(2)}`, {
        x: margin + qtyWidth + descWidth + 5,
        y: y - 11,
        size: 9,
        color: COLORS.black,
      });

      page.drawText(`${data.currencySymbol}${(item.qty * item.rate).toFixed(2)}`, {
        x: margin + qtyWidth + descWidth + priceWidth + 5,
        y: y - 11,
        size: 9,
        color: COLORS.black,
      });

      y -= rowHeight;
    }

    // Bottom border
    drawLine(page, margin, y, margin + contentWidth, 0.5);

    // ─── TOTALS (Right Aligned) ───
    y -= 15;

    const totalLabelX = margin + qtyWidth + descWidth + 5;
    const totalValueX = margin + qtyWidth + descWidth + priceWidth + 5;

    page.drawText('Subtotal', {
      x: totalLabelX,
      y: y,
      size: 9,
      color: COLORS.mediumGray,
    });

    page.drawText(`${data.currencySymbol}${data.totalAmount.toFixed(2)}`, {
      x: totalValueX,
      y: y,
      size: 9,
      color: COLORS.black,
    });

    y -= 15;
    drawLine(page, totalLabelX - 5, y, totalValueX + 80, 0.5);

    y -= 15;

    page.drawText(`Total (${data.currencySymbol === 'Rs.' ? 'NPR' : 'USD'})`, {
      x: totalLabelX,
      y: y,
      size: 11,
      color: COLORS.black,
    });

    page.drawText(`${data.currencySymbol}${data.totalAmount.toFixed(2)}`, {
      x: totalValueX,
      y: y,
      size: 12,
      color: COLORS.black,
    });

    y -= 20;
    drawLine(page, totalLabelX - 5, y, totalValueX + 80, 0.5);

    // ─── BANK DETAILS (at bottom) ───
    y -= 25;

    if (data.bankDetails) {
      page.drawText('Bank Details', {
        x: margin,
        y: y,
        size: 10,
        color: COLORS.mediumGray,
      });

      y -= 12;

      page.drawText(`Bank Name: ${data.bankDetails.bankName}`, {
        x: margin,
        y: y,
        size: 9,
        color: COLORS.black,
      });

      y -= 11;

      page.drawText(`Account Number: ${data.bankDetails.accountNumber}`, {
        x: margin,
        y: y,
        size: 9,
        color: COLORS.black,
      });

      y -= 11;

      page.drawText(`Routing Number: ${data.bankDetails.routingNumber}`, {
        x: margin,
        y: y,
        size: 9,
        color: COLORS.black,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const stream = Readable.from([Buffer.from(pdfBytes)]);
    return stream;
  } catch (error) {
    console.error('PDF generation error:', error);
    return Promise.reject(error);
  }
}
