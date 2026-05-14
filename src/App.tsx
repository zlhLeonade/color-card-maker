import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Camera } from 'lucide-react';
import PosterCanvas from './components/PosterCanvas';
import ImageUploader from './components/ImageUploader';
import ImageCropper from './components/ImageCropper';
import ColorPalette from './components/ColorPalette';
import TextControls from './components/TextControls';
import ExportPanel from './components/ExportPanel';
import { extractColorsFromImage, recommendTextColor, recommendBgColor } from './utils/color';
import { readExifData } from './utils/image';
import { exportToPng } from './utils/export';
import { DEFAULT_STATE, type PosterState } from './types';

const sections = [
  { id: 'image', label: '图片' },
  { id: 'background', label: '背景' },
  { id: 'text', label: '文字' },
  { id: 'export', label: '导出' },
];

export default function App() {
  const [state, setState] = useState<PosterState>(DEFAULT_STATE);
  const [showCropper, setShowCropper] = useState(false);
  const [imageForCrop, setImageForCrop] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('image');
  const posterRef = useRef<HTMLDivElement>(null);

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
      // Read EXIF in parallel
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 text-center glass-panel sticky top-0 z-20">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <Palette size={18} className="text-stone-500" />
          <h1 className="text-base font-semibold text-stone-700 tracking-widest">
            拾色卡片
          </h1>
        </div>
        <p className="text-[10px] text-stone-400 tracking-wider">
          上传照片 · 吸取颜色 · 生成氛围卡片
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 max-w-5xl w-full mx-auto flex flex-col lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        {/* Left: Poster preview */}
        <div className="lg:flex-1 flex items-start justify-center px-4 pt-6 pb-4 lg:py-0 lg:sticky lg:top-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
            style={{ maxWidth: '380px' }}
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
              <div
                className="rounded-xl overflow-hidden flex flex-col items-center justify-center poster-shadow"
                style={{
                  aspectRatio: '3 / 4',
                  background: 'linear-gradient(160deg, #e8e4de 0%, #d8d3cb 50%, #eae6e0 100%)',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Camera size={28} className="text-stone-400" />
                  </div>
                  <p className="text-sm text-stone-500 font-medium mb-1">上传照片开始创作</p>
                  <p className="text-[11px] text-stone-400">支持 JPG / PNG / WebP</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Control panel */}
        <div className="lg:w-[380px] px-4 pb-8 lg:py-0">
          <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Section tabs */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex bg-stone-100/60 rounded-xl p-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`relative flex-1 py-2 text-xs rounded-lg font-medium transition-colors duration-200 ${
                      activeSection === s.id
                        ? 'text-stone-800'
                        : 'text-stone-400 hover:text-stone-500'
                    }`}
                  >
                    {activeSection === s.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-lg shadow-sm"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Panel content */}
            <div className="px-5 pb-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
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
                        <div className="text-center py-6">
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
                            className="w-10 h-10 rounded-xl cursor-pointer"
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
                      exifSettings={state.exifSettings}
                      onExifSettingsChange={(s) => update({ exifSettings: s })}
                      hasExifData={!!state.exifData?.dateTime || !!state.exifData?.cameraModel}
                    />
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

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mt-3"
              >
                <span className="text-[11px] text-stone-400">处理中...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
