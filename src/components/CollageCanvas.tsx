import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import type { CollagePhoto, CollageTemplate } from '../types';

interface CollageCanvasProps {
  photos: CollagePhoto[];
  template: CollageTemplate;
  bgColor: string;
  gap: number;
  padding: number;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
  isExporting: boolean;
}

const CollageCanvas = forwardRef<HTMLDivElement, CollageCanvasProps>(
  ({ photos, template, bgColor, gap, padding, selectedSlot, onSelectSlot, isExporting }, ref) => {
    const cells = template.cells;

    return (
      <div
        ref={ref}
        className="w-full overflow-hidden rounded-lg"
        style={{
          aspectRatio: '16 / 9',
          backgroundColor: bgColor,
          padding: `${padding}px`,
        }}
      >
        <div className="relative w-full h-full" style={{ gap: `${gap}px` }}>
          {cells.map((cell, i) => {
            const photo = photos[i];
            const isSelected = selectedSlot === i;

            return (
              <div
                key={`${template.id}-${i}`}
                className="absolute overflow-hidden transition-shadow duration-150"
                style={{
                  left: `${cell.x}%`,
                  top: `${cell.y}%`,
                  width: `calc(${cell.w}% - ${gap * (cell.w < 100 ? 0.5 : 1)}px)`,
                  height: `calc(${cell.h}% - ${gap * (cell.h < 100 ? 0.5 : 1)}px)`,
                  backgroundColor: '#2a2a2a',
                }}
                onClick={() => !isExporting && onSelectSlot(i)}
              >
                {photo ? (
                  <img
                    src={photo.src}
                    alt={photo.originalName}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[11px] text-stone-500 font-medium">
                      {i + 1}
                    </span>
                  </div>
                )}

                {/* Selection ring */}
                {isSelected && !isExporting && (
                  <motion.div
                    layoutId="slotRing"
                    className="absolute inset-0 border-2 border-white/80 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}

                {/* Empty slot hint */}
                {!photo && !isExporting && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-[10px] text-stone-500">点击添加</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CollageCanvas.displayName = 'CollageCanvas';
export default CollageCanvas;
