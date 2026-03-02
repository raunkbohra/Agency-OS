import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 Storage Client
 * Uses AWS SDK v3 with R2-compatible endpoints
 */

const s3Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.R2_ENDPOINT,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'agency-os';

/**
 * Upload a file to R2
 * @param key - File path in bucket (e.g., "contracts/contract-123.pdf")
 * @param body - File content (Buffer or Uint8Array)
 * @param contentType - MIME type (e.g., "application/pdf")
 * @returns Public URL to the uploaded file
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return public URL (R2 public bucket format)
    // Adjust domain if you're using a custom domain
    const publicUrl = `${process.env.R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error(`Failed to upload file to R2: ${key}`, error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL for temporary access (expires in 1 hour)
 * @param key - File path in bucket
 * @returns Signed URL valid for 1 hour
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
  } catch (error) {
    console.error(`Failed to generate signed URL for: ${key}`, error);
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from R2
 * @param key - File path in bucket
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error(`Failed to delete file from R2: ${key}`, error);
    throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a safe file key with timestamp and random suffix
 * @param directory - Folder path (e.g., "contracts", "deliverables", "invoices")
 * @param fileName - Original file name
 * @returns Safe key for storage (e.g., "contracts/invoice-123-1709395200.pdf")
 */
export function generateFileKey(directory: string, fileName: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomSuffix = Math.random().toString(36).substring(7);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `${directory}/${sanitizedName}-${timestamp}-${randomSuffix}`;
}

/**
 * Extract file extension from file name
 * @param fileName - Original file name (e.g., "invoice.pdf")
 * @returns Extension (e.g., "pdf")
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get MIME type from file extension
 * @param fileName - File name with extension
 * @returns MIME type (e.g., "application/pdf")
 */
export function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

export { s3Client };
