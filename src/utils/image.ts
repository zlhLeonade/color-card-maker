import exifr from 'exifr';
import type { ExifData } from '../types';

/**
 * Generate a cropped image from a source image and crop area.
 */
export function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Failed to load image for cropping'));
    image.src = imageSrc;
  });
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
      // Try parsing "YYYY:MM:DD HH:MM:SS" format
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
