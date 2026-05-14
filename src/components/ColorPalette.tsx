import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface ColorPaletteProps {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  onRefresh: () => void;
}

export default function ColorPalette({
  colors,
  selectedColor,
  onSelect,
  onRefresh,
}: ColorPaletteProps) {
  if (colors.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-stone-400 tracking-wide uppercase font-medium">
          提取的颜色
        </span>
        <button
          onClick={onRefresh}
          className="text-[11px] text-stone-400 active:text-stone-600 flex items-center gap-1.5 transition-colors min-h-[44px] px-2 -mr-2"
        >
          <RefreshCw size={12} />
          刷新
        </button>
      </div>
      <div className="flex gap-3 justify-center">
        {colors.map((color, i) => (
          <motion.button
            key={color}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => onSelect(color)}
            className="flex flex-col items-center gap-1.5 group p-1"
          >
            <div className="relative">
              <div
                className="w-11 h-11 rounded-full transition-transform duration-200 group-active:scale-90"
                style={{ backgroundColor: color }}
              />
              {selectedColor === color && (
                <motion.div
                  layoutId="colorRing"
                  className="absolute -inset-[3px] rounded-full border-2 border-stone-700"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </div>
            <span className="text-[9px] text-stone-400 font-mono tracking-tight">
              {color.toUpperCase()}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
