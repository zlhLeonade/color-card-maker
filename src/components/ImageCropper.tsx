import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/image';
import { X, Check } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  aspect: '4:3' | '3:2';
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageSrc,
  aspect,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const aspectRatio = aspect === '4:3' ? 4 / 3 : 3 / 2;

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteHandler = useCallback(
    (
      _croppedArea: { x: number; y: number; width: number; height: number },
      croppedAreaPixels: { x: number; y: number; width: number; height: number }
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImg = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImg);
    } catch (err) {
      console.error('Crop failed:', err);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 safe-top">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
        >
          <X size={18} />
          <span className="text-sm">取消</span>
        </button>
        <span className="text-white/90 text-sm font-medium tracking-wide">
          裁剪
        </span>
        <button
          onClick={handleApply}
          className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/25 transition-colors"
        >
          <Check size={16} strokeWidth={2.5} />
          完成
        </button>
      </div>

      {/* Cropper area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteHandler}
        />
      </div>

      {/* Zoom slider */}
      <div className="px-8 py-5 safe-bottom">
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-xs">1×</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-white/40 text-xs">3×</span>
        </div>
      </div>
    </div>
  );
}
