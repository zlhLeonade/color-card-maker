import { forwardRef } from 'react';
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
}

function PosterCanvas(
  { bgColor, croppedImage, imageWidth, text, exifData, exifSettings }: PosterCanvasProps,
  ref: React.Ref<HTMLDivElement>
) {
  const dark = isColorDark(bgColor);
  const topFade = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)';
  const bottomFade = dark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)';

  const dateStr = exifSettings.showDate && exifData?.dateTime
    ? formatExifDateShort(exifData.dateTime) : null;
  const cameraStr = exifSettings.showCamera && exifData?.cameraModel
    ? exifData.cameraModel : null;

  // Info font sizes scale with main text
  const dateFontSize = Math.max(14, Math.round(text.fontSize * 0.42));
  const cameraFontSize = Math.max(12, Math.round(text.fontSize * 0.36));

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

      {/* Text + info block — centered in upper area */}
      <div
        style={{
          position: 'absolute',
          top: `${text.position}%`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '82%',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {/* Main caption */}
        {text.content && (
          <div
            style={{
              fontFamily: text.fontFamily,
              fontSize: `${text.fontSize}px`,
              fontWeight: 300,
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
