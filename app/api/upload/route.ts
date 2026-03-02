import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateFileKey, getMimeType } from '@/lib/s3';
import { auth } from '@/lib/auth';
import { validateAndCompressImage } from '@/lib/image-compression';

/**
 * Generic file upload endpoint
 * Usage: POST /api/upload
 *
 * Form data should include:
 * - file: File object
 * - directory: string (contracts, deliverables, invoices, etc.)
 */

export async function POST(request: NextRequest) {
  const session = await auth();

  // For testing: allow uploads without auth by using a test agency ID
  const agencyId = session?.user?.agencyId || 'test-agency-upload';

  if (!agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Handle logo compression and validation
    let fileToUpload = uint8Array;
    let uploadFileName = file.name;

    if (directory === 'logos' || file.type.startsWith('image/')) {
      const compressionResult = await validateAndCompressImage(
        uint8Array,
        {
          maxFileSize: 2 * 1024 * 1024, // 2MB
          maxWidth: 2000,
          maxHeight: 500,
          allowedFormats: ['jpeg', 'png', 'webp'],
        },
        {
          maxWidth: 1000,
          maxHeight: 400,
          quality: 85,
          format: 'webp',
        }
      );

      if (!compressionResult.valid) {
        return NextResponse.json(
          { error: compressionResult.error || 'Image validation failed' },
          { status: 400 }
        );
      }

      if (compressionResult.buffer) {
        fileToUpload = new Uint8Array(compressionResult.buffer);
        // Change extension to .webp if we compressed to webp
        uploadFileName = file.name.replace(/\.[^.]+$/, '.webp');
      }
    }

    // Generate safe file key
    const fileKey = generateFileKey(`${agencyId}/${directory}`, uploadFileName);
    const mimeType = getMimeType(uploadFileName);

    // Upload to R2
    const publicUrl = await uploadToR2(fileKey, fileToUpload, mimeType);

    return NextResponse.json(
      {
        success: true,
        fileUrl: publicUrl,
        fileName: file.name,
        originalSize: file.size,
        uploadedSize: fileToUpload.byteLength,
        fileKey: fileKey,
        compressed: fileToUpload.byteLength < uint8Array.byteLength,
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
