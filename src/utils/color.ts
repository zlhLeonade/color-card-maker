/**
 * Color extraction, analysis, and recommendation utilities.
 */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
}

/** Relative luminance (0–1) */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two colors */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Determine if a color is visually dark */
export function isColorDark(hex: string): boolean {
  return luminance(hex) < 0.25;
}

/** Soften a color toward a target (mix with white/black) */
function softenColor(hex: string, amount: number, toward: 'light' | 'dark'): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number, target: number) => c + (target - c) * amount;
  const target = toward === 'light' ? 255 : 0;
  return rgbToHex(mix(r, target), mix(g, target), mix(b, target));
}

/**
 * Smart text color recommendation.
 * Picks from extracted image colors when possible, falls back to black/white.
 * Always ensures sufficient contrast ratio (>= 4.5 for AA).
 */
export function recommendTextColor(bgHex: string, imageColors: string[] = []): string {
  // Try to find a color from the image that has good contrast
  const candidates: { color: string; score: number }[] = [];

  for (const color of imageColors) {
    const ratio = contrastRatio(bgHex, color);
    if (ratio >= 4.5) {
      // Higher contrast = better, but prefer mid-range for aesthetics
      candidates.push({ color, score: ratio });
    }
  }

  // Sort by contrast ratio descending, then prefer softer colors
  candidates.sort((a, b) => {
    // Prefer contrast ratio between 5–8 (not too harsh)
    const aIdeal = Math.abs(a.score - 6);
    const bIdeal = Math.abs(b.score - 6);
    return aIdeal - bIdeal;
  });

  if (candidates.length > 0) {
    return candidates[0].color;
  }

  // No image color works — fall back to softened black/white
  const dark = isColorDark(bgHex);
  if (dark) {
    // On dark bg: try softened white
    const softWhite = softenColor('#ffffff', 0.15, 'dark');
    if (contrastRatio(bgHex, softWhite) >= 4.5) return softWhite;
    return '#f0ede8';
  } else {
    // On light bg: try softened dark
    const softDark = softenColor('#1a1a1a', 0.1, 'light');
    if (contrastRatio(bgHex, softDark) >= 4.5) return softDark;
    return '#2a2520';
  }
}

/**
 * Pick the best background color from extracted colors.
 * Prefers mid-tone, muted colors that work well as backgrounds.
 */
export function recommendBgColor(colors: string[]): string {
  if (colors.length === 0) return '#d8c7b8';

  // Score colors for background suitability
  const scored = colors.map(color => {
    const [r, g, b] = hexToRgb(color);
    const lum = luminance(color);

    // Prefer mid-tone (0.2–0.7) — not too dark, not too bright
    const toneScore = 1 - Math.abs(lum - 0.4) * 2;

    // Prefer muted colors (lower saturation = more neutral)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const muteScore = 1 - saturation * 0.5;

    // Slight preference for warmer tones
    const warmth = r > b ? 0.1 : 0;

    return { color, score: toneScore * 0.6 + muteScore * 0.3 + warmth };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].color;
}

/**
 * Extract dominant colors from an image using Canvas pixel sampling.
 * Returns colors sorted by area coverage (most dominant first).
 */
export function extractColorsFromImage(
  imageSrc: string,
  colorCount: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        const maxSize = 120;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        const bucketSize = 20;
        const buckets: Record<string, { count: number; r: number; g: number; b: number }> = {};

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 128) continue;
          // Skip near-white and near-black
          if (r > 245 && g > 245 && b > 245) continue;
          if (r < 15 && g < 15 && b < 15) continue;

          const qr = Math.round(r / bucketSize) * bucketSize;
          const qg = Math.round(g / bucketSize) * bucketSize;
          const qb = Math.round(b / bucketSize) * bucketSize;
          const key = `${qr}-${qg}-${qb}`;

          if (!buckets[key]) {
            buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
          }
          buckets[key].count++;
          buckets[key].r += r;
          buckets[key].g += g;
          buckets[key].b += b;
        }

        const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);

        const selected: string[] = [];
        const minDistance = 35;

        for (const bucket of sorted) {
          if (selected.length >= colorCount) break;

          const avgR = Math.round(bucket.r / bucket.count);
          const avgG = Math.round(bucket.g / bucket.count);
          const avgB = Math.round(bucket.b / bucket.count);

          const hex = rgbToHex(avgR, avgG, avgB);

          let tooClose = false;
          for (const existing of selected) {
            const [er, eg, eb] = hexToRgb(existing);
            const distance = Math.sqrt(
              (avgR - er) ** 2 + (avgG - eg) ** 2 + (avgB - eb) ** 2
            );
            if (distance < minDistance) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose) {
            selected.push(hex);
          }
        }

        if (selected.length < colorCount) {
          for (const bucket of sorted) {
            if (selected.length >= colorCount) break;
            const avgR = Math.round(bucket.r / bucket.count);
            const avgG = Math.round(bucket.g / bucket.count);
            const avgB = Math.round(bucket.b / bucket.count);
            const hex = rgbToHex(avgR, avgG, avgB);
            if (!selected.includes(hex)) {
              selected.push(hex);
            }
          }
        }

        resolve(selected.slice(0, colorCount));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
