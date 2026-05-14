import { forwardRef } from 'react';
import type { TextStyle, ExifData, ExifSettings } from '../types';
import { isColorDark } from '../utils/color';

interface PosterCanvasProps {
  bgColor: string;
  croppedImage: string | null;
  imageWidth: number;
  text: TextStyle;
  exifData: ExifData | null;
  exifSettings: ExifSettings;
}

function PosterCanvas(
  { bgColor, croppedImage, imageWidth, text, exifData, exifSettings }: PosterCanvasProps,
  ref: React.Ref<HTMLDivElement>
) {
  // Build subtle background gradient: lighter top edge, stable middle, slightly darker bottom edge
  const dark = isColorDark(bgColor);
  const topFade = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)';
  const bottomFade = dark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)';

  // EXIF info line
  const exifParts: string[] = [];
  if (exifSettings.showDate && exifData?.dateTime) exifParts.push(exifData.dateTime);
  if (exifSettings.showCamera && exifData?.cameraModel) exifParts.push(exifData.cameraModel);
  const exifLine = exifParts.join(' · ');

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        aspectRatio: '3 / 4',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background layer — upper portion with subtle internal gradient */}
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

      {/* Text layer — positioned in upper background area */}
      {text.content && (
        <div
          style={{
            position: 'absolute',
            top: `${text.position}%`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '82%',
            textAlign: 'center',
            fontFamily: text.fontFamily,
            fontSize: `${text.fontSize}px`,
            fontWeight: 300,
            color: text.color,
            letterSpacing: `${text.letterSpacing}em`,
            lineHeight: text.lineHeight,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            zIndex: 10,
            transition: 'color 0.4s ease',
          }}
        >
          {text.content}
        </div>
      )}

      {/* EXIF info — smaller, below main text */}
      {exifLine && (
        <div
          style={{
            position: 'absolute',
            top: `${text.position + text.fontSize * 0.06 + 4}%`,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            fontFamily: '"Special Elite", Georgia, serif',
            fontSize: `${Math.max(12, text.fontSize * 0.38)}px`,
            fontWeight: 400,
            color: text.color,
            opacity: 0.55,
            letterSpacing: '0.08em',
            zIndex: 10,
            transition: 'color 0.4s ease',
          }}
        >
          {exifLine}
        </div>
      )}

      {/* Photo layer — full width at bottom, clear edge */}
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
