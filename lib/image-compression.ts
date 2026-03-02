import sharp from 'sharp';

export interface ImageValidationOptions {
  maxFileSize?: number; // bytes
  maxWidth?: number; // pixels
  maxHeight?: number; // pixels
  allowedFormats?: string[]; // 'jpeg', 'png', 'webp', 'svg'
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Validate image dimensions and file size
 */
export async function validateImage(
  buffer: Uint8Array,
  options: ImageValidationOptions
): Promise<ImageValidationResult> {
  try {
    const defaultOptions = {
      maxFileSize: 2 * 1024 * 1024, // 2MB
      maxWidth: 2000,
      maxHeight: 500,
      allowedFormats: ['jpeg', 'png', 'webp'],
      ...options,
    };

    // Check file size
    if (buffer.byteLength > defaultOptions.maxFileSize) {
      return {
        valid: false,
        error: `File size (${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${(defaultOptions.maxFileSize / 1024 / 1024).toFixed(1)}MB`,
        size: buffer.byteLength,
      };
    }

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    if (!metadata) {
      return {
        valid: false,
        error: 'Unable to read image metadata',
      };
    }

    const format = metadata.format?.toLowerCase() || '';
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Check format
    if (!defaultOptions.allowedFormats.includes(format)) {
      return {
        valid: false,
        error: `Image format '${format}' not supported. Allowed formats: ${defaultOptions.allowedFormats.join(', ')}`,
        format,
      };
    }

    // Check dimensions
    if (width > defaultOptions.maxWidth) {
      return {
        valid: false,
        error: `Image width (${width}px) exceeds limit of ${defaultOptions.maxWidth}px`,
        width,
        height,
        format,
      };
    }

    if (height > defaultOptions.maxHeight) {
      return {
        valid: false,
        error: `Image height (${height}px) exceeds limit of ${defaultOptions.maxHeight}px`,
        width,
        height,
        format,
      };
    }

    return {
      valid: true,
      width,
      height,
      format,
      size: buffer.byteLength,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Compress image and convert to optimized format
 */
export async function compressImage(
  buffer: Uint8Array,
  options: CompressionOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1000,
    maxHeight = 400,
    quality = 85,
    format = 'webp',
  } = options;

  try {
    let transformer = sharp(buffer);

    // Resize if needed (maintain aspect ratio)
    transformer = transformer.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Convert to optimized format with quality
    if (format === 'webp') {
      transformer = transformer.webp({ quality });
    } else if (format === 'png') {
      transformer = transformer.png({ quality: Math.min(quality, 100) / 100 });
    } else if (format === 'jpeg') {
      transformer = transformer.jpeg({ quality, progressive: true });
    }

    const compressedBuffer = await transformer.toBuffer();
    return compressedBuffer;
  } catch (error) {
    throw new Error(
      `Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate and compress image in one step
 */
export async function validateAndCompressImage(
  buffer: Uint8Array,
  validationOptions: ImageValidationOptions,
  compressionOptions: CompressionOptions = {}
): Promise<{ valid: boolean; error?: string; buffer?: Buffer }> {
  // Validate first
  const validation = await validateImage(buffer, validationOptions);

  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
    };
  }

  // Compress
  try {
    const compressedBuffer = await compressImage(buffer, compressionOptions);
    return {
      valid: true,
      buffer: compressedBuffer,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Compression failed',
    };
  }
}
