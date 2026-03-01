import { processPaymentWebhook } from '@/lib/webhook-processor';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Determine provider from request header
    const provider = request.headers.get('x-provider') || 'unknown';
    const signature = request.headers.get('x-signature');

    // Process webhook
    const result = await processPaymentWebhook(provider, payload, signature || undefined);

    if (result.success) {
      return Response.json({ success: true, message: result.message });
    } else {
      return Response.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
