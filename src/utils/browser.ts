/**
 * Browser detection for export compatibility.
 */

export interface BrowserInfo {
  isIOS: boolean;
  isSafari: boolean;
  isQuark: boolean;
  isIOSWebView: boolean;
  /** Browsers with known html-to-image / large-canvas issues */
  isProblematic: boolean;
}

function detect(): BrowserInfo {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isQuark = /Quark/i.test(ua);
  const isIOSWebView = isIOS && !isSafari && !/CriOS|FxiOS/.test(ua);

  return {
    isIOS,
    isSafari,
    isQuark,
    isIOSWebView,
    isProblematic: isIOS || isQuark,
  };
}

export const browserInfo: BrowserInfo = detect();

/** Max safe pixel count for this browser (to avoid OOM crashes) */
export function getMaxSafePixels(): number {
  if (browserInfo.isIOS) return 1620 * 2160;   // ~3.5MP
  if (browserInfo.isQuark) return 1620 * 2160;
  return 3240 * 4320; // ~14MP desktop
}

/** Recommend a default quality for this browser */
export function getRecommendedQuality(): 'sd' | 'hd' | 'fhd' | 'uhd' {
  if (browserInfo.isIOS || browserInfo.isQuark) return 'hd';
  return 'fhd';
}
