import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Grid3X3, SlidersHorizontal, Download, RotateCcw, X, Plus } from 'lucide-react';
import type { CollageState } from '../types';
import { COLLAGE_TEMPLATES, COLLAGE_EXPORT_PRESETS } from '../types';

interface CollageControlsProps {
  state: CollageState;
  onUpdate: (partial: Partial<CollageState>) => void;
  selectedSlot: number | null;
  onPhotosAdd: (files: FileList) => void;
  onPhotoRemove: (id: string) => void;
  onExport: () => void;
  onReset: () => void;
  loading: boolean;
}

const COLLAGES_TABS = [
  { id: 'photos', label: '照片', icon: Image },
  { id: 'template', label: '模板', icon: Grid3X3 },
  { id: 'settings', label: '调整', icon: SlidersHorizontal },
  { id: 'export', label: '导出', icon: Download },
] as const;

type TabId = (typeof COLLAGES_TABS)[number]['id'];

function CompactSlider({ label, value, min, max, step, unit, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const s = step ?? 1;
  const nudge = (dir: number) => {
    const raw = value + dir * s;
    const next = s < 1 ? Math.round(raw * 100) / 100 : Math.round(raw);
    onChange(Math.max(min, Math.min(max, next)));
  };
  const display = s < 1
    ? value.toFixed(s < 0.05 ? 2 : 1)
    : String(Math.round(value));

  return (
    <div className="flex items-center gap-1.5 py-1.5">
      <span className="text-xs text-stone-400 w-9 shrink-0 font-medium">{label}</span>
      <button
        onClick={() => nudge(-1)}
        className="w-7 h-7 rounded-full bg-stone-100/80 flex items-center justify-center text-stone-500 active:bg-stone-200 active:text-stone-700 transition-colors text-sm font-medium select-none"
      >
        −
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={s}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
        style={{ touchAction: 'pan-y' }}
      />
      <button
        onClick={() => nudge(1)}
        className="w-7 h-7 rounded-full bg-stone-100/80 flex items-center justify-center text-stone-500 active:bg-stone-200 active:text-stone-700 transition-colors text-sm font-medium select-none"
      >
        +
      </button>
      <span className="text-xs text-stone-500 w-11 text-right tabular-nums font-medium">
        {display}{unit}
      </span>
    </div>
  );
}

export default function CollageControls({
  state,
  onUpdate,
  selectedSlot,
  onPhotosAdd,
  onPhotoRemove,
  onExport,
  onReset,
  loading,
}: CollageControlsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('photos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTemplate = COLLAGE_TEMPLATES.find(t => t.id === state.templateId) ?? COLLAGE_TEMPLATES[0];
  const maxSlots = currentTemplate.cells.length;

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onPhotosAdd(files);
      e.target.value = '';
    }
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {COLLAGES_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex flex-col items-center gap-0.5 py-2 rounded-2xl text-[13px] font-medium transition-all active:scale-95 min-h-[42px] justify-center ${
                activeTab === tab.id
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'bg-stone-100/80 text-stone-500 active:bg-stone-200'
              }`}
            >
              <Icon size={14} strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
        >
          {/* Photos */}
          {activeTab === 'photos' && (
            <div className="space-y-3">
              {/* Photo thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {state.photos.map((photo, i) => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-stone-100">
                    <img src={photo.src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => onPhotoRemove(photo.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    {selectedSlot === i && (
                      <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none" />
                    )}
                  </div>
                ))}
                {state.photos.length < 5 && (
                  <button
                    onClick={handleAddClick}
                    className="aspect-square rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-400 active:bg-stone-100 active:text-stone-500 transition-colors"
                  >
                    <Plus size={18} />
                    <span className="text-[10px]">添加</span>
                  </button>
                )}
              </div>

              {/* Hint */}
              <p className="text-[11px] text-stone-400 text-center">
                已添加 {state.photos.length} / {maxSlots} 张照片
                {selectedSlot !== null && state.photos[selectedSlot] && (
                  <span className="block mt-1 text-stone-500">
                    当前选中：位置 {selectedSlot + 1}
                  </span>
                )}
              </p>

              {/* Add button */}
              <button
                onClick={handleAddClick}
                disabled={state.photos.length >= 5}
                className={`w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] ${
                  state.photos.length >= 5
                    ? 'bg-stone-100/60 text-stone-300 cursor-not-allowed'
                    : 'bg-stone-100/60 text-stone-500 active:bg-stone-200/80'
                }`}
              >
                <Image size={14} />
                上传照片
              </button>
            </div>
          )}

          {/* Template */}
          {activeTab === 'template' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {COLLAGE_TEMPLATES.filter(t => t.cells.length <= state.photos.length || state.photos.length === 0).map((template) => {
                  const isRecommended = state.photos.length > 0 && template.cells.length === state.photos.length;
                  return (
                    <button
                      key={template.id}
                      onClick={() => onUpdate({ templateId: template.id })}
                      className={`relative p-3 rounded-xl text-left transition-all duration-150 min-h-[64px] ${
                        state.templateId === template.id
                          ? 'bg-stone-800 text-white shadow-md'
                          : 'bg-stone-50/80 text-stone-600 active:bg-stone-100 border border-stone-200/60'
                      }`}
                    >
                      {/* Mini preview */}
                      <div
                        className="w-full rounded-md overflow-hidden mb-2"
                        style={{
                          aspectRatio: '16 / 9',
                          backgroundColor: state.templateId === template.id ? '#333' : '#e5e5e5',
                          position: 'relative',
                        }}
                      >
                        {template.cells.map((cell, i) => (
                          <div
                            key={i}
                            className="absolute"
                            style={{
                              left: `${cell.x}%`,
                              top: `${cell.y}%`,
                              width: `${cell.w}%`,
                              height: `${cell.h}%`,
                              border: `1px solid ${state.templateId === template.id ? '#666' : '#ccc'}`,
                              backgroundColor: state.templateId === template.id ? '#444' : '#d4d4d4',
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{template.label}</span>
                        {isRecommended && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600">
                            推荐
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-0.5">
              {/* Background color */}
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-stone-400 font-medium">背景色</span>
                <div className="flex items-center gap-2">
                  {['#1a1a1a', '#ffffff', '#0a0a0a', '#2d2d2d', '#f5f5f0'].map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdate({ bgColor: color })}
                      className="relative p-0.5"
                    >
                      <div
                        className="w-7 h-7 rounded-full transition-transform active:scale-90"
                        style={{
                          backgroundColor: color,
                          boxShadow: color === '#ffffff' || color === '#f5f5f0'
                            ? 'inset 0 0 0 1px rgba(0,0,0,0.08)'
                            : 'none',
                        }}
                      />
                      {state.bgColor === color && (
                        <div className="absolute inset-0 rounded-full border-2 border-stone-500" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={state.bgColor}
                    onChange={(e) => onUpdate({ bgColor: e.target.value })}
                    className="w-7 h-7 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              <CompactSlider
                label="间距"
                value={state.gap}
                min={0}
                max={20}
                unit="px"
                onChange={(v) => onUpdate({ gap: v })}
              />
              <CompactSlider
                label="边距"
                value={state.padding}
                min={0}
                max={40}
                unit="px"
                onChange={(v) => onUpdate({ padding: v })}
              />

              {/* Swap hint */}
              {selectedSlot !== null && state.photos.length > 1 && (
                <div className="mt-3 p-3 bg-stone-50/80 rounded-xl">
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    点击画布中的位置选中，再点击另一个位置即可交换照片。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
                  导出清晰度
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {COLLAGE_EXPORT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => onUpdate({ exportQuality: preset.id })}
                      className={`relative px-3 py-3 rounded-xl text-left transition-all duration-150 min-h-[52px] flex items-center justify-between ${
                        state.exportQuality === preset.id
                          ? 'bg-stone-800 text-white shadow-md'
                          : 'bg-stone-50/80 text-stone-600 active:bg-stone-100 border border-stone-200/60'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold">{preset.label}</div>
                        <div className={`text-[11px] mt-0.5 ${state.exportQuality === preset.id ? 'text-stone-300' : 'text-stone-400'}`}>
                          {preset.description}
                        </div>
                      </div>
                      {state.exportQuality === preset.id && (
                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-stone-800" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export button */}
              <motion.button
                onClick={onExport}
                disabled={state.photos.length < 2 || loading}
                whileTap={state.photos.length < 2 || loading ? {} : { scale: 0.97 }}
                className={`w-full flex items-center justify-center gap-2.5 min-h-[52px] px-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  state.photos.length < 2 || loading
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
                输出 {COLLAGE_EXPORT_PRESETS.find(p => p.id === state.exportQuality)?.description} · 16:9 · PNG
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
