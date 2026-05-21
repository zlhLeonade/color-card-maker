import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw, AlertTriangle, CheckCircle, Image } from 'lucide-react';
import { EXPORT_PRESETS, type ExportQuality } from '../types';
import { browserInfo } from '../utils/browser';
import type { ExportResult } from '../utils/export';

interface ExportPanelProps {
  disabled: boolean;
  quality: ExportQuality;
  onQualityChange: (q: ExportQuality) => void;
  onExport: () => void;
  onReset: () => void;
  exportResult?: ExportResult | null;
}

export default function ExportPanel({
  disabled,
  quality,
  onQualityChange,
  onExport,
  onReset,
  exportResult,
}: ExportPanelProps) {
  const currentPreset = EXPORT_PRESETS.find(p => p.id === quality) ?? EXPORT_PRESETS[2];
  const isProblematic = browserInfo.isProblematic;

  return (
    <div className="space-y-4">
      {/* iOS / compatibility warning */}
      {isProblematic && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/50">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            当前浏览器可能限制高清导出，建议使用「高清」或「标清」清晰度。如导出失败请降低清晰度或换用 Safari / Chrome。
          </p>
        </div>
      )}

      {/* Quality selector */}
      <div>
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
          导出清晰度
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_PRESETS.map((preset) => {
            const recommended = isProblematic && (preset.id === 'sd' || preset.id === 'hd');
            const blocked = isProblematic && preset.id === 'uhd';

            return (
              <button
                key={preset.id}
                onClick={() => onQualityChange(preset.id)}
                className={`relative px-3 py-3 rounded-xl text-left transition-all duration-150 min-h-[52px] ${
                  quality === preset.id
                    ? 'bg-stone-800 text-white shadow-md'
                    : 'bg-stone-50/80 text-stone-600 active:bg-stone-100 border border-stone-200/60'
                } ${blocked ? 'opacity-50' : ''}`}
              >
                <div className="text-sm font-semibold">{preset.label}</div>
                <div className={`text-[11px] mt-0.5 ${quality === preset.id ? 'text-stone-300' : 'text-stone-400'}`}>
                  {preset.description}
                </div>
                {preset.warn && (
                  <div className={`text-[9px] mt-0.5 ${quality === preset.id ? 'text-amber-300' : 'text-amber-500'}`}>
                    {preset.warn}
                  </div>
                )}
                {recommended && (
                  <div className={`text-[9px] mt-0.5 font-medium ${quality === preset.id ? 'text-green-300' : 'text-green-600'}`}>
                    推荐
                  </div>
                )}
                {blocked && (
                  <div className={`text-[9px] mt-0.5 ${quality === preset.id ? 'text-red-300' : 'text-red-500'}`}>
                    不推荐
                  </div>
                )}
              </button>
            );
          })}
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

      {/* Export result feedback */}
      <AnimatePresence>
        {exportResult && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
              exportResult.ok
                ? exportResult.method === 'preview'
                  ? 'bg-blue-50/80 text-blue-700 border border-blue-200/50'
                  : 'bg-green-50/80 text-green-700 border border-green-200/50'
                : 'bg-red-50/80 text-red-700 border border-red-200/50'
            }`}
          >
            {exportResult.ok ? (
              exportResult.method === 'preview' ? (
                <>
                  <Image size={14} />
                  <span>图片已生成，请在弹窗中长按保存</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>已保存到相册</span>
                </>
              )
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>{exportResult.error || '导出失败，请降低清晰度后重试'}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
