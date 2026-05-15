import exifr from 'exifr';
import type { ExifData } from '../types';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Apply rotation and flip to an image, returning a new data URL.
 * Used to create a transformed display image for the cropper.
 */
export async function transformImage(
  imageSrc: string,
  rotation: number,
  flipH: boolean,
  flipV: boolean
): Promise<string> {
  if (rotation === 0 && !flipH && !flipV) return imageSrc;

  const image = await loadImage(imageSrc);
  const rotRad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotRad));
  const sin = Math.abs(Math.sin(rotRad));

  let bBoxWidth = cos * image.width + sin * image.height;
  let bBoxHeight = sin * image.width + cos * image.height;

  const MAX = 4096;
  const scale = Math.min(1, MAX / Math.max(bBoxWidth, bBoxHeight));
  bBoxWidth = Math.round(bBoxWidth * scale);
  bBoxHeight = Math.round(bBoxHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.scale(scale, scale);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Crop a region from an image.
 * The imageSrc should already have rotation/flip applied.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await loadImage(imageSrc);
  const MAX = 4096;
  const scale = Math.min(1, MAX / Math.max(pixelCrop.width, pixelCrop.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pixelCrop.width * scale);
  canvas.height = Math.round(pixelCrop.height * scale);
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, canvas.width, canvas.height
  );

  return canvas.toDataURL('image/png');
}

/**
 * Read EXIF data from an image file.
 */
export async function readExifData(file: File): Promise<ExifData> {
  try {
    const meta = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'DateTime', 'Model', 'Make'],
    });

    const result: ExifData = {};

    // Extract date
    const rawDate = meta?.DateTimeOriginal || meta?.DateTime;
    if (rawDate instanceof Date) {
      const y = rawDate.getFullYear();
      const m = String(rawDate.getMonth() + 1).padStart(2, '0');
      const d = String(rawDate.getDate()).padStart(2, '0');
      result.dateTime = `${y}.${m}.${d}`;
    } else if (typeof rawDate === 'string') {
      const match = rawDate.match(/(\d{4}):(\d{2}):(\d{2})/);
      if (match) {
        result.dateTime = `${match[1]}.${match[2]}.${match[3]}`;
      }
    }

    // Extract camera model
    const model = meta?.Model;
    if (typeof model === 'string') {
      result.cameraModel = model.trim();
    }

    return result;
  } catch {
    return {};
  }
}
