import { motion } from 'framer-motion';
import { Download, RotateCcw } from 'lucide-react';
import { EXPORT_PRESETS, type ExportQuality } from '../types';

interface ExportPanelProps {
  disabled: boolean;
  quality: ExportQuality;
  onQualityChange: (q: ExportQuality) => void;
  onExport: () => void;
  onReset: () => void;
}

export default function ExportPanel({
  disabled,
  quality,
  onQualityChange,
  onExport,
  onReset,
}: ExportPanelProps) {
  const currentPreset = EXPORT_PRESETS.find(p => p.id === quality) ?? EXPORT_PRESETS[2];

  return (
    <div className="space-y-4">
      {/* Quality selector */}
      <div>
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
          导出清晰度
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onQualityChange(preset.id)}
              className={`relative px-3 py-3 rounded-xl text-left transition-all duration-150 min-h-[52px] ${
                quality === preset.id
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'bg-stone-50/80 text-stone-600 active:bg-stone-100 border border-stone-200/60'
              }`}
            >
              <div className="text-xs font-semibold">{preset.label}</div>
              <div className={`text-[10px] mt-0.5 ${quality === preset.id ? 'text-stone-300' : 'text-stone-400'}`}>
                {preset.description}
              </div>
              {preset.warn && (
                <div className={`text-[9px] mt-0.5 ${quality === preset.id ? 'text-amber-300' : 'text-amber-500'}`}>
                  {preset.warn}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Export button */}
      <motion.button
        onClick={onExport}
        disabled={disabled}
        whileTap={disabled ? {} : { scale: 0.97 }}
        className={`w-full flex items-center justify-center gap-2.5 min-h-[52px] px-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
          disabled
            ? 'bg-stone-200/60 text-stone-400 cursor-not-allowed'
            : 'bg-stone-800 text-white shadow-lg shadow-stone-800/20 active:bg-stone-900'
        }`}
      >
        <Download size={16} strokeWidth={2.5} />
        导出 PNG
      </motion.button>

      <motion.button
        onClick={onReset}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-center gap-2 min-h-[48px] px-4 bg-stone-100/80 text-stone-500 rounded-2xl text-sm active:bg-stone-200 transition-colors"
      >
        <RotateCcw size={13} />
        重置
      </motion.button>

      <p className="text-[10px] text-stone-400 text-center">
        输出 {currentPreset.description} · 3:4 · PNG
      </p>
    </div>
  );
}
