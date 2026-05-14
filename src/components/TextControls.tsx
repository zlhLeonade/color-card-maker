import type { TextStyle, ExifSettings } from '../types';
import { FONT_OPTIONS } from '../types';

interface TextControlsProps {
  text: TextStyle;
  onChange: (text: TextStyle) => void;
  extractedColors: string[];
  exifSettings: ExifSettings;
  onExifSettingsChange: (s: ExifSettings) => void;
  hasExifData: boolean;
}

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium">
          {label}
        </label>
        <span className="text-[11px] text-stone-500 font-medium tabular-nums">
          {typeof step === 'number' && step < 1 ? value.toFixed(2) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-stone-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? 'bg-stone-700' : 'bg-stone-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export default function TextControls({
  text,
  onChange,
  extractedColors,
  exifSettings,
  onExifSettingsChange,
  hasExifData,
}: TextControlsProps) {
  const update = (partial: Partial<TextStyle>) => {
    onChange({ ...text, ...partial });
  };

  return (
    <div className="space-y-5">
      {/* Text input */}
      <div>
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
          文字内容
        </label>
        <textarea
          value={text.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="输入海报文字..."
          rows={2}
          className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200/60 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300/50 focus:border-stone-300 transition-all placeholder:text-stone-300"
        />
      </div>

      {/* Font family */}
      <div>
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2">
          字体
        </label>
        <select
          value={text.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300/50 focus:border-stone-300 transition-all appearance-none cursor-pointer"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <Slider label="字号" value={text.fontSize} min={14} max={72} unit="px"
        onChange={(v) => update({ fontSize: v })} />
      <Slider label="字间距" value={text.letterSpacing} min={0} max={0.3} step={0.01} unit="em"
        onChange={(v) => update({ letterSpacing: v })} />
      <Slider label="行高" value={text.lineHeight} min={1} max={2.5} step={0.1} unit=""
        onChange={(v) => update({ lineHeight: v })} />
      <Slider label="位置" value={text.position} min={5} max={50} unit="%"
        onChange={(v) => update({ position: v })} />

      {/* Text color */}
      <div>
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-2.5">
          文字颜色
        </label>
        <div className="flex gap-2.5 flex-wrap items-center">
          {['#ffffff', '#1a1a1a', '#f0ede8', '#2a2520'].map((color) => (
            <button key={color} onClick={() => update({ color })} className="relative group">
              <div
                className="w-9 h-9 rounded-full transition-transform duration-150 group-active:scale-90"
                style={{
                  backgroundColor: color,
                  boxShadow: color === '#ffffff' || color === '#f0ede8'
                    ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                }}
              />
              {text.color === color && (
                <div className="absolute -inset-[3px] rounded-full border-2 border-stone-600" />
              )}
            </button>
          ))}
          {extractedColors.map((color) => (
            <button key={`text-${color}`} onClick={() => update({ color })} className="relative group">
              <div className="w-9 h-9 rounded-full transition-transform duration-150 group-active:scale-90"
                style={{ backgroundColor: color }} />
              {text.color === color && (
                <div className="absolute -inset-[3px] rounded-full border-2 border-stone-600" />
              )}
            </button>
          ))}
          <input type="color" value={text.color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-9 h-9 rounded-full cursor-pointer" />
        </div>
      </div>

      {/* EXIF section */}
      <div className="pt-2 border-t border-stone-100">
        <label className="text-[11px] text-stone-400 tracking-wide uppercase font-medium block mb-3">
          附加信息
        </label>
        {hasExifData ? (
          <div className="space-y-3">
            <Toggle
              label="显示拍摄时间"
              checked={exifSettings.showDate}
              onChange={(v) => onExifSettingsChange({ ...exifSettings, showDate: v })}
            />
            <Toggle
              label="显示相机型号"
              checked={exifSettings.showCamera}
              onChange={(v) => onExifSettingsChange({ ...exifSettings, showCamera: v })}
            />
          </div>
        ) : (
          <p className="text-xs text-stone-300">未检测到 EXIF 信息</p>
        )}
      </div>
    </div>
  );
}
