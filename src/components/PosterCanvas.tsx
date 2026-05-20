import { forwardRef, useRef, useState, useCallback, useMemo } from 'react';
import type { TextStyle, TextBoxPos, ExifData, ExifSettings } from '../types';
import { isColorDark } from '../utils/color';
import { getColorName } from '../utils/colorName';
import { formatExifDateShort } from '../utils/date';
import { generateNoiseTexture } from '../utils/noise';

interface PosterCanvasProps {
  bgColor: string;
  croppedImage: string | null;
  imageOffsetY: number;
  showNoise: boolean;
  noiseIntensity: number;
  text: TextStyle;
  mainTextBox: TextBoxPos;
  dateTextBox: TextBoxPos;
  cameraTextBox: TextBoxPos;
  colorInfoTextBox: TextBoxPos;
  exifData: ExifData | null;
  exifSettings: ExifSettings;
  isExporting: boolean;
  onMainTextPosChange: (x: number, y: number) => void;
  onDatePosChange: (x: number, y: number) => void;
  onCameraPosChange: (x: number, y: number) => void;
  onColorInfoPosChange: (x: number, y: number) => void;
}

// ── Snap guides ──────────────────────────────────────────────
const VERTICAL_GUIDES = [50];
const HORIZONTAL_GUIDES = [5, 10, 16, 25, 33, 42, 50, 60, 70, 80, 85, 90, 94];
const SNAP_THRESHOLD_X = 3;
const SNAP_THRESHOLD_Y = 2.5;

interface ActiveGuides {
  vertical: number | null;
  horizontal: number | null;
}

function findNearest(value: number, guides: number[], threshold: number): number | null {
  let best: number | null = null;
  let bestDist = threshold;
  for (const g of guides) {
    const d = Math.abs(value - g);
    if (d < bestDist) { bestDist = d; best = g; }
  }
  return best;
}

function applySnap(rawX: number, rawY: number): { x: number; y: number; guides: ActiveGuides } {
  const snapV = findNearest(rawX, VERTICAL_GUIDES, SNAP_THRESHOLD_X);
  const snapH = findNearest(rawY, HORIZONTAL_GUIDES, SNAP_THRESHOLD_Y);
  return {
    x: snapV !== null ? snapV : rawX,
    y: snapH !== null ? snapH : rawY,
    guides: { vertical: snapV, horizontal: snapH },
  };
}

// ── Shared hook: drag logic for one box ──
function useBoxDrag(
  pos: TextBoxPos,
  onPosChange: (x: number, y: number) => void,
  isExporting: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [dragging, setDragging] = useState(false);
  const [guides, setGuides] = useState<ActiveGuides>({ vertical: null, horizontal: null });
  const start = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const clampX = useCallback((v: number) => Math.max(5, Math.min(95, v)), []);
  const clampY = useCallback((v: number) => Math.max(2, Math.min(98, v)), []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isExporting) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    setDragging(true);
  }, [isExporting, pos.x, pos.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const rawX = clampX(start.current.x + ((e.clientX - start.current.px) / rect.width) * 100);
    const rawY = clampY(start.current.y + ((e.clientY - start.current.py) / rect.height) * 100);
    const snapped = applySnap(rawX, rawY);
    setGuides(snapped.guides);
    onPosChange(snapped.x, snapped.y);
  }, [dragging, clampX, clampY, onPosChange, containerRef]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    setGuides({ vertical: null, horizontal: null });
  }, []);

  return { dragging, guides, handlePointerDown, handlePointerMove, handlePointerUp };
}

/* ── Draggable text box ── */
function DraggableBox({
  x, y, width, isExporting, dragging, guides, dark, selected,
  onPointerDown, onPointerMove, onPointerUp, children,
}: {
  x: number; y: number; width: string;
  isExporting: boolean; dragging: boolean; guides: ActiveGuides; dark: boolean;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  children: React.ReactNode;
}) {
  const guideColor = dark ? 'rgba(100,180,255,0.5)' : 'rgba(60,140,220,0.45)';

  return (
    <>
      {!isExporting && dragging && guides.vertical !== null && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${guides.vertical}%`, width: '1px',
          background: guideColor, zIndex: 20, pointerEvents: 'none',
        }} />
      )}
      {!isExporting && dragging && guides.horizontal !== null && (
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: `${guides.horizontal}%`, height: '1px',
          background: guideColor, zIndex: 20, pointerEvents: 'none',
        }} />
      )}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'absolute',
          top: `${y}%`,
          left: `${x}%`,
          transform: 'translate(-50%, 0)',
          width,
          zIndex: 10,
          cursor: isExporting ? 'default' : (dragging ? 'grabbing' : 'grab'),
          touchAction: 'none',
          userSelect: 'none',
          padding: '6px 4px',
          borderRadius: '4px',
          transition: dragging ? 'none' : 'top 0.15s ease, left 0.15s ease',
        }}
      >
        {children}
        {/* Selection / drag hint — hidden during export */}
        {!isExporting && (selected || dragging) && (
          <div style={{
            position: 'absolute', inset: -2,
            border: `1.5px dashed ${dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.18)'}`,
            borderRadius: '4px', pointerEvents: 'none',
            opacity: dragging ? 1 : 0.6,
          }} />
        )}
      </div>
    </>
  );
}

/* ── Info text style (shared by date / camera / color) ── */
const INFO_FONT = '"Special Elite", Georgia, serif';
const INFO_FONT_COLOR = '"Caveat", "Patrick Hand", cursive';

/* ── Main component ── */
function PosterCanvas(
  { bgColor, croppedImage, imageOffsetY, showNoise, noiseIntensity,
    text, mainTextBox, dateTextBox, cameraTextBox, colorInfoTextBox,
    exifData, exifSettings, isExporting,
    onMainTextPosChange, onDatePosChange, onCameraPosChange, onColorInfoPosChange }: PosterCanvasProps,
  ref: React.Ref<HTMLDivElement>
) {
  const dark = isColorDark(bgColor);
  const topFade = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)';
  const bottomFade = dark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)';

  const noiseUrl = useMemo(() => generateNoiseTexture(), []);

  // Content strings
  const dateStr = exifSettings.showDate && exifData?.dateTime
    ? formatExifDateShort(exifData.dateTime) : null;
  const cameraStr = exifSettings.showCamera && exifData?.cameraModel
    ? exifData.cameraModel : null;
  const colorNameStr = exifSettings.showColorInfo !== 'none' && croppedImage
    ? getColorName(bgColor) : null;
  const colorHexStr = exifSettings.showColorInfo === 'name-hex' ? bgColor.toUpperCase() : null;

  const containerRef = useRef<HTMLDivElement>(null);

  // Drag hooks for each box
  const mainDrag = useBoxDrag(mainTextBox, onMainTextPosChange, isExporting, containerRef);
  const dateDrag = useBoxDrag(dateTextBox, onDatePosChange, isExporting, containerRef);
  const cameraDrag = useBoxDrag(cameraTextBox, onCameraPosChange, isExporting, containerRef);
  const colorDrag = useBoxDrag(colorInfoTextBox, onColorInfoPosChange, isExporting, containerRef);

  // Track which box is "selected" (last dragged or clicked)
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  const selectBox = useCallback((id: string) => {
    if (!isExporting) setSelectedBox(id);
  }, [isExporting]);

  // Deselect on background click
  const handleBgClick = useCallback(() => setSelectedBox(null), []);

  // Text color for info boxes: slightly muted version of main text color
  const infoColor = text.color;

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
      onClick={handleBgClick}
    >
      {/* Background layer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to bottom, ${topFade} 0%, transparent 20%, transparent 80%, ${bottomFade} 100%), ${bgColor}`,
        transition: 'background 0.5s ease',
      }} />

      {/* Noise overlay */}
      {showNoise && noiseIntensity > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${noiseUrl})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          opacity: noiseIntensity / 100,
          mixBlendMode: 'overlay',
          zIndex: 2,
          pointerEvents: 'none',
        }} />
      )}

      {/* ── 1. Main text box ── */}
      <DraggableBox
        x={mainTextBox.x} y={mainTextBox.y} width={`${text.width}%`}
        isExporting={isExporting} dragging={mainDrag.dragging}
        guides={mainDrag.guides} dark={dark}
        selected={selectedBox === 'main'}
        onPointerDown={(e) => { selectBox('main'); mainDrag.handlePointerDown(e); }}
        onPointerMove={mainDrag.handlePointerMove}
        onPointerUp={mainDrag.handlePointerUp}
      >
        {text.content && (
          <div style={{
            fontFamily: text.fontFamily,
            fontSize: `${text.fontSize}px`,
            fontWeight: text.bold ? 700 : 300,
            fontStyle: text.italic ? 'italic' : 'normal',
            color: text.color,
            textAlign: text.align,
            letterSpacing: `${text.letterSpacing}em`,
            lineHeight: text.lineHeight,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            transition: 'color 0.4s ease',
          }}>
            {text.content}
          </div>
        )}
      </DraggableBox>

      {/* ── 2. Date text box ── */}
      {dateStr && (
        <DraggableBox
          x={dateTextBox.x} y={dateTextBox.y} width="50%"
          isExporting={isExporting} dragging={dateDrag.dragging}
          guides={dateDrag.guides} dark={dark}
          selected={selectedBox === 'date'}
          onPointerDown={(e) => { selectBox('date'); dateDrag.handlePointerDown(e); }}
          onPointerMove={dateDrag.handlePointerMove}
          onPointerUp={dateDrag.handlePointerUp}
        >
          <div style={{
            fontFamily: INFO_FONT,
            fontSize: '13px',
            fontWeight: 400,
            color: infoColor,
            opacity: 0.8,
            textAlign: 'center',
            letterSpacing: '0.08em',
            lineHeight: 1.5,
            transition: 'color 0.4s ease',
          }}>
            {dateStr}
          </div>
        </DraggableBox>
      )}

      {/* ── 3. Camera text box ── */}
      {cameraStr && (
        <DraggableBox
          x={cameraTextBox.x} y={cameraTextBox.y} width="50%"
          isExporting={isExporting} dragging={cameraDrag.dragging}
          guides={cameraDrag.guides} dark={dark}
          selected={selectedBox === 'camera'}
          onPointerDown={(e) => { selectBox('camera'); cameraDrag.handlePointerDown(e); }}
          onPointerMove={cameraDrag.handlePointerMove}
          onPointerUp={cameraDrag.handlePointerUp}
        >
          <div style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            fontWeight: 400,
            color: infoColor,
            opacity: 0.6,
            textAlign: 'center',
            letterSpacing: '0.06em',
            lineHeight: 1.5,
            transition: 'color 0.4s ease',
          }}>
            {cameraStr}
          </div>
        </DraggableBox>
      )}

      {/* ── 4. Color info text box ── */}
      {colorNameStr && (
        <DraggableBox
          x={colorInfoTextBox.x} y={colorInfoTextBox.y} width="50%"
          isExporting={isExporting} dragging={colorDrag.dragging}
          guides={colorDrag.guides} dark={dark}
          selected={selectedBox === 'color'}
          onPointerDown={(e) => { selectBox('color'); colorDrag.handlePointerDown(e); }}
          onPointerMove={colorDrag.handlePointerMove}
          onPointerUp={colorDrag.handlePointerUp}
        >
          <div style={{
            fontFamily: INFO_FONT_COLOR,
            fontSize: '13px',
            fontWeight: 400,
            color: infoColor,
            opacity: 0.7,
            textAlign: 'center',
            letterSpacing: '0.04em',
            lineHeight: 1.5,
            transition: 'color 0.4s ease',
          }}>
            {colorNameStr}{colorHexStr ? ` / ${colorHexStr}` : ''}
          </div>
        </DraggableBox>
      )}

      {/* Photo layer — fixed 100% width, object-position for Y offset */}
      {croppedImage && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          width: '100%',
          height: '55%',
          zIndex: 5,
          overflow: 'hidden',
        }}>
          <img
            src={croppedImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `center ${50 - imageOffsetY}%`,
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default forwardRef(PosterCanvas);
