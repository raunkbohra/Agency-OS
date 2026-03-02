import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false, // MailHog doesn't use TLS
  ignoreTLS: true,
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to,
    subject: 'Reset your Agency OS password',
    text: `Click the link below to reset your password. It expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#060609;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060609;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0070f3,#7c3aed);border-radius:12px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:700;font-size:14px;line-height:36px;">A</span>
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:17px;font-weight:600;vertical-align:middle;">Agency OS</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(12,12,20,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#fff;">Reset your password</p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                We received a request to reset the password for your Agency OS account. Click the button below — this link expires in <strong style="color:#9ca3af;">1 hour</strong>.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                      style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0070f3,#7c3aed);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;color:#3b3b4f;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${resetUrl}" style="color:#60a5fa;word-break:break-all;">${resetUrl}</a>
              </p>

              <hr style="margin:28px 0;border:none;border-top:1px solid rgba(255,255,255,0.06);" />

              <p style="margin:0;font-size:12px;color:#3b3b4f;">
                If you didn't request a password reset, you can safely ignore this email. Your password won't change.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#3b3b4f;">
                © ${new Date().getFullYear()} Agency OS · Agency management, simplified.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

export async function sendClientEmail(options: {
  to: string;
  clientName: string;
  agencyName: string;
  subject: string;
  body: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to: options.to,
    subject: options.subject,
    text: options.body,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <span style="font-size:20px;font-weight:700;color:#0d1117;">${options.agencyName}</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0d1117;">Hi ${options.clientName},</p>
            <div style="margin:20px 0;font-size:14px;color:#4b5563;line-height:1.7;white-space:pre-wrap;">${options.body}</div>
            <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="margin:0;font-size:12px;color:#9ca3af;">Sent via Agency OS · ${options.agencyName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendInvoiceEmail(options: {
  to: string;
  clientName: string;
  agencyName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currencySymbol: string;
  billingPeriod: string;
  dueDate: string;
  payUrl: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to: options.to,
    subject: `New Invoice from ${options.agencyName} — ${options.billingPeriod}`,
    text: `Hi ${options.clientName},\n\nYou have a new invoice for ${options.billingPeriod}.\n\nAmount Due: ${options.currencySymbol}${options.amount.toFixed(2)}\nDue Date: ${options.dueDate}\n\nView and pay your invoice:\n${options.payUrl}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <span style="font-size:20px;font-weight:700;color:#0d1117;">${options.agencyName}</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0d1117;">Hi ${options.clientName},</p>
            <p style="margin:12px 0;font-size:14px;color:#4b5563;">You have a new invoice for <strong>${options.billingPeriod}</strong>.</p>

            <div style="margin:24px 0;padding:16px;background:#f3f4f6;border-left:3px solid #0070f3;border-radius:4px;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Amount Due</p>
              <p style="margin:0;font-size:28px;font-weight:700;color:#0d1117;">${options.currencySymbol}${options.amount.toFixed(2)}</p>
              <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Due: ${options.dueDate}</p>
            </div>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
              <tr>
                <td align="center">
                  <a href="${options.payUrl}"
                    style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0070f3,#7c3aed);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
                    View &amp; Pay Invoice
                  </a>
                </td>
              </tr>
            </table>

            <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="margin:0;font-size:12px;color:#9ca3af;">Invoice #${options.invoiceNumber} · Sent via Agency OS</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendSigningRequestEmail(options: {
  to: string;
  clientName: string;
  agencyName: string;
  contractFileName: string;
  signingUrl: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to: options.to,
    subject: `Sign your contract — ${options.contractFileName}`,
    text: `Hi ${options.clientName},\n\nYour contract "${options.contractFileName}" is ready for signature. Please review and sign it at:\n\n${options.signingUrl}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <span style="font-size:20px;font-weight:700;color:#0d1117;">${options.agencyName}</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0d1117;">Hi ${options.clientName},</p>
            <p style="margin:12px 0;font-size:14px;color:#4b5563;">Your contract is ready for signature. Please review and sign the document below.</p>

            <div style="margin:24px 0;padding:16px;background:#f3f4f6;border-left:3px solid #0070f3;border-radius:4px;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Contract</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#0d1117;">${options.contractFileName}</p>
            </div>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
              <tr>
                <td align="center">
                  <a href="${options.signingUrl}"
                    style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0070f3,#7c3aed);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
                    Review &amp; Sign Contract
                  </a>
                </td>
              </tr>
            </table>

            <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="margin:0;font-size:12px;color:#9ca3af;">Sent via Agency OS · ${options.agencyName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendSignatureConfirmationEmail(options: {
  to: string;
  clientName: string;
  agencyName: string;
  contractFileName: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to: options.to,
    subject: 'Contract signed successfully',
    text: `Hi ${options.clientName},\n\nThank you for signing ${options.contractFileName}. We've received your signature and your contract is now fully executed.`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <span style="font-size:20px;font-weight:700;color:#0d1117;">${options.agencyName}</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:36px 32px;">
            <div style="margin:0 0 24px;text-align:center;">
              <span style="font-size:48px;line-height:48px;">✓</span>
            </div>

            <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0d1117;text-align:center;">Contract Signed</p>
            <p style="margin:12px 0 0;font-size:14px;color:#4b5563;text-align:center;">Thank you for signing <strong>${options.contractFileName}</strong></p>

            <div style="margin:24px 0;padding:16px;background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">We've received your signature and your contract is now fully executed. A copy has been saved to your records.</p>
            </div>

            <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Sent via Agency OS · ${options.agencyName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendSignatureNotificationEmail(options: {
  to: string;
  agencyName: string;
  clientName: string;
  contractFileName: string;
  signedDate: Date;
}): Promise<void> {
  const formattedDate = options.signedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/clients`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to: options.to,
    subject: `Contract signed: ${options.clientName} — ${options.contractFileName}`,
    text: `${options.clientName} has signed ${options.contractFileName} on ${formattedDate}.\n\nView the signed contract in your dashboard:\n${dashboardUrl}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <span style="font-size:20px;font-weight:700;color:#0d1117;">${options.agencyName}</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0d1117;"><strong>${options.clientName}</strong> has signed <strong>${options.contractFileName}</strong></p>
            <p style="margin:12px 0;font-size:14px;color:#4b5563;">Signed on <strong>${formattedDate}</strong></p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
              <tr>
                <td align="center">
                  <a href="${dashboardUrl}"
                    style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0070f3,#7c3aed);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
                    View in Dashboard
                  </a>
                </td>
              </tr>
            </table>

            <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="margin:0;font-size:12px;color:#9ca3af;">Sent via Agency OS</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendVerificationCodeEmail(options: {
  to: string;
  code: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to: options.to,
    subject: 'Your verification code',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:40px 36px;text-align:center;">
              <p style="margin:0 0 24px;font-size:14px;color:#666;">Your verification code is:</p>
              <div style="background:#f3f4f6;padding:24px;border-radius:8px;margin-bottom:24px;">
                <p style="margin:0;font-size:32px;font-weight:600;color:#1a1a1a;font-family:monospace;letter-spacing:8px;">
                  ${options.code}
                </p>
              </div>
              <p style="margin:0;font-size:12px;color:#999;">
                This code expires in 10 minutes.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

export async function sendClientInviteEmail(options: {
  to: string;
  clientName: string;
  agencyName: string;
  setupUrl: string;
}): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
      to: options.to,
      subject: `Welcome to ${options.agencyName}! Set up your account`,
      text: `Hi ${options.clientName},\n\nYou have been invited to ${options.agencyName}. Please click below to set your password and access your client portal.\n\n${options.setupUrl}\n\nThis is an automated message. Please do not reply.`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <span style="font-size:20px;font-weight:700;color:#0d1117;">${options.agencyName}</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0d1117;">Hi ${options.clientName},</p>
            <p style="margin:12px 0;font-size:14px;color:#4b5563;line-height:1.6;">You have been invited to <strong>${options.agencyName}</strong>. Please click below to set your password and access your client portal.</p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
              <tr>
                <td align="center">
                  <a href="${options.setupUrl}"
                    style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0070f3,#7c3aed);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
                    Set Up Your Account
                  </a>
                </td>
              </tr>
            </table>

            <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated message. Please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });
  } catch (error) {
    console.error('Failed to send client invite email:', error);
    // Don't throw - email failures shouldn't block the API
  }
}
