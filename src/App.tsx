import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Palette, Type, Info, Share, Camera } from 'lucide-react';
import PosterCanvas from './components/PosterCanvas';
import ImageUploader from './components/ImageUploader';
import ImageCropper from './components/ImageCropper';
import ColorPalette from './components/ColorPalette';
import TextControls from './components/TextControls';
import ExportPanel from './components/ExportPanel';
import { extractColorsFromImage, recommendTextColor, recommendBgColor } from './utils/color';
import { readExifData } from './utils/image';
import { exportToPng } from './utils/export';
import { formatExifDateShort } from './utils/date';
import { DEFAULT_STATE, type PosterState } from './types';

const sections = [
  { id: 'image', label: '图片', icon: Image },
  { id: 'background', label: '背景', icon: Palette },
  { id: 'text', label: '文字', icon: Type },
  { id: 'info', label: '信息', icon: Info },
  { id: 'export', label: '导出', icon: Share },
];

export default function App() {
  const [state, setState] = useState<PosterState>(DEFAULT_STATE);
  const [showCropper, setShowCropper] = useState(false);
  const [imageForCrop, setImageForCrop] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('image');
  const posterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((partial: Partial<PosterState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      setImageForCrop(src);
      update({ originalImage: src });
      setShowCropper(true);
      try {
        const exif = await readExifData(file);
        if (exif.dateTime || exif.cameraModel) {
          update({ exifData: exif });
        }
      } catch { /* ignore */ }
    };
    reader.readAsDataURL(file);
  }, [update]);

  const handleCropComplete = useCallback(async (croppedImage: string) => {
    setShowCropper(false);
    update({ croppedImage });
    try {
      const colors = await extractColorsFromImage(croppedImage, 5);
      const bg = recommendBgColor(colors);
      const textColor = recommendTextColor(bg, colors);
      setState((prev) => ({
        ...prev,
        croppedImage,
        colors,
        bgColor: bg,
        text: { ...prev.text, color: textColor },
      }));
    } catch (err) {
      console.error('Color extraction failed:', err);
    }
  }, [update]);

  const handleColorSelect = useCallback((color: string) => {
    const textColor = recommendTextColor(color, state.colors);
    setState((prev) => ({
      ...prev,
      bgColor: color,
      text: { ...prev.text, color: textColor },
    }));
  }, [state.colors]);

  const handleRefreshColors = useCallback(async () => {
    if (!state.croppedImage) return;
    setLoading(true);
    try {
      const colors = await extractColorsFromImage(state.croppedImage, 5);
      update({ colors });
    } catch (err) {
      console.error('Color extraction failed:', err);
    }
    setLoading(false);
  }, [state.croppedImage, update]);

  const handleExport = useCallback(async () => {
    if (!posterRef.current) return;
    setLoading(true);
    try {
      await exportToPng(posterRef.current, state.exportQuality);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setLoading(false);
  }, [state.exportQuality]);

  const handleReset = useCallback(() => {
    setState(DEFAULT_STATE);
    setImageForCrop(null);
    setShowCropper(false);
  }, []);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* ===== Mobile: top preview + bottom panel | Desktop: left preview + right panel ===== */}

      {/* Preview area */}
      <div className="flex-1 lg:flex-1 flex items-center justify-center px-4 pt-3 pb-2 lg:p-8 lg:sticky lg:top-0 lg:h-screen">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
          style={{ maxWidth: '340px' }}
        >
          {state.croppedImage ? (
            <div className="poster-shadow rounded-xl overflow-hidden">
              <PosterCanvas
                ref={posterRef}
                bgColor={state.bgColor}
                croppedImage={state.croppedImage}
                imageWidth={state.imageWidth}
                text={state.text}
                exifData={state.exifData}
                exifSettings={state.exifSettings}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl overflow-hidden flex flex-col items-center justify-center poster-shadow active:scale-[0.98] transition-transform duration-150 cursor-pointer"
              style={{
                aspectRatio: '3 / 4',
                background: 'linear-gradient(160deg, #e8e4de 0%, #d8d3cb 50%, #eae6e0 100%)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Camera size={28} className="text-stone-400" />
                </div>
                <p className="text-sm text-stone-500 font-medium mb-1">点击上传照片</p>
                <p className="text-[11px] text-stone-400">JPG / PNG / WebP</p>
              </motion.div>
            </button>
          )}
        </motion.div>
      </div>

      {/* Bottom panel (mobile) / Right panel (desktop) */}
      <div className="lg:w-[400px] flex flex-col bottom-sheet lg:bg-white/70 lg:backdrop-blur-lg lg:border-l lg:border-stone-200/50 lg:rounded-none">
        {/* Tab bar */}
        <div className="px-3 pt-2 pb-1 lg:px-5 lg:pt-5 lg:pb-3">
          <div className="flex bg-stone-100/50 rounded-xl p-1">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 lg:py-2.5 rounded-lg transition-colors duration-200 min-h-[44px] justify-center ${
                    activeSection === s.id
                      ? 'text-stone-800'
                      : 'text-stone-400 active:text-stone-500'
                  }`}
                >
                  {activeSection === s.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon size={16} strokeWidth={2} className="relative z-10" />
                  <span className="relative z-10 text-[10px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel content — scrollable */}
        <div className="flex-1 panel-scroll px-5 pb-4 safe-bottom lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pt-1"
            >
              {activeSection === 'image' && (
                <ImageUploader
                  hasImage={!!state.croppedImage}
                  cropAspect={state.cropAspect}
                  onUpload={handleUpload}
                  onAspectChange={(aspect) => update({ cropAspect: aspect })}
                  onOpenCropper={() => {
                    if (state.originalImage) {
                      setImageForCrop(state.originalImage);
                      setShowCropper(true);
                    }
                  }}
                  fileInputRef={fileInputRef}
                />
              )}

              {activeSection === 'background' && (
                <div className="space-y-5">
                  <ColorPalette
                    colors={state.colors}
                    selectedColor={state.bgColor}
                    onSelect={handleColorSelect}
                    onRefresh={handleRefreshColors}
                  />
                  {state.colors.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-stone-400">上传照片后自动提取颜色</p>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium">
                        照片宽度
                      </label>
                      <span className="text-[11px] text-stone-500 font-medium tabular-nums">
                        {state.imageWidth}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={100}
                      value={state.imageWidth}
                      onChange={(e) => update({ imageWidth: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
                      自定义背景色
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={state.bgColor}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        className="w-11 h-11 rounded-xl cursor-pointer"
                      />
                      <span className="text-xs text-stone-500 font-mono">
                        {state.bgColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'text' && (
                <TextControls
                  text={state.text}
                  onChange={(text) => setState((prev) => ({ ...prev, text }))}
                  extractedColors={state.colors}
                  bgColor={state.bgColor}
                  hasCamera={!!state.exifData?.cameraModel}
                />
              )}

              {activeSection === 'info' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
                      拍摄时间
                    </label>
                    {state.exifData?.dateTime ? (
                      <div className="flex items-center justify-between min-h-[44px]">
                        <span className="text-sm text-stone-600">{formatExifDateShort(state.exifData.dateTime)}</span>
                        <button
                          onClick={() => update({ exifSettings: { ...state.exifSettings, showDate: !state.exifSettings.showDate } })}
                          className={`relative w-12 h-7 rounded-full transition-colors duration-200 min-w-[48px] ${
                            state.exifSettings.showDate ? 'bg-stone-700' : 'bg-stone-200'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            state.exifSettings.showDate ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-300 min-h-[44px] flex items-center">未检测到拍摄时间</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
                      相机型号
                    </label>
                    {state.exifData?.cameraModel ? (
                      <div className="flex items-center justify-between min-h-[44px]">
                        <span className="text-sm text-stone-600">{state.exifData.cameraModel}</span>
                        <button
                          onClick={() => update({ exifSettings: { ...state.exifSettings, showCamera: !state.exifSettings.showCamera } })}
                          className={`relative w-12 h-7 rounded-full transition-colors duration-200 min-w-[48px] ${
                            state.exifSettings.showCamera ? 'bg-stone-700' : 'bg-stone-200'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            state.exifSettings.showCamera ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-300 min-h-[44px] flex items-center">未检测到相机型号</p>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'export' && (
                <ExportPanel
                  disabled={!state.croppedImage || loading}
                  quality={state.exportQuality}
                  onQualityChange={(q) => update({ exportQuality: q })}
                  onExport={handleExport}
                  onReset={handleReset}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden file input — shared across components */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUpload(file);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-stone-800/80 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full"
          >
            处理中...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cropper modal */}
      <AnimatePresence>
        {showCropper && imageForCrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ImageCropper
              imageSrc={imageForCrop}
              aspect={state.cropAspect}
              onCropComplete={handleCropComplete}
              onCancel={() => setShowCropper(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
