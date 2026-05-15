import { forwardRef, useRef, useState, useCallback } from 'react';
import type { TextStyle, ExifData, ExifSettings } from '../types';
import { isColorDark } from '../utils/color';
import { formatExifDateShort } from '../utils/date';

interface PosterCanvasProps {
  bgColor: string;
  croppedImage: string | null;
  imageWidth: number;
  text: TextStyle;
  exifData: ExifData | null;
  exifSettings: ExifSettings;
  isExporting: boolean;
  onPositionChange: (x: number, y: number) => void;
}

// ── Snap guides ──────────────────────────────────────────────
const VERTICAL_GUIDES = [50];                         // horizontal positions (%)
const HORIZONTAL_GUIDES = [5, 10, 16, 25, 33, 42];   // vertical positions (%)

// Snap threshold in percentage of container dimension
const SNAP_THRESHOLD_X = 3;   // ~10px on a 340px wide container
const SNAP_THRESHOLD_Y = 2.5; // ~11px on a 453px tall container

interface ActiveGuides {
  vertical: number | null;   // x% of the snapped vertical center line
  horizontal: number | null; // y% of the snapped horizontal line
}

/**
 * Find the nearest guide within threshold.
 * Returns the guide value if within range, otherwise null.
 */
function findNearest(value: number, guides: number[], threshold: number): number | null {
  let best: number | null = null;
  let bestDist = threshold;
  for (const g of guides) {
    const d = Math.abs(value - g);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

/**
 * Apply snap logic to a raw (x, y) position.
 * Returns snapped position and which guides are active.
 */
function applySnap(rawX: number, rawY: number): { x: number; y: number; guides: ActiveGuides } {
  const snapV = findNearest(rawX, VERTICAL_GUIDES, SNAP_THRESHOLD_X);
  const snapH = findNearest(rawY, HORIZONTAL_GUIDES, SNAP_THRESHOLD_Y);

  return {
    x: snapV !== null ? snapV : rawX,
    y: snapH !== null ? snapH : rawY,
    guides: { vertical: snapV, horizontal: snapH },
  };
}

function PosterCanvas(
  { bgColor, croppedImage, imageWidth, text, exifData, exifSettings, isExporting, onPositionChange }: PosterCanvasProps,
  ref: React.Ref<HTMLDivElement>
) {
  const dark = isColorDark(bgColor);
  const topFade = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)';
  const bottomFade = dark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)';

  const dateStr = exifSettings.showDate && exifData?.dateTime
    ? formatExifDateShort(exifData.dateTime) : null;
  const cameraStr = exifSettings.showCamera && exifData?.cameraModel
    ? exifData.cameraModel : null;

  const dateFontSize = Math.max(14, Math.round(text.fontSize * 0.42));
  const cameraFontSize = Math.max(12, Math.round(text.fontSize * 0.36));

  // Drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [activeGuides, setActiveGuides] = useState<ActiveGuides>({ vertical: null, horizontal: null });
  const dragStart = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const clampX = useCallback((v: number) => Math.max(5, Math.min(95, v)), []);
  const clampY = useCallback((v: number) => Math.max(2, Math.min(50, v)), []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isExporting) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragStart.current = { px: e.clientX, py: e.clientY, x: text.x, y: text.y };
    setDragging(true);
  }, [isExporting, text.x, text.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Raw position from pointer delta
    const rawX = clampX(dragStart.current.x + ((e.clientX - dragStart.current.px) / rect.width) * 100);
    const rawY = clampY(dragStart.current.y + ((e.clientY - dragStart.current.py) / rect.height) * 100);

    // Apply snap
    const snapped = applySnap(rawX, rawY);
    setActiveGuides(snapped.guides);
    onPositionChange(snapped.x, snapped.y);
  }, [dragging, clampX, clampY, onPositionChange]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    setActiveGuides({ vertical: null, horizontal: null });
  }, []);

  // Guide line color: adapts to background darkness
  const guideColor = dark ? 'rgba(100,180,255,0.5)' : 'rgba(60,140,220,0.45)';

  return (
    <div
      ref={(node) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={{
        width: '100%',
        aspectRatio: '3 / 4',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            to bottom,
            ${topFade} 0%,
            transparent 20%,
            transparent 80%,
            ${bottomFade} 100%
          ), ${bgColor}`,
          transition: 'background 0.5s ease',
        }}
      />

      {/* ── Snap guide lines (edit only) ── */}
      {!isExporting && dragging && activeGuides.vertical !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${activeGuides.vertical}%`,
            width: '1px',
            background: guideColor,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      )}
      {!isExporting && dragging && activeGuides.horizontal !== null && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${activeGuides.horizontal}%`,
            height: '1px',
            background: guideColor,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Text block — draggable */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'absolute',
          top: `${text.y}%`,
          left: `${text.x}%`,
          transform: 'translate(-50%, 0)',
          width: `${text.width}%`,
          textAlign: text.align,
          zIndex: 10,
          cursor: isExporting ? 'default' : (dragging ? 'grabbing' : 'grab'),
          touchAction: 'none',
          userSelect: 'none',
          padding: '12px 8px',
          borderRadius: '8px',
          transition: dragging ? 'none' : 'top 0.15s ease, left 0.15s ease',
        }}
      >
        {/* Drag hint indicator (hidden during export and drag) */}
        {!isExporting && !dragging && (
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              color: text.color,
              opacity: 0.4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            ↕ ↔ 拖动移动
          </div>
        )}

        {/* Main caption */}
        {text.content && (
          <div
            style={{
              fontFamily: text.fontFamily,
              fontSize: `${text.fontSize}px`,
              fontWeight: text.bold ? 700 : 300,
              fontStyle: text.italic ? 'italic' : 'normal',
              color: text.color,
              letterSpacing: `${text.letterSpacing}em`,
              lineHeight: text.lineHeight,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              transition: 'color 0.4s ease',
            }}
          >
            {text.content}
          </div>
        )}

        {/* Date line */}
        {dateStr && (
          <div
            style={{
              fontFamily: '"Special Elite", Georgia, serif',
              fontSize: `${dateFontSize}px`,
              fontWeight: 400,
              fontStyle: text.italic ? 'italic' : 'normal',
              color: text.color,
              opacity: 0.75,
              letterSpacing: '0.08em',
              marginTop: `${Math.round(text.fontSize * 0.7)}px`,
              transition: 'color 0.4s ease',
            }}
          >
            {dateStr}
          </div>
        )}

        {/* Camera line */}
        {cameraStr && (
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: `${cameraFontSize}px`,
              fontWeight: 400,
              fontStyle: text.italic ? 'italic' : 'normal',
              color: text.color,
              opacity: 0.6,
              letterSpacing: '0.06em',
              marginTop: `${Math.round(text.fontSize * 0.25)}px`,
              transition: 'color 0.4s ease',
            }}
          >
            {cameraStr}
          </div>
        )}

        {/* Selection border (hidden during export) */}
        {!isExporting && (
          <div
            style={{
              position: 'absolute',
              inset: -2,
              border: `1.5px dashed ${dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'}`,
              borderRadius: '8px',
              pointerEvents: 'none',
              opacity: dragging ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}
          />
        )}
      </div>

      {/* Photo layer */}
      {croppedImage && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `${imageWidth}%`,
            height: '55%',
            zIndex: 5,
          }}
        >
          <img
            src={croppedImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default forwardRef(PosterCanvas);
