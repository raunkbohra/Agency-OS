import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateFileKey, getMimeType } from '@/lib/s3';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * Generic file upload endpoint
 * Usage: POST /api/upload?directory=contracts|deliverables|invoices
 *
 * Form data should include:
 * - file: File object
 * - directory: string (contracts, deliverables, invoices, etc.)
 */

export async function POST(request: NextRequest) {
  const agency = await requireAuth(request);
  if (!agency) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const directory = formData.get('directory') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Generate safe file key
    const fileKey = generateFileKey(`${agency.id}/${directory}`, file.name);
    const mimeType = getMimeType(file.name);

    // Upload to R2
    const publicUrl = await uploadToR2(fileKey, uint8Array, mimeType);

    return NextResponse.json(
      {
        success: true,
        fileUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileKey: fileKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'File upload failed' },
      { status: 500 }
    );
  }
}
