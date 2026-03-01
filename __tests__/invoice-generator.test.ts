/**
 * Test suite for invoice PDF generation
 * Tests the generateInvoicePDF function with various invoice data
 */

import { generateInvoicePDF, InvoiceData } from '@/lib/pdf/invoice-generator';
import { Readable } from 'stream';

// Mock invoice data for testing
const mockInvoiceData: InvoiceData = {
  invoiceNumber: 'INV-ABC12345',
  agencyName: 'Test Agency',
  agencyEmail: 'contact@testagency.com',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  items: [
    { description: 'Web Development Services', qty: 10, rate: 5000 },
    { description: 'UI/UX Design', qty: 5, rate: 3000 },
  ],
  totalAmount: 65000,
  dueDate: 'March 31, 2026',
  bankDetails: {
    accountNumber: '9876543210',
    routingNumber: '987654',
    bankName: 'Test Bank',
  },
};

describe('Invoice PDF Generator', () => {
  it('should generate a PDF stream from invoice data', async () => {
    const result = await generateInvoicePDF(mockInvoiceData);
    expect(result).toBeInstanceOf(Readable);
  });

  it('should handle invoices without bank details', async () => {
    const invoiceWithoutBank: InvoiceData = {
      ...mockInvoiceData,
      bankDetails: undefined,
    };
    const result = await generateInvoicePDF(invoiceWithoutBank);
    expect(result).toBeInstanceOf(Readable);
  });

  it('should handle invoices with single item', async () => {
    const singleItemInvoice: InvoiceData = {
      ...mockInvoiceData,
      items: [{ description: 'Single Service', qty: 1, rate: 50000 }],
      totalAmount: 50000,
    };
    const result = await generateInvoicePDF(singleItemInvoice);
    expect(result).toBeInstanceOf(Readable);
  });

  it('should generate PDF with correct total amount', async () => {
    const invoiceData: InvoiceData = {
      ...mockInvoiceData,
      items: [
        { description: 'Service A', qty: 2, rate: 1000 },
        { description: 'Service B', qty: 3, rate: 500 },
      ],
      totalAmount: 3500, // 2*1000 + 3*500
    };
    const result = await generateInvoicePDF(invoiceData);
    expect(result).toBeInstanceOf(Readable);
  });

  it('should handle special characters in invoice data', async () => {
    const specialCharInvoice: InvoiceData = {
      ...mockInvoiceData,
      clientName: "O'Brien & Associates",
      agencyName: 'Test (Pvt) Ltd.',
      items: [
        { description: 'Service @ 50%', qty: 1, rate: 1000 },
      ],
    };
    const result = await generateInvoicePDF(specialCharInvoice);
    expect(result).toBeInstanceOf(Readable);
  });
});

// Helper function to test if data can be read from the stream
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

describe('Invoice PDF Generation - Stream Content', () => {
  it('should generate readable PDF content', async () => {
    const pdfStream = await generateInvoicePDF(mockInvoiceData);
    const buffer = await streamToBuffer(pdfStream);
    expect(buffer.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(buffer.toString('ascii', 0, 4)).toBe('%PDF');
  });

  it('should generate different PDFs for different invoices', async () => {
    const invoice1 = await generateInvoicePDF(mockInvoiceData);
    const buffer1 = await streamToBuffer(invoice1);

    const modifiedData: InvoiceData = {
      ...mockInvoiceData,
      invoiceNumber: 'INV-XYZ67890',
    };
    const invoice2 = await generateInvoicePDF(modifiedData);
    const buffer2 = await streamToBuffer(invoice2);

    expect(buffer1.length).toBeGreaterThan(0);
    expect(buffer2.length).toBeGreaterThan(0);
  });
});
