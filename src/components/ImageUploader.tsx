import { Upload, Crop } from 'lucide-react';

interface ImageUploaderProps {
  hasImage: boolean;
  cropAspect: '4:3' | '3:2';
  onUpload: (file: File) => void;
  onAspectChange: (aspect: '4:3' | '3:2') => void;
  onOpenCropper: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ImageUploader({
  hasImage,
  cropAspect,
  onAspectChange,
  onOpenCropper,
  fileInputRef,
}: ImageUploaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] px-4 bg-stone-800 text-white rounded-2xl text-sm font-medium active:bg-stone-900 transition-all duration-150 shadow-lg shadow-stone-800/15"
        >
          <Upload size={16} strokeWidth={2.5} />
          {hasImage ? '换一张照片' : '上传照片'}
        </button>
        {hasImage && (
          <button
            onClick={onOpenCropper}
            className="flex items-center justify-center gap-2 min-h-[48px] px-5 bg-stone-100/80 text-stone-600 rounded-2xl text-sm font-medium active:bg-stone-200 transition-colors"
          >
            <Crop size={16} />
            裁剪
          </button>
        )}
      </div>

      <div>
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
          裁剪比例
        </label>
        <div className="flex gap-2 bg-stone-100/60 rounded-xl p-1">
          {(['4:3', '3:2'] as const).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onAspectChange(ratio)}
              className={`flex-1 min-h-[44px] text-xs rounded-lg font-medium transition-all duration-200 ${
                cropAspect === ratio
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-400 active:text-stone-600'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
