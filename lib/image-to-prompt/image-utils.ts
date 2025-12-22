import sharp from 'sharp';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_LONG_EDGE = 1536;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Supported: PNG, JPG, JPEG, WEBP' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 8MB' };
  }

  return { valid: true };
}

export async function processAndDownscaleImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const metadata = await sharp(buffer).metadata();
  const { width = 0, height = 0 } = metadata;
  
  const longEdge = Math.max(width, height);
  
  let processedBuffer: Buffer;
  
  if (longEdge > MAX_LONG_EDGE) {
    const scale = MAX_LONG_EDGE / longEdge;
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    
    processedBuffer = await sharp(buffer)
      .resize(newWidth, newHeight, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
  } else {
    processedBuffer = await sharp(buffer)
      .jpeg({ quality: 85 })
      .toBuffer();
  }
  
  const base64 = processedBuffer.toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

export function getAspectRatioGuess(width: number, height: number): string {
  const ratio = width / height;
  
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 0.8) < 0.1) return '4:5';
  if (Math.abs(ratio - 1.5) < 0.1) return '3:2';
  if (Math.abs(ratio - 1.78) < 0.15) return '16:9';
  if (Math.abs(ratio - 0.5625) < 0.1) return '9:16';
  if (Math.abs(ratio - 1.33) < 0.1) return '4:3';
  if (Math.abs(ratio - 0.75) < 0.1) return '3:4';
  
  return 'other';
}
