/**
 * Generate a subtle noise texture as a base64 data URL.
 * Uses a canvas to create random grayscale pixels.
 */

let cachedNoise: string | null = null;

export function generateNoiseTexture(size = 128): string {
  if (cachedNoise) return cachedNoise;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 25; // low base alpha — intensity controlled via CSS opacity
  }

  ctx.putImageData(imageData, 0, 0);
  cachedNoise = canvas.toDataURL('image/png');
  return cachedNoise;
}
