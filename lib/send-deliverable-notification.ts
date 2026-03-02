interface RevisionNotificationData {
  clientEmail: string;
  clientName: string;
  deliverableTitle: string;
  commentExcerpt: string;
  portalLink: string;
}

/**
 * Send revision request notification via email
 * In development: Logs to console (view via MailHog at http://localhost:8025)
 * In production: Uses Resend (if available) or logs for external service
 */
export async function sendRevisionRequestNotification(
  data: RevisionNotificationData
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const portalUrl = `${baseUrl}${data.portalLink}`;
    const html = getEmailHtml(data, portalUrl);

    // Try to use Resend if available
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'noreply@agency-os.com',
          to: data.clientEmail,
          subject: `Revision Request: ${data.deliverableTitle}`,
          html,
        });
        return;
      } catch (err) {
        console.log('Resend email service unavailable, using development logging');
      }
    }

    // Development mode: Log email details for MailHog or testing
    logEmailForDevelopment({
      to: data.clientEmail,
      subject: `Revision Request: ${data.deliverableTitle}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send revision request notification:', error);
    // Don't throw - email failures shouldn't block the API
  }
}

function getEmailHtml(data: RevisionNotificationData, portalUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Revision Request</h1>
      </div>
      <div style="background: #f6f7f9; padding: 40px 20px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
          Hi ${data.clientName},
        </p>
        <p style="color: #666; font-size: 14px; margin: 0 0 20px 0;">
          A revision request has been made on the following deliverable:
        </p>
        <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #333;">${data.deliverableTitle}</strong>
          <p style="color: #999; font-size: 13px; margin: 10px 0 0 0;">
            "${data.commentExcerpt}"
          </p>
        </div>
        <p style="color: #666; font-size: 14px; margin: 20px 0;">
          Please review the feedback and take action.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background: #667eea; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; display: inline-block; font-weight: 600;">
            View Deliverable
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin: 20px 0 0 0; border-top: 1px solid #ddd; padding-top: 20px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

/**
 * Log email for development/testing
 * In development, check MailHog at http://localhost:8025
 */
function logEmailForDevelopment(email: {
  to: string;
  subject: string;
  html: string;
}): void {
  console.log('\n=== EMAIL LOG FOR TESTING ===');
  console.log(`To: ${email.to}`);
  console.log(`Subject: ${email.subject}`);
  console.log(`Body preview: ${email.html.substring(0, 150)}...`);
  console.log('View full emails at: http://localhost:8025');
  console.log('==============================\n');
}
