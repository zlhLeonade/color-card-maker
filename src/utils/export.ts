import { EXPORT_PRESETS, type ExportQuality, type PosterState } from '../types';
import { isColorDark } from './color';
import { getColorName } from './colorName';
import { formatExifDateShort } from './date';
import { generateNoiseTexture } from './noise';
import { getMaxSafePixels } from './browser';

export interface ExportResult {
  ok: boolean;
  method?: 'download' | 'preview';
  error?: string;
}

/* ── Resource loading ─────────────────────────────────────────── */

async function waitForFonts(): Promise<void> {
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise(r => setTimeout(r, 3000)),
    ]);
  } catch { /* ignore */ }
}

function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  const pending = imgs.filter(img => !img.complete && img.src).map(
    img => new Promise<void>(resolve => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      setTimeout(resolve, 2000);
    })
  );
  return Promise.all(pending).then(() => {});
}

export async function prepareForExport(container: HTMLElement): Promise<void> {
  await waitForFonts();
  await waitForImages(container);
  await new Promise(r => setTimeout(r, 100));
}

/* ── Font helpers for Canvas ──────────────────────────────────── */

const FONT_MAP: Record<string, string> = {
  '"Special Elite", cursive': '"Special Elite", cursive',
  '"LXGW WenKai", KaiTi, STKaiti, serif': '"LXGW WenKai", KaiTi, STKaiti, serif',
  'KaiTi, STKaiti, serif': 'KaiTi, STKaiti, serif',
  'SimSun, "Songti SC", serif': 'SimSun, "Songti SC", serif',
  'FangSong, STFangsong, serif': 'FangSong, STFangsong, serif',
  '"Playfair Display", Georgia, serif': '"Playfair Display", Georgia, serif',
  'Georgia, "Times New Roman", serif': 'Georgia, "Times New Roman", serif',
  '"Times New Roman", Times, serif': '"Times New Roman", Times, serif',
  '"Caveat", cursive': '"Caveat", cursive',
  '"Dancing Script", cursive': '"Dancing Script", cursive',
  '"Patrick Hand", cursive': '"Patrick Hand", cursive',
  '"Kalam", cursive': '"Kalam", cursive',
  '"Indie Flower", cursive': '"Indie Flower", cursive',
  '"Shadows Into Light", cursive': '"Shadows Into Light", cursive',
};

function canvasFont(cssFont: string, scale: number, bold = false, italic = false): string {
  const mapped = FONT_MAP[cssFont] || cssFont;
  // Try to extract the primary font family for canvas
  const primary = mapped.split(',')[0].replace(/"/g, '').trim();
  const weight = bold ? 'bold' : 'normal';
  const style = italic ? 'italic' : 'normal';
  return `${style} ${weight} ${Math.round(scale)}px "${primary}"`;
}

/* ── Text wrapping for Canvas ─────────────────────────────────── */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para.trim() === '') { lines.push(''); continue; }
    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' | 'right',
): number {
  const lines = wrapText(ctx, text, maxWidth);
  let currentY = y;

  for (const line of lines) {
    let drawX = x;
    if (align === 'center') drawX = x + maxWidth / 2;
    else if (align === 'right') drawX = x + maxWidth;

    ctx.fillText(line, drawX, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

/* ── Canvas-native export ─────────────────────────────────────── */

export async function canvasExport(
  state: PosterState,
  quality: ExportQuality,
  container: HTMLElement,
): Promise<ExportResult> {
  await prepareForExport(container);

  const preset = EXPORT_PRESETS.find(p => p.id === quality) ?? EXPORT_PRESETS[2];
  let targetW = preset.width;
  let targetH = preset.height;

  // Clamp to safe pixel limit
  const maxPixels = getMaxSafePixels();
  if (targetW * targetH > maxPixels) {
    const ratio = Math.sqrt(maxPixels / (targetW * targetH));
    targetW = Math.floor(targetW * ratio);
    targetH = Math.floor(targetH * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d')!;

  /* 1. Background */
  const dark = isColorDark(state.bgColor);
  const topFade = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)';
  const bottomFade = dark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)';

  // Base color
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, targetW, targetH);

  // Top fade
  const topGrad = ctx.createLinearGradient(0, 0, 0, targetH * 0.2);
  topGrad.addColorStop(0, topFade);
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, targetW, targetH * 0.2);

  // Bottom fade
  const botGrad = ctx.createLinearGradient(0, targetH * 0.8, 0, targetH);
  botGrad.addColorStop(0, 'rgba(0,0,0,0)');
  botGrad.addColorStop(1, bottomFade);
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, targetH * 0.8, targetW, targetH * 0.2);

  /* 2. Noise overlay */
  if (state.showNoise && state.noiseIntensity > 0) {
    try {
      const noiseUrl = generateNoiseTexture();
      const noiseImg = await loadImage(noiseUrl);
      ctx.save();
      ctx.globalAlpha = state.noiseIntensity / 100;
      ctx.globalCompositeOperation = 'overlay';
      // Tile the noise texture
      const pat = ctx.createPattern(noiseImg, 'repeat');
      if (pat) {
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.restore();
    } catch { /* noise is non-critical */ }
  }

  /* 3. Photo */
  if (state.croppedImage) {
    try {
      const photoImg = await loadImage(state.croppedImage);
      const photoH = targetH * 0.55;
      const photoW = targetW;
      // Calculate cover positioning with Y offset
      const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
      const boxAspect = photoW / photoH;

      let srcW: number, srcH: number, srcX: number, srcY: number;

      if (imgAspect > boxAspect) {
        // Image is wider — crop sides
        srcH = photoImg.naturalHeight;
        srcW = srcH * boxAspect;
        srcX = (photoImg.naturalWidth - srcW) / 2;
        // Apply Y offset: offset shifts the crop window
        const yOffsetPx = (state.imageOffsetY / 50) * (photoImg.naturalHeight - srcH) / 2;
        srcY = (photoImg.naturalHeight - srcH) / 2 - yOffsetPx;
      } else {
        // Image is taller — crop top/bottom
        srcW = photoImg.naturalWidth;
        srcH = srcW / boxAspect;
        srcX = 0;
        const yOffsetPx = (state.imageOffsetY / 50) * (photoImg.naturalHeight - srcH) / 2;
        srcY = (photoImg.naturalHeight - srcH) / 2 - yOffsetPx;
      }

      // Clamp srcY
      srcY = Math.max(0, Math.min(photoImg.naturalHeight - srcH, srcY));

      ctx.drawImage(
        photoImg,
        srcX, srcY, srcW, srcH,
        0, targetH - photoH, photoW, photoH,
      );
    } catch { /* photo is important but don't crash */ }
  }

  /* 4. Text elements */
  const infoColor = state.text.color;

  // Main text
  if (state.text.content) {
    const scale = state.text.fontSize * (targetW / 340); // 340 = preview width
    const fontStr = canvasFont(state.text.fontFamily, scale, state.text.bold, state.text.italic);
    ctx.save();
    ctx.font = fontStr;
    ctx.fillStyle = state.text.color;
    ctx.textAlign = state.text.align;
    ctx.textBaseline = 'top';

    const boxW = targetW * (state.text.width / 100);
    const boxX = targetW * (state.text.x / 100) - boxW / 2;
    const boxY = targetH * (state.text.y / 100);

    drawWrappedText(
      ctx,
      state.text.content,
      boxX,
      boxY,
      boxW,
      scale * state.text.lineHeight,
      state.text.align,
    );
    ctx.restore();
  }

  // Helper: info text (date / camera / color)
  const drawInfoText = (
    text: string | null,
    pos: { x: number; y: number },
    font: string,
    fontSize: number,
    opacity: number,
    letterSpacing: number,
  ) => {
    if (!text) return;
    const scale = fontSize * (targetW / 340);
    ctx.save();
    ctx.font = canvasFont(font, scale);
    ctx.fillStyle = infoColor;
    ctx.globalAlpha = opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const textX = targetW * (pos.x / 100);
    const textY = targetH * (pos.y / 100);

    // Apply letter spacing by drawing character by character
    if (letterSpacing > 0) {
      const chars = text.split('');
      let totalWidth = 0;
      for (const ch of chars) totalWidth += ctx.measureText(ch).width;
      totalWidth += letterSpacing * scale * (chars.length - 1);
      let cx = textX - totalWidth / 2;
      for (const ch of chars) {
        ctx.textAlign = 'left';
        ctx.fillText(ch, cx, textY);
        cx += ctx.measureText(ch).width + letterSpacing * scale;
      }
    } else {
      ctx.fillText(text, textX, textY);
    }

    ctx.restore();
  };

  // Date
  const INFO_FONT = '"Special Elite", Georgia, serif';
  const INFO_FONT_COLOR = '"Caveat", "Patrick Hand", cursive';

  if (state.exifSettings.showDate && state.exifData?.dateTime) {
    drawInfoText(
      formatExifDateShort(state.exifData.dateTime),
      state.dateTextBox,
      INFO_FONT, 13, 0.8, 0.08,
    );
  }

  // Camera
  if (state.exifSettings.showCamera && state.exifData?.cameraModel) {
    drawInfoText(
      state.exifData.cameraModel,
      state.cameraTextBox,
      'system-ui, -apple-system, sans-serif', 11, 0.6, 0.06,
    );
  }

  // Color info
  if (state.exifSettings.showColorInfo !== 'none' && state.croppedImage) {
    const colorName = getColorName(state.bgColor);
    const colorStr = state.exifSettings.showColorInfo === 'name-hex'
      ? `${colorName} / ${state.bgColor.toUpperCase()}`
      : colorName;
    drawInfoText(
      colorStr,
      state.colorInfoTextBox,
      INFO_FONT_COLOR, 13, 0.7, 0.04,
    );
  }

  /* 5. Output */
  return downloadCanvas(canvas, targetW, targetH);
}

/* ── html-to-image fallback (desktop) ──────────────────────────── */

export async function htmlExport(
  element: HTMLElement,
  quality: ExportQuality,
): Promise<ExportResult> {
  const { toPng } = await import('html-to-image');
  const preset = EXPORT_PRESETS.find(p => p.id === quality) ?? EXPORT_PRESETS[2];
  const targetW = preset.width;
  const elW = element.offsetWidth;
  const elH = element.offsetHeight;
  const scale = targetW / elW;

  await prepareForExport(element);

  const dataUrl = await toPng(element, {
    width: elW,
    height: elH,
    pixelRatio: scale,
    quality: 1,
    cacheBust: true,
    style: { transform: 'none', transformOrigin: 'top left' },
  });

  return downloadDataUrl(dataUrl, targetW, Math.round(elH * scale));
}

/* ── Download helpers ─────────────────────────────────────────── */

function downloadCanvas(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
): Promise<ExportResult> {
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      if (!blob) {
        resolve({ ok: false, error: '无法生成图片' });
        return;
      }
      downloadBlob(blob, w, h, resolve);
    }, 'image/png');
  });
}

function downloadDataUrl(
  dataUrl: string,
  w: number,
  h: number,
): Promise<ExportResult> {
  const byteStr = atob(dataUrl.split(',')[1]);
  const arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
  const blob = new Blob([arr], { type: 'image/png' });
  return new Promise(resolve => downloadBlob(blob, w, h, resolve));
}

function downloadBlob(
  blob: Blob,
  w: number,
  h: number,
  resolve: (result: ExportResult) => void,
) {
  const url = URL.createObjectURL(blob);
  const dateStr = formatDate();
  const filename = `color-card-${w}x${h}-${dateStr}.png`;

  // Method 1: <a download> click
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);

  let resolved = false;
  const done = (result: ExportResult) => {
    if (resolved) return;
    resolved = true;
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    link.remove();
    resolve(result);
  };

  link.addEventListener('click', () => {
    setTimeout(() => done({ ok: true, method: 'download' }), 1000);
  });

  link.click();

  // Fallback: if download didn't trigger, show preview after 3s
  setTimeout(() => {
    done({ ok: true, method: 'preview' });
    showPreviewFallback(url, filename);
  }, 3000);
}

function showPreviewFallback(url: string, _filename: string) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';

  const img = document.createElement('img');
  img.src = url;
  img.style.cssText = 'max-width:90%;max-height:70vh;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.4);';

  const hint = document.createElement('p');
  hint.textContent = '请长按图片保存';
  hint.style.cssText = 'color:#fff;font-size:15px;margin-top:16px;font-family:system-ui,sans-serif;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.cssText = 'margin-top:16px;padding:10px 32px;border:none;border-radius:8px;background:#fff;color:#333;font-size:15px;font-weight:600;cursor:pointer;';
  closeBtn.onclick = () => overlay.remove();

  overlay.appendChild(img);
  overlay.appendChild(hint);
  overlay.appendChild(closeBtn);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function formatDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/* ── Image loader ─────────────────────────────────────────────── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image`));
    img.src = src;
  });
}
