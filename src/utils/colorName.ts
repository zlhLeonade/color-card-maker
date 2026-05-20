/**
 * Map a hex color to an English color name using HSL logic.
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3
    ? parseInt(h[0]+h[0]+h[1]+h[1]+h[2]+h[2], 16)
    : parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

export function getColorName(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);

  // 1. Achromatic: black / white / gray (low saturation)
  if (l < 8) return 'Black';
  if (l > 92) return 'White';
  if (s < 12) return 'Gray';

  // 2. Brown / Beige (warm hues, special lightness handling)
  if (h >= 15 && h < 50) {
    if (l < 35 && s >= 15) return 'Brown';
    if (l >= 35 && l < 75 && s < 40) return 'Brown';
    if (l >= 55 && l < 92 && s < 55) return 'Beige';
  }

  // 3. Chromatic colors by hue (saturation >= 12)
  if (h >= 345 || h < 15) return 'Red';
  if (h >= 15 && h < 45) return 'Orange';
  if (h >= 45 && h < 70) return 'Yellow';
  if (h >= 70 && h < 165) return 'Green';
  if (h >= 165 && h < 190) return 'Teal';
  if (h >= 190 && h < 250) return 'Blue';
  if (h >= 250 && h < 285) return 'Purple';
  if (h >= 285 && h < 345) return 'Pink';

  return 'Gray';
}
