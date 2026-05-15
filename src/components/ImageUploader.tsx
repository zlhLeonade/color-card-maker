import { Upload, Crop } from 'lucide-react';

interface ImageUploaderProps {
  hasImage: boolean;
  onUpload: (file: File) => void;
  onOpenCropper: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ImageUploader({
  hasImage,
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
      <p className="text-[11px] text-stone-300 text-center">
        上传后可在裁剪界面选择比例、旋转和翻转
      </p>
    </div>
  );
}
