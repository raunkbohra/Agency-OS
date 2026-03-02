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
