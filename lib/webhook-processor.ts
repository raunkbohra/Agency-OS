import { db } from '@/lib/db';
import { getProvider } from '@/lib/payment-providers';
import { updatePaymentTransactionStatus, updateInvoiceStatus } from '@/lib/db-queries';

export async function processPaymentWebhook(
  providerId: string,
  payload: Record<string, any>,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Log webhook for debugging
    await db.query(
      `INSERT INTO payment_webhooks (provider_id, event_type, payload, verified)
       VALUES ($1, $2, $3, false)`,
      [providerId, 'payment.received', JSON.stringify(payload)]
    );

    // Get provider
    const provider = getProvider(providerId);
    if (!provider) {
      return { success: false, message: 'Unknown provider' };
    }

    // Verify webhook signature
    const verified = await provider.verifyWebhook(payload, signature);
    if (!verified) {
      return { success: false, message: 'Signature verification failed' };
    }

    // Parse payment event
    const event = provider.parsePaymentEvent(payload);

    // Find payment transaction
    const txnResult = await db.query(
      `SELECT * FROM payment_transactions WHERE invoice_id = $1 AND provider_id = $2`,
      [event.invoiceId, providerId]
    );

    if (txnResult.rows.length === 0) {
      return { success: false, message: 'Transaction not found' };
    }

    const transaction = txnResult.rows[0];

    // Update transaction status
    await updatePaymentTransactionStatus(transaction.id, transaction.agency_id, event.status);

    // If payment completed, update invoice
    if (event.status === 'completed') {
      const invoiceResult = await db.query(
        `SELECT * FROM invoices WHERE id = $1`,
        [event.invoiceId]
      );

      if (invoiceResult.rows.length > 0) {
        await updateInvoiceStatus(event.invoiceId, transaction.agency_id, 'paid');
      }
    }

    return { success: true, message: 'Payment processed' };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { success: false, message: 'Processing failed' };
  }
}
