import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.R2_ENDPOINT,
});

export async function uploadFileToR2(
  file: File,
  folder: string = 'contracts'
): Promise<string> {
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${folder}/${uuidv4()}-${file.name}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'agency-os-dev',
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return the public R2 URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to R2');
  }
}

export async function uploadSignatureToR2(
  signatureDataUrl: string,
  contractId: string
): Promise<string> {
  try {
    // Convert base64 data URL to buffer
    const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const fileName = `signatures/${contractId}/${uuidv4()}.png`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'agency-os-dev',
      Key: fileName,
      Body: fileBuffer,
      ContentType: 'image/png',
    });

    await s3Client.send(command);

    // Return the public R2 URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('Signature upload to R2 error:', error);
    throw new Error('Failed to upload signature to R2');
  }
}
