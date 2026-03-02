# Contract Signing Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete contract signing workflow where clients can review contracts, verify their email, draw a signature on canvas, and submit it with automatic email notifications to both parties.

**Architecture:**
- Public signing page accessible via unique token (no auth required)
- Email verification before signature capture (6-digit code valid 10 min)
- Canvas-based signature drawing stored as base64 PNG
- Automatic emails on upload + after signing
- Status tracking on contracts dashboard

**Tech Stack:**
- Next.js API routes, React client components
- HTML5 Canvas for signature drawing
- Nodemailer for email notifications
- PostgreSQL for token/verification storage

---

## Task 1: Create Database Migration for Signing Tokens

**Files:**
- Create: `lib/migrations/012_add_contract_signing_tokens.sql`

**Step 1: Write migration**

```sql
-- lib/migrations/012_add_contract_signing_tokens.sql

CREATE TABLE contract_signing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  signed BOOLEAN DEFAULT false,
  verification_code TEXT,
  code_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_contract_signing_tokens_token ON contract_signing_tokens(token);
CREATE INDEX idx_contract_signing_tokens_contract_id ON contract_signing_tokens(contract_id);

-- Add signature_image column to contract_signatures
ALTER TABLE contract_signatures
ADD COLUMN IF NOT EXISTS signature_image TEXT;
```

**Step 2: Run migration**

```bash
psql $DATABASE_URL -f lib/migrations/012_add_contract_signing_tokens.sql
```

Expected: Table created, indexes created, new column added.

**Step 3: Commit**

```bash
git add lib/migrations/012_add_contract_signing_tokens.sql
git commit -m "feat: add contract signing tokens and signature image column"
```

---

## Task 2: Add Helper Functions for Token & Code Generation

**Files:**
- Modify: `lib/db-queries.ts`

**Step 1: Add functions at end of file**

```typescript
// Add to lib/db-queries.ts (at the end, before closing)

export async function createSigningToken(
  contractId: string,
  email: string
): Promise<{ token: string; code: string }> {
  const token = generateToken(32); // 32-char random string
  const code = generateVerificationCode(); // 6-digit code
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const result = await db.query(
    `INSERT INTO contract_signing_tokens (contract_id, token, email, verification_code, code_expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING token`,
    [contractId, token, email, code, codeExpiresAt]
  );

  return { token: result.rows[0].token, code };
}

export async function verifySigningCode(
  token: string,
  email: string,
  code: string
): Promise<boolean> {
  const result = await db.query(
    `SELECT id, code_expires_at FROM contract_signing_tokens
     WHERE token = $1 AND email = $2 AND verification_code = $3`,
    [token, email, code]
  );

  if (result.rows.length === 0) return false;

  const row = result.rows[0];
  const now = new Date();
  if (row.code_expires_at < now) return false; // Code expired

  // Mark as verified
  await db.query(
    `UPDATE contract_signing_tokens SET verified = true WHERE id = $1`,
    [row.id]
  );

  return true;
}

export async function getSigningTokenData(token: string): Promise<{
  contractId: string;
  email: string;
  verified: boolean;
  signed: boolean;
  fileName: string;
  clientName: string;
} | null> {
  const result = await db.query(
    `SELECT cst.contract_id, cst.email, cst.verified, cst.signed,
            c.file_name, cl.name as client_name
     FROM contract_signing_tokens cst
     JOIN contracts c ON cst.contract_id = c.id
     JOIN clients cl ON c.client_id = cl.id
     WHERE cst.token = $1`,
    [token]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function submitSignature(
  token: string,
  email: string,
  signatureImage: string, // base64 PNG
  signerName: string
): Promise<boolean> {
  const now = new Date();

  const tokenResult = await db.query(
    `SELECT contract_id FROM contract_signing_tokens
     WHERE token = $1 AND email = $2 AND verified = true`,
    [token, email]
  );

  if (tokenResult.rows.length === 0) return false;

  const contractId = tokenResult.rows[0].contract_id;

  // Update contract as signed
  await db.query(
    `UPDATE contracts SET signed = true, signed_at = $1 WHERE id = $2`,
    [now, contractId]
  );

  // Create signature record
  await db.query(
    `INSERT INTO contract_signatures (contract_id, signer_name, signed_date, signature_image)
     VALUES ($1, $2, $3, $4)`,
    [contractId, signerName, now, signatureImage]
  );

  // Mark token as signed
  await db.query(
    `UPDATE contract_signing_tokens SET signed = true WHERE token = $1`,
    [token]
  );

  return true;
}

// Helper functions
function generateToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

**Step 2: Test in your database**

```bash
cd /Users/raunakbohra/Desktop/Agency\ OS
npm run dev  # Keep running
```

In another terminal, verify imports work:
```bash
node -e "require('./lib/db-queries.ts')" 2>&1 | head -20
```

Expected: No import errors (TypeScript compilation succeeds)

**Step 3: Commit**

```bash
git add lib/db-queries.ts
git commit -m "feat: add signing token and verification functions"
```

---

## Task 3: Add Email Templates for Signing Workflow

**Files:**
- Modify: `lib/email.ts`

**Step 1: Add new email function**

```typescript
// Add to lib/email.ts (before final export or at end)

export async function sendSigningRequestEmail(options: {
  to: string;
  clientName: string;
  agencyName: string;
  contractFileName: string;
  signingUrl: string;
}) {
  const { to, clientName, agencyName, contractFileName, signingUrl } = options;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to,
    subject: `Sign your contract — ${contractFileName}`,
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

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0070f3,#7c3aed);border-radius:12px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:700;font-size:14px;line-height:36px;">A</span>
                  </td>
                  <td style="padding-left:10px;color:#1a1a1a;font-size:17px;font-weight:600;vertical-align:middle;">${agencyName}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1a1a1a;">Hi ${clientName},</p>
              <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">
                Your contract is ready for signature. Please review it below and sign when you're ready.
              </p>

              <!-- File info -->
              <div style="background:#f3f4f6;border-left:4px solid #0070f3;padding:12px;margin-bottom:24px;border-radius:4px;">
                <p style="margin:0;font-size:13px;color:#666;"><strong>Document:</strong> ${contractFileName}</p>
              </div>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${signingUrl}"
                      style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0070f3,#7c3aed);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      Review & Sign Contract
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#999;">
                This link is for your use only. Don't share it with others.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#999;">
                © ${new Date().getFullYear()} ${agencyName} · All rights reserved
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

export async function sendSignatureConfirmationEmail(options: {
  to: string;
  clientName: string;
  agencyName: string;
  contractFileName: string;
}) {
  const { to, clientName, agencyName, contractFileName } = options;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to,
    subject: 'Contract signed successfully',
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

          <!-- Card -->
          <tr>
            <td style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:40px 36px;text-align:center;">

              <div style="font-size:40px;margin-bottom:16px;">✓</div>
              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1a1a1a;">Contract Signed</p>
              <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">
                Thank you for signing! We've received your signature on <strong>${contractFileName}</strong> and will proceed accordingly.
              </p>

              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />

              <p style="margin:0;font-size:12px;color:#999;">
                Keep this email for your records. If you have any questions, please don't hesitate to reach out.
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

export async function sendSignatureNotificationEmail(options: {
  to: string;
  agencyName: string;
  clientName: string;
  contractFileName: string;
  signedDate: Date;
}) {
  const { to, agencyName, clientName, contractFileName, signedDate } = options;
  const dateStr = signedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to,
    subject: `Contract signed: ${clientName} — ${contractFileName}`,
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

          <!-- Card -->
          <tr>
            <td style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1a1a1a;">Contract Signed</p>
              <p style="margin:0 0 24px;font-size:13px;color:#666;">
                ${clientName} has signed <strong>${contractFileName}</strong>
              </p>

              <!-- Details -->
              <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Signed Date</p>
                <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:500;">${dateStr}</p>
              </div>

              <!-- View button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients"
                      style="display:inline-block;padding:10px 24px;background:#0070f3;color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>
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
```

**Step 2: Verify email imports work**

```bash
npm run build 2>&1 | grep -i "error" | head -5
```

Expected: No errors related to email.ts

**Step 3: Commit**

```bash
git add lib/email.ts
git commit -m "feat: add signing request and confirmation email templates"
```

---

## Task 4: Create API Route for Generating Signing Request

**Files:**
- Create: `app/api/contracts/[id]/send-signing-request/route.ts`

**Step 1: Create file**

```typescript
// app/api/contracts/[id]/send-signing-request/route.ts

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createSigningToken } from '@/lib/db-queries';
import { sendSigningRequestEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contractId } = await params;

    // Get contract details
    const contractResult = await db.query(
      `SELECT c.*, cl.name as client_name, cl.email as client_email, a.name as agency_name
       FROM contracts c
       JOIN clients cl ON c.client_id = cl.id
       JOIN agencies a ON c.agency_id = a.id
       WHERE c.id = $1 AND c.agency_id = $2`,
      [contractId, session.user.agencyId]
    );

    if (contractResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    // Generate signing token
    const { token, code } = await createSigningToken(contractId, contract.client_email);

    // Build signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/contracts/${token}`;

    // Send email to client
    await sendSigningRequestEmail({
      to: contract.client_email,
      clientName: contract.client_name,
      agencyName: contract.agency_name,
      contractFileName: contract.file_name,
      signingUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Signing request sent to client',
      token,
    });
  } catch (error) {
    console.error('Error sending signing request:', error);
    return NextResponse.json(
      { error: 'Failed to send signing request' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "app/api/contracts" | head -5
```

Expected: No errors in this file

**Step 3: Commit**

```bash
git add app/api/contracts/[id]/send-signing-request/route.ts
git commit -m "feat: add API endpoint to send signing request email"
```

---

## Task 5: Create API Route for Email Verification

**Files:**
- Create: `app/api/sign/verify-code/route.ts`

**Step 1: Create file**

```typescript
// app/api/sign/verify-code/route.ts

import { verifySigningCode } from '@/lib/db-queries';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, code } = body;

    if (!token || !email || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const verified = await verifySigningCode(token, email, code);

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | grep "sign/verify" | head -5
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/sign/verify-code/route.ts
git commit -m "feat: add email verification code endpoint"
```

---

## Task 6: Create API Route to Submit Signature

**Files:**
- Create: `app/api/sign/submit-signature/route.ts`

**Step 1: Create file**

```typescript
// app/api/sign/submit-signature/route.ts

import { submitSignature, getSigningTokenData } from '@/lib/db-queries';
import { sendSignatureConfirmationEmail, sendSignatureNotificationEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, signatureImage, signerName } = body;

    if (!token || !email || !signatureImage || !signerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get contract data before submitting
    const tokenData = await getSigningTokenData(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Submit signature
    const success = await submitSignature(token, email, signatureImage, signerName);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to submit signature' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Send confirmation email to client
    await sendSignatureConfirmationEmail({
      to: email,
      clientName: tokenData.clientName,
      agencyName: process.env.NEXT_PUBLIC_APP_NAME || 'Agency OS',
      contractFileName: tokenData.fileName,
    });

    // Send notification email to agency (get from env or config)
    const agencyEmail = process.env.SMTP_FROM || 'noreply@agencyos.dev';
    if (agencyEmail) {
      await sendSignatureNotificationEmail({
        to: agencyEmail,
        agencyName: process.env.NEXT_PUBLIC_APP_NAME || 'Agency OS',
        clientName: tokenData.clientName,
        contractFileName: tokenData.fileName,
        signedDate: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting signature:', error);
    return NextResponse.json(
      { error: 'Failed to submit signature' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | grep "sign/submit" | head -5
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/sign/submit-signature/route.ts
git commit -m "feat: add signature submission endpoint with email notifications"
```

---

## Task 7: Create API Route to Get Signing Page Data

**Files:**
- Create: `app/api/sign/contracts/[token]/route.ts`

**Step 1: Create file**

```typescript
// app/api/sign/contracts/[token]/route.ts

import { getSigningTokenData } from '@/lib/db-queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const data = await getSigningTokenData(token);

    if (!data) {
      return NextResponse.json(
        { error: 'Signing link not found or expired' },
        { status: 404 }
      );
    }

    if (data.signed) {
      return NextResponse.json(
        { error: 'This contract has already been signed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      contractId: data.contractId,
      fileName: data.fileName,
      clientName: data.clientName,
      email: data.email,
      verified: data.verified,
    });
  } catch (error) {
    console.error('Error fetching signing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract details' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | grep "sign/contracts" | head -5
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/sign/contracts/[token]/route.ts
git commit -m "feat: add endpoint to fetch signing page data"
```

---

## Task 8: Create Signature Canvas Component

**Files:**
- Create: `components/SignatureCanvas.tsx`

**Step 1: Create file**

```typescript
// components/SignatureCanvas.tsx

'use client';

import { useRef, useEffect, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string) => void;
}

export default function SignatureCanvas({ onSignatureChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = 200;
    }

    // Set up canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();

    if (isEmpty) setIsEmpty(false);
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setIsEmpty(true);
    onSignatureChange('');
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-border-default rounded-lg overflow-hidden bg-bg-tertiary">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair touch-none"
          style={{ display: 'block', backgroundColor: '#fff' }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearSignature}
          disabled={isEmpty}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary border border-border-default rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>

      <p className="text-xs text-text-tertiary">
        Sign above using your mouse or finger
      </p>
    </div>
  );
}
```

**Step 2: Verify component syntax**

```bash
npx tsc --noEmit components/SignatureCanvas.tsx 2>&1 | head -10
```

Expected: No errors

**Step 3: Commit**

```bash
git add components/SignatureCanvas.tsx
git commit -m "feat: add signature canvas component for drawing signatures"
```

---

## Task 9: Create Public Signing Page (Email Verification Step)

**Files:**
- Create: `app/sign/contracts/[token]/page.tsx`

**Step 1: Create file**

```typescript
// app/sign/contracts/[token]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SignatureCanvas from '@/components/SignatureCanvas';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type Step = 'verify-email' | 'verify-code' | 'sign' | 'success' | 'error';

export default function ContractSigningPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<Step>('verify-email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [signature, setSignature] = useState('');
  const [signerName, setSignerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState<any>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  // Fetch contract data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sign/contracts/${token}`);
        if (res.ok) {
          const data = await res.json();
          setContractData(data);
          setEmail(data.email);
          // If already verified, skip to signing
          if (data.verified) {
            setStep('sign');
          }
        } else {
          const data = await res.json();
          setError(data.error || 'Invalid signing link');
          setStep('error');
        }
      } catch (err) {
        setError('Failed to load contract');
        setStep('error');
      }
    };

    fetchData();
  }, [token]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sign/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });

      if (res.ok) {
        setVerificationSent(true);
        setStep('verify-code');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sign/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, code }),
      });

      if (res.ok) {
        setStep('sign');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature || !signerName) {
      setError('Please draw a signature and enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sign/submit-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          signatureImage: signature,
          signerName,
        }),
      });

      if (res.ok) {
        setStep('success');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit signature');
      }
    } catch (err) {
      setError('Failed to submit signature');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-xl p-6">
          <h1 className="text-xl font-bold text-accent-red mb-2">Signing Link Invalid</h1>
          <p className="text-sm text-text-secondary mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="text-sm text-accent-blue hover:text-accent-blue/80 font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Contract Signed</h1>
          <p className="text-sm text-text-secondary mb-6">
            Thank you for signing! We've received your signature and sent you a confirmation email.
          </p>
          <p className="text-xs text-text-tertiary">
            You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="bg-bg-secondary border border-border-default rounded-xl p-6 md:p-8">
          {contractData && (
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                {contractData.fileName}
              </h1>
              <p className="text-sm text-text-secondary mb-8">
                Signing request for {contractData.clientName}
              </p>
            </>
          )}

          {error && (
            <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Email Verification */}
          {step === 'verify-email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 'verify-code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-text-secondary">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('verify-email')}
                className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Use different email
              </button>
            </form>
          )}

          {/* Step 3: Signature */}
          {step === 'sign' && (
            <form onSubmit={handleSubmitSignature} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Draw Your Signature *
                </label>
                <SignatureCanvas onSignatureChange={setSignature} />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                  placeholder="Your full name"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !signature || !signerName}
                className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting...' : 'Sign & Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify component**

```bash
npx tsc --noEmit app/sign/contracts/[token]/page.tsx 2>&1 | head -10
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/sign/contracts/[token]/page.tsx
git commit -m "feat: add public contract signing page with email verification"
```

---

## Task 10: Create API Route to Send Verification Code

**Files:**
- Create: `app/api/sign/send-code/route.ts`

**Step 1: Create file**

```typescript
// app/api/sign/send-code/route.ts

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
  ignoreTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify token exists and email matches
    const result = await db.query(
      `SELECT id, verification_code FROM contract_signing_tokens
       WHERE token = $1 AND email = $2`,
      [token, email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid token or email' },
        { status: 400 }
      );
    }

    const verificationCode = result.rows[0].verification_code;

    // Send email with code
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
      to: email,
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
                  ${verificationCode}
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify**

```bash
npx tsc --noEmit app/api/sign/send-code/route.ts 2>&1 | head -10
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/sign/send-code/route.ts
git commit -m "feat: add verification code email endpoint"
```

---

## Task 11: Update Contract Upload to Auto-Send Signing Request

**Files:**
- Modify: `app/api/contracts/upload/route.ts`

**Step 1: Read current file to understand structure**

```bash
head -100 app/api/contracts/upload/route.ts
```

**Step 2: Update to call send-signing-request after upload**

Find the section where file is uploaded successfully (look for `router.push` or final success), and add:

```typescript
// After successful upload, send signing request email
try {
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/contracts/${contractId}/send-signing-request`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` },
  });
} catch (err) {
  console.error('Failed to send signing request:', err);
  // Don't fail the upload if email fails
}
```

Actually, let me check the current upload route structure first. Let me read it:

```bash
cat app/api/contracts/upload/route.ts | head -150
```

Instead of modifying without seeing it, let me note: **After step 12 (dashboard updates), we'll update the upload endpoint to call the signing request API.**

**Step 3: Mark as pending**

---

## Task 12: Add Status Badges to Contracts Dashboard

**Files:**
- Modify: `app/dashboard/clients/[id]/page.tsx`

**Step 1: Update contract display section**

In the contracts section, update the StatusBadge display. Find the line:
```typescript
<StatusBadge status={contract.signed ? 'signed' : 'unsigned'} />
```

And update it to:
```typescript
<StatusBadge status={contract.signed ? 'signed' : 'awaiting-signature'} />
```

Then find the contracts table section and do the same.

**Step 2: Update StatusBadge component to handle 'awaiting-signature'**

**Files:**
- Modify: `components/shared/status-badge.tsx`

Add to the status mapping:
```typescript
'awaiting-signature': 'text-yellow-600 bg-yellow-50 border-yellow-200',
```

**Step 3: Test in browser**

Open `/dashboard/clients/[any-id]` and verify unsigned contracts show "Awaiting Signature" badge.

**Step 4: Commit**

```bash
git add app/dashboard/clients/[id]/page.tsx components/shared/status-badge.tsx
git commit -m "feat: add 'awaiting signature' status badge for unsigned contracts"
```

---

## Task 13: Update Contract Upload Endpoint to Trigger Signing Email

**Files:**
- Modify: `app/api/contracts/upload/route.ts`

**Step 1: Read current file**

```bash
wc -l app/api/contracts/upload/route.ts
cat app/api/contracts/upload/route.ts
```

**Step 2: Find success section and add signing request**

After the section that says something like "router.push" or returns success, add:

```typescript
// Send signing request email to client
try {
  const signingRequestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/contracts/${contractId}/send-signing-request`;
  const signingRes = await fetch(signingRequestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
    },
  });

  if (!signingRes.ok) {
    console.error('Failed to send signing request email');
    // Don't fail upload if email fails
  }
} catch (err) {
  console.error('Error sending signing request:', err);
}
```

Add this before the `router.push` or success response.

**Step 3: Test**

Upload a contract via `/dashboard/contracts/upload` and check MailHog at `http://localhost:8025` to see if signing request email was sent.

**Step 4: Commit**

```bash
git add app/api/contracts/upload/route.ts
git commit -m "feat: auto-send signing request email when contract is uploaded"
```

---

## Task 14: Integration Test — Full Workflow

**Step 1: Set up test environment**

Make sure you have:
- `npm run dev` running on `http://localhost:3000`
- MailHog running on `http://localhost:8025`
- Database migrations applied

**Step 2: Upload a contract**

1. Go to `/dashboard/contracts/upload`
2. Select a client
3. Select a plan
4. Upload a test PDF
5. Click "Upload Contract"

**Step 3: Check signing email sent**

1. Go to `http://localhost:8025`
2. Look for email with subject "Sign your contract"
3. Copy the signing link

**Step 4: Test signing flow**

1. Open signing link in new tab
2. Enter email
3. Click "Send Verification Code"
4. Check MailHog for code email
5. Enter 6-digit code
6. Draw signature
7. Enter signer name
8. Click "Sign & Submit"
9. Should see success message

**Step 5: Verify in dashboard**

1. Go back to client page
2. Verify contract now shows "Signed" badge
3. Check signed_at timestamp is set

**Step 6: Check notifications**

1. In MailHog, look for client confirmation email
2. Look for agency notification email

**Step 7: Commit**

```bash
git add -A  # Should be mostly empty
git commit -m "test: verify full contract signing workflow"
```

---

## Summary

**Files Created:**
- `lib/migrations/012_add_contract_signing_tokens.sql`
- `app/api/contracts/[id]/send-signing-request/route.ts`
- `app/api/sign/send-code/route.ts`
- `app/api/sign/verify-code/route.ts`
- `app/api/sign/submit-signature/route.ts`
- `app/api/sign/contracts/[token]/route.ts`
- `components/SignatureCanvas.tsx`
- `app/sign/contracts/[token]/page.tsx`

**Files Modified:**
- `lib/db-queries.ts` (added 5 functions)
- `lib/email.ts` (added 3 email functions)
- `app/api/contracts/upload/route.ts` (trigger signing email)
- `app/dashboard/clients/[id]/page.tsx` (status badge)
- `components/shared/status-badge.tsx` (add awaiting-signature status)

**Key Features:**
✅ Public signing page with canvas signature
✅ Email verification flow (6-digit code)
✅ Auto-emails on contract upload
✅ Client confirmation email after signing
✅ Agency notification email
✅ Status tracking on dashboard
✅ Signature metadata stored (name, date, image)

