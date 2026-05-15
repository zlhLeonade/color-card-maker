import { useState, useCallback, useEffect, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, transformImage } from '../utils/image';
import { X, Check, RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import type { CropAspect } from '../types';

interface ImageCropperProps {
  imageSrc: string;
  aspect: CropAspect;
  onCropComplete: (croppedImage: string, aspect: CropAspect) => void;
  onCancel: () => void;
}

const ASPECT_OPTIONS: { id: CropAspect; label: string }[] = [
  { id: 'original', label: '原图' },
  { id: '1:1', label: '1:1' },
  { id: '3:2', label: '3:2' },
  { id: '4:3', label: '4:3' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
];

const ASPECT_MAP: Record<string, number> = {
  '1:1': 1,
  '3:2': 3 / 2,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

export default function ImageCropper({
  imageSrc,
  aspect,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [currentAspect, setCurrentAspect] = useState<CropAspect>(aspect);
  const [displayImage, setDisplayImage] = useState(imageSrc);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);
  const [transforming, setTransforming] = useState(false);

  // Load image to get natural aspect ratio
  useEffect(() => {
    const img = new Image();
    img.onload = () => setNaturalAspect(img.width / img.height);
    img.src = imageSrc;
  }, [imageSrc]);

  // Reset state when image changes
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setDisplayImage(imageSrc);
  }, [imageSrc]);

  // Generate transformed image when rotation/flip changes
  useEffect(() => {
    if (rotation === 0 && !flipH && !flipV) {
      setDisplayImage(imageSrc);
      return;
    }
    let cancelled = false;
    setTransforming(true);
    transformImage(imageSrc, rotation, flipH, flipV).then((result) => {
      if (!cancelled) {
        setDisplayImage(result);
        setTransforming(false);
      }
    });
    return () => { cancelled = true; };
  }, [imageSrc, rotation, flipH, flipV]);

  // Compute effective aspect ratio
  const effectiveAspect = useMemo(() => {
    if (currentAspect === 'original') {
      if (!naturalAspect) return 3 / 2;
      const isRotated90 = rotation === 90 || rotation === 270;
      return isRotated90 ? 1 / naturalAspect : naturalAspect;
    }
    return ASPECT_MAP[currentAspect] ?? 3 / 2;
  }, [currentAspect, naturalAspect, rotation]);

  const onCropChange = useCallback((loc: { x: number; y: number }) => setCrop(loc), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);

  const onCropCompleteHandler = useCallback(
    (_: { x: number; y: number; width: number; height: number },
     pixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(pixels);
    },
    []
  );

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImg = await getCroppedImg(displayImage, croppedAreaPixels);
      onCropComplete(croppedImg, currentAspect);
    } catch (err) {
      console.error('Crop failed:', err);
    }
  }, [croppedAreaPixels, displayImage, currentAspect, onCropComplete]);

  const handleAspectChange = useCallback((a: CropAspect) => {
    setCurrentAspect(a);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleRotateLeft = useCallback(() => setRotation((r) => (r - 90 + 360) % 360), []);
  const handleRotateRight = useCallback(() => setRotation((r) => (r + 90) % 360), []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 safe-top" style={{ minHeight: 52 }}>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-white/60 active:text-white transition-colors min-h-[44px] px-2"
        >
          <X size={18} />
          <span className="text-sm">取消</span>
        </button>
        <span className="text-white/80 text-sm font-medium tracking-wide">裁剪照片</span>
        <button
          onClick={handleApply}
          disabled={transforming}
          className="flex items-center gap-1.5 text-white text-sm font-medium min-h-[44px] px-3 rounded-full transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <Check size={15} strokeWidth={2.5} />
          完成
        </button>
      </div>

      {/* Cropper area */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {transforming && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="text-white/60 text-xs">处理中...</div>
          </div>
        )}
        <Cropper
          image={displayImage}
          crop={crop}
          zoom={zoom}
          rotation={0}
          aspect={effectiveAspect}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteHandler}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: { background: '#0a0a0a' },
            cropAreaStyle: {
              border: '1.5px solid rgba(255,255,255,0.5)',
              borderRadius: '4px',
            },
            mediaStyle: {
              transition: 'none',
            },
          }}
        />
      </div>

      {/* Bottom controls */}
      <div
        className="safe-bottom"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Aspect ratio pills */}
        <div
          className="flex gap-2 px-4 py-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <style>{`.aspect-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex gap-2 aspect-scroll">
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAspectChange(opt.id)}
                className="shrink-0 min-h-[40px] px-5 rounded-full text-sm font-medium transition-all active:scale-95"
                style={{
                  background: currentAspect === opt.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)',
                  color: currentAspect === opt.id ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                  boxShadow: currentAspect === opt.id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rotate / Flip buttons */}
        <div className="flex items-center justify-center gap-3 px-4 py-2">
          {[
            { icon: RotateCcw, label: '左旋', onClick: handleRotateLeft },
            { icon: RotateCw, label: '右旋', onClick: handleRotateRight },
            { icon: FlipHorizontal, label: '水平翻转', onClick: () => setFlipH((f) => !f), active: flipH },
            { icon: FlipVertical, label: '垂直翻转', onClick: () => setFlipV((f) => !f), active: flipV },
          ].map(({ icon: Icon, label, onClick, active }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-1 min-w-[56px] min-h-[48px] rounded-xl transition-all active:scale-90"
              style={{
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={17} style={{ color: active ? '#fff' : 'rgba(255,255,255,0.7)' }} />
              </div>
              <span style={{ fontSize: 11, color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-6 py-3">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', minWidth: 22 }}>1×</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="slider-dark flex-1"
          />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', minWidth: 22 }}>3×</span>
        </div>
      </div>
    </div>
  );
}
