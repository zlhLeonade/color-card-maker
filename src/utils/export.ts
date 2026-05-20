import { toPng } from 'html-to-image';
import { EXPORT_PRESETS, COLLAGE_EXPORT_PRESETS, type ExportQuality, type CollageExportQuality } from '../types';

/**
 * Export an HTML element as a high-quality PNG.
 *
 * Strategy: clone the element at its natural display size, apply a CSS
 * transform: scale() to reach the target resolution, then render to a
 * canvas at exactly targetWidth × targetHeight pixels.
 *
 * This preserves all percentage-based and em-based child layouts while
 * producing a crisp high-res output.
 */
export async function exportToPng(
  element: HTMLElement,
  quality: ExportQuality = 'fhd'
): Promise<void> {
  const preset = EXPORT_PRESETS.find(p => p.id === quality) ?? EXPORT_PRESETS[2];
  const { width: targetW, height: targetH } = preset;

  // Element's actual display size in CSS pixels
  const elW = element.offsetWidth;
  const elH = element.offsetHeight;

  // Scale factor to reach target resolution
  const scale = targetW / elW;

  const dataUrl = await toPng(element, {
    width: elW,
    height: elH,
    pixelRatio: scale,
    quality: 1,
    cacheBust: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
  });

  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  link.download = `color-card-${targetW}x${targetH}-${dateStr}.png`;
  link.href = dataUrl;
  link.click();
}

export async function exportCollageToPng(
  element: HTMLElement,
  quality: CollageExportQuality = 'fhd'
): Promise<void> {
  const preset = COLLAGE_EXPORT_PRESETS.find(p => p.id === quality) ?? COLLAGE_EXPORT_PRESETS[1];
  const { width: targetW } = preset;

  const elW = element.offsetWidth;
  const scale = targetW / elW;

  const dataUrl = await toPng(element, {
    width: elW,
    height: element.offsetHeight,
    pixelRatio: scale,
    quality: 1,
    cacheBust: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
  });

  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  link.download = `collage-${targetW}x${preset.height}-${dateStr}.png`;
  link.href = dataUrl;
  link.click();
}
