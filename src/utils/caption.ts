import { hexToRgb, luminance } from './color';

/**
 * Determine the color mood from extracted image colors.
 * Returns a mood tag used to pick themed captions.
 */
function getColorMood(colors: string[]): string {
  if (colors.length === 0) return 'neutral';

  let totalR = 0, totalG = 0, totalB = 0;
  for (const hex of colors) {
    const [r, g, b] = hexToRgb(hex);
    totalR += r;
    totalG += g;
    totalB += b;
  }
  const avgR = totalR / colors.length;
  const avgG = totalG / colors.length;
  const avgB = totalB / colors.length;

  const max = Math.max(avgR, avgG, avgB);
  const min = Math.min(avgR, avgG, avgB);
  const saturation = max === 0 ? 0 : (max - min) / max;

  // Low saturation = muted/neutral
  if (saturation < 0.15) return 'muted';

  // Blue dominant
  if (avgB > avgR && avgB > avgG) return 'blue';
  // Green dominant
  if (avgG > avgR && avgG > avgB) return 'green';
  // Red / pink
  if (avgR > avgG && avgR > avgB && avgR > 150) return 'warm';
  // Yellow / orange
  if (avgR > avgB && avgG > avgB * 0.8 && avgR > 140) return 'golden';

  return 'neutral';
}

/**
 * Check if the background is dark.
 */
function isDarkBg(bgColor: string): boolean {
  return luminance(bgColor) < 0.25;
}

interface CaptionContext {
  bgColor?: string;
  colors?: string[];
  hasDate?: boolean;
  hasCamera?: boolean;
}

// Mood-based caption pools
const CAPTIONS: Record<string, string[]> = {
  blue: [
    'A little piece of sky.',
    'Where the air feels still.',
    'Light, air, and silence.',
    'Chasing the blue hour.',
    'Somewhere near the water.',
    'A quiet shade of blue.',
    'The sky was gentle today.',
    'Soft echoes of the sea.',
  ],
  green: [
    'Found among the leaves.',
    'A field of quiet green.',
    'The forest remembers.',
    'Soft ground, slow steps.',
    'Spring in slow motion.',
    'Between the branches.',
    'A pocket of wilderness.',
    'Where the green fades in.',
  ],
  warm: [
    'A bloom worth keeping.',
    'Soft light, warm hands.',
    'The color of a memory.',
    'A gentle kind of warmth.',
    'Somewhere in the golden hour.',
    'A little fire in the quiet.',
    'Roses at dusk.',
    'Held in a warm glow.',
  ],
  golden: [
    'Somewhere in the afternoon.',
    'A moment of gold.',
    'The day felt warm.',
    'Chasing sunlight.',
    'A pocket of afternoon light.',
    'Sun-drenched and still.',
    'The warmth of a slow day.',
    'Light through the window.',
  ],
  muted: [
    'A quiet moment.',
    'Stillness in motion.',
    'The day felt gentle.',
    'Soft light, slow time.',
    'A soft memory.',
    'Faded but present.',
    'Colors of today.',
    'Between light and shadow.',
  ],
  neutral: [
    'A moment worth keeping.',
    'Found in the light.',
    'A quiet corner of the day.',
    'The ordinary, made still.',
    'Just passing through.',
    'A soft pause.',
    'The world in a frame.',
    'Kept in stillness.',
  ],
};

// Extra captions for dark backgrounds
const DARK_EXTRAS = [
  'In the quiet of the dark.',
  'A moment hidden in shadow.',
  'Where the light is soft.',
  'Night colors, gentle tones.',
];

// Extra captions for camera-equipped shots
const CAMERA_EXTRAS = [
  'Through a faithful lens.',
  'A frame worth remembering.',
  'Captured in passing.',
  'The camera saw it first.',
];

/**
 * Generate a short English caption based on image context.
 */
export function generateCaption(ctx: CaptionContext): string {
  const mood = getColorMood(ctx.colors || []);

  // Build pool from mood
  const pool = [...(CAPTIONS[mood] || CAPTIONS.neutral)];

  // Add dark-specific captions
  if (ctx.bgColor && isDarkBg(ctx.bgColor)) {
    pool.push(...DARK_EXTRAS);
  }

  // Add camera-specific captions
  if (ctx.hasCamera) {
    pool.push(...CAMERA_EXTRAS);
  }

  // Pick a random one
  return pool[Math.floor(Math.random() * pool.length)];
}
