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

// Color scheme
const COLORS = {
  primary: rgb(0.145, 0.388, 0.929), // #2563EB - Blue
  lightGray: rgb(0.953, 0.957, 0.969), // #F3F4F6
  darkGray: rgb(0.122, 0.165, 0.204), // #1F2937
  mediumGray: rgb(0.4, 0.4, 0.4),
  lightText: rgb(0.6, 0.6, 0.6),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
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

export async function generateInvoicePDF(data: InvoiceData): Promise<Readable> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    const margin = 40;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    // ─── HEADER SECTION ───
    let logoHeight = 0;
    if (data.agencyLogoUrl) {
      try {
        const logoResponse = await fetch(data.agencyLogoUrl);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoImage = await pdfDoc.embedPng(Buffer.from(logoBuffer));
          page.drawImage(logoImage, {
            x: margin,
            y: y - 50,
            width: 60,
            height: 50,
          });
          logoHeight = 60;
        }
      } catch (err) {
        console.warn('Failed to load logo:', err);
      }
    }

    // Company name with brand color
    const companyInfoX = margin + (logoHeight > 0 ? 80 : 0);
    page.drawText(data.agencyName, {
      x: companyInfoX,
      y: y - 15,
      size: 20,
      color: COLORS.darkGray,
    });

    // Company contact info
    let contactY = y - 35;
    page.drawText(data.agencyEmail, {
      x: companyInfoX,
      y: contactY,
      size: 9,
      color: COLORS.mediumGray,
    });

    if (data.agencyPhone) {
      page.drawText(`| ${data.agencyPhone}`, {
        x: companyInfoX + 100,
        y: contactY,
        size: 9,
        color: COLORS.mediumGray,
      });
    }

    if (data.agencyWebsite) {
      page.drawText(`| ${data.agencyWebsite}`, {
        x: companyInfoX + 160,
        y: contactY,
        size: 9,
        color: COLORS.mediumGray,
      });
    }

    // Agency address
    if (data.agencyAddress) {
      const addressLines = data.agencyAddress.split('\n');
      let addressY = y - 48;
      for (const line of addressLines.slice(0, 2)) {
        page.drawText(line.trim(), {
          x: companyInfoX,
          y: addressY,
          size: 8,
          color: COLORS.lightText,
        });
        addressY -= 10;
      }
    }

    // Invoice heading - LARGE and BLUE
    page.drawText('INVOICE', {
      x: width - margin - 80,
      y: y - 20,
      size: 32,
      color: COLORS.primary,
    });

    // Blue accent line under header
    drawRectangle(page, margin, y - 65, contentWidth, 2, COLORS.primary);
    y -= 85;

    // Invoice info boxes
    const boxWidth = (contentWidth - 20) / 3;
    const boxHeight = 35;

    // Invoice number box
    drawRectangle(page, margin, y, boxWidth, boxHeight, COLORS.lightGray);
    page.drawText('Invoice #', {
      x: margin + 8,
      y: y - 10,
      size: 8,
      color: COLORS.lightText,
    });
    page.drawText(data.invoiceNumber, {
      x: margin + 8,
      y: y - 22,
      size: 11,
      color: COLORS.darkGray,
    });

    // Invoice date box
    if (data.invoiceDate) {
      drawRectangle(page, margin + boxWidth + 10, y, boxWidth, boxHeight, COLORS.lightGray);
      page.drawText('Date', {
        x: margin + boxWidth + 18,
        y: y - 10,
        size: 8,
        color: COLORS.lightText,
      });
      page.drawText(data.invoiceDate, {
        x: margin + boxWidth + 18,
        y: y - 22,
        size: 11,
        color: COLORS.darkGray,
      });
    }

    // Due date box
    drawRectangle(page, margin + (boxWidth + 10) * 2, y, boxWidth, boxHeight, COLORS.primary);
    page.drawText('Due Date', {
      x: margin + (boxWidth + 10) * 2 + 8,
      y: y - 10,
      size: 8,
      color: COLORS.white,
    });
    page.drawText(data.dueDate, {
      x: margin + (boxWidth + 10) * 2 + 8,
      y: y - 22,
      size: 11,
      color: COLORS.white,
    });

    y -= 55;

    // ─── BILL TO SECTION ───
    drawRectangle(page, margin, y, contentWidth, 65, COLORS.lightGray);
    page.drawText('Bill To:', {
      x: margin + 10,
      y: y - 12,
      size: 10,
      color: COLORS.darkGray,
    });

    page.drawText(data.clientName, {
      x: margin + 10,
      y: y - 24,
      size: 11,
      color: COLORS.darkGray,
    });

    let billY = y - 36;
    page.drawText(data.clientEmail, {
      x: margin + 10,
      y: billY,
      size: 9,
      color: COLORS.mediumGray,
    });

    if (data.clientAddress) {
      const lines = data.clientAddress.split('\n');
      for (const line of lines.slice(0, 2)) {
        billY -= 10;
        page.drawText(line.trim(), {
          x: margin + 10,
          y: billY,
          size: 8,
          color: COLORS.lightText,
        });
      }
    }

    y -= 75;

    // ─── ITEMS TABLE ───
    const tableY = y;
    const colWidth = [200, 80, 100, 100];
    const rowHeight = 20;

    // Table header - BLUE with white text
    drawRectangle(page, margin, y, contentWidth, rowHeight, COLORS.primary);

    page.drawText('Description', {
      x: margin + 5,
      y: y - 14,
      size: 10,
      color: COLORS.white,
    });

    page.drawText('Qty', {
      x: margin + colWidth[0] + 5,
      y: y - 14,
      size: 10,
      color: COLORS.white,
    });

    page.drawText('Rate', {
      x: margin + colWidth[0] + colWidth[1] + 5,
      y: y - 14,
      size: 10,
      color: COLORS.white,
    });

    page.drawText('Amount', {
      x: margin + colWidth[0] + colWidth[1] + colWidth[2] + 5,
      y: y - 14,
      size: 10,
      color: COLORS.white,
    });

    y -= rowHeight;

    // Table rows with alternating colors
    let rowIndex = 0;
    let subtotal = 0;
    for (const item of data.items) {
      const rowColor = rowIndex % 2 === 0 ? COLORS.white : COLORS.lightGray;
      drawRectangle(page, margin, y, contentWidth, rowHeight, rowColor);

      // Description
      page.drawText(item.description.substring(0, 30), {
        x: margin + 5,
        y: y - 14,
        size: 9,
        color: COLORS.darkGray,
      });

      // Quantity
      page.drawText(item.qty.toString(), {
        x: margin + colWidth[0] + 5,
        y: y - 14,
        size: 9,
        color: COLORS.darkGray,
      });

      // Rate
      page.drawText(`${data.currencySymbol}${item.rate.toFixed(2)}`, {
        x: margin + colWidth[0] + colWidth[1] + 5,
        y: y - 14,
        size: 9,
        color: COLORS.darkGray,
      });

      // Amount
      const itemTotal = item.qty * item.rate;
      subtotal += itemTotal;
      page.drawText(`${data.currencySymbol}${itemTotal.toFixed(2)}`, {
        x: margin + colWidth[0] + colWidth[1] + colWidth[2] + 5,
        y: y - 14,
        size: 9,
        color: COLORS.darkGray,
      });

      y -= rowHeight;
      rowIndex++;
    }

    y -= 5;

    // ─── TOTAL SUMMARY BOX ───
    const summaryBoxHeight = 50;
    drawRectangle(page, margin + 300, y, 240, summaryBoxHeight, COLORS.primary);

    page.drawText('Amount Due', {
      x: margin + 310,
      y: y - 18,
      size: 10,
      color: COLORS.white,
    });

    page.drawText(`${data.currencySymbol}${data.totalAmount.toFixed(2)}`, {
      x: margin + 310,
      y: y - 35,
      size: 20,
      color: COLORS.white,
    });

    y -= 60;

    // ─── PAYMENT SECTION ───
    if (data.bankDetails) {
      page.drawText('Bank Transfer Details', {
        x: margin,
        y: y,
        size: 11,
        color: COLORS.darkGray,
      });

      drawRectangle(page, margin, y - 5, contentWidth, 60, COLORS.lightGray);

      page.drawText(`Bank: ${data.bankDetails.bankName}`, {
        x: margin + 8,
        y: y - 18,
        size: 9,
        color: COLORS.darkGray,
      });

      page.drawText(`Account: ${data.bankDetails.accountNumber}`, {
        x: margin + 8,
        y: y - 30,
        size: 9,
        color: COLORS.darkGray,
      });

      page.drawText(`Routing: ${data.bankDetails.routingNumber}`, {
        x: margin + 8,
        y: y - 42,
        size: 9,
        color: COLORS.darkGray,
      });

      y -= 70;
    }

    // ─── PAYMENT TERMS & THANK YOU ───
    if (data.paymentTerms) {
      page.drawText(`Payment Terms: ${data.paymentTerms}`, {
        x: margin,
        y: y,
        size: 9,
        color: COLORS.mediumGray,
      });
      y -= 15;
    }

    page.drawText('Thank you for your business!', {
      x: margin,
      y: y,
      size: 10,
      color: COLORS.primary,
    });

    // ─── FOOTER ───
    const footerY = 30;

    // Footer line
    drawRectangle(page, margin, footerY + 30, contentWidth, 1, COLORS.lightGray);

    // Company info and terms
    const footerText = `${data.agencyName} | ${data.agencyEmail} | ${data.agencyPhone || 'Contact for details'} | Payment terms: Net 30 days`;
    page.drawText(footerText, {
      x: margin,
      y: footerY + 15,
      size: 8,
      color: COLORS.lightText,
    });

    page.drawText('For questions, contact: ' + data.agencyEmail, {
      x: margin,
      y: footerY,
      size: 8,
      color: COLORS.lightText,
    });

    const pdfBytes = await pdfDoc.save();
    const stream = Readable.from([Buffer.from(pdfBytes)]);
    return stream;
  } catch (error) {
    console.error('PDF generation error:', error);
    return Promise.reject(error);
  }
}
