import { Sparkles, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Move } from 'lucide-react';
import type { TextStyle } from '../types';
import { FONT_OPTIONS } from '../types';
import { generateCaption } from '../utils/caption';

interface TextControlsProps {
  text: TextStyle;
  onChange: (text: TextStyle) => void;
  extractedColors: string[];
  bgColor: string;
  hasCamera: boolean;
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
    <div className="py-1">
      <div className="flex justify-between mb-2.5">
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] text-stone-400 tracking-wide uppercase font-medium">{children}</span>
      <div className="flex-1 h-px bg-stone-200/50" />
    </div>
  );
}

export default function TextControls({
  text,
  onChange,
  extractedColors,
  bgColor,
  hasCamera,
}: TextControlsProps) {
  const update = (partial: Partial<TextStyle>) => {
    onChange({ ...text, ...partial });
  };

  const handleGenerate = () => {
    const caption = generateCaption({
      bgColor,
      colors: extractedColors,
      hasCamera,
    });
    update({ content: caption });
  };

  const alignOptions = [
    { value: 'left' as const, Icon: AlignLeft },
    { value: 'center' as const, Icon: AlignCenter },
    { value: 'right' as const, Icon: AlignRight },
  ];

  return (
    <div className="space-y-6">
      {/* ── Content ── */}
      <div>
        <SectionLabel>内容</SectionLabel>
        <textarea
          value={text.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="输入海报文字..."
          rows={3}
          className="w-full px-3.5 py-3 bg-stone-50/80 border border-stone-200/60 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300/50 focus:border-stone-300 transition-all placeholder:text-stone-300"
        />
        <button
          onClick={handleGenerate}
          className="mt-2 w-full flex items-center justify-center gap-2 min-h-[44px] px-4 bg-stone-100/80 text-stone-600 rounded-xl text-sm font-medium active:bg-stone-200 transition-colors"
        >
          <Sparkles size={14} />
          Generate caption
        </button>
      </div>

      {/* ── Font ── */}
      <div>
        <SectionLabel>字体</SectionLabel>
        <select
          value={text.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full px-3.5 py-3 bg-stone-50/80 border border-stone-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300/50 focus:border-stone-300 transition-all appearance-none cursor-pointer"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Typography ── */}
      <div>
        <SectionLabel>排版</SectionLabel>
        <div className="space-y-2">
          <Slider label="字号" value={text.fontSize} min={14} max={72} unit="px"
            onChange={(v) => update({ fontSize: v })} />
          <Slider label="字间距" value={text.letterSpacing} min={0} max={0.3} step={0.01} unit="em"
            onChange={(v) => update({ letterSpacing: v })} />
          <Slider label="行高" value={text.lineHeight} min={1} max={2.5} step={0.1} unit=""
            onChange={(v) => update({ lineHeight: v })} />
        </div>

        {/* Bold / Italic toggles */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => update({ bold: !text.bold })}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[40px] rounded-xl text-sm font-medium transition-colors ${
              text.bold
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100/80 text-stone-500 active:bg-stone-200'
            }`}
          >
            <Bold size={15} />
            粗体
          </button>
          <button
            onClick={() => update({ italic: !text.italic })}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[40px] rounded-xl text-sm font-medium transition-colors ${
              text.italic
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100/80 text-stone-500 active:bg-stone-200'
            }`}
          >
            <Italic size={15} />
            斜体
          </button>
        </div>

        {/* Alignment segmented control */}
        <div className="flex bg-stone-100/80 rounded-xl p-1 mt-3">
          {alignOptions.map(({ value, Icon }) => (
            <button
              key={value}
              onClick={() => update({ align: value })}
              className={`relative flex-1 flex items-center justify-center min-h-[36px] rounded-lg transition-colors ${
                text.align === value
                  ? 'bg-white shadow-sm text-stone-800'
                  : 'text-stone-400 active:text-stone-500'
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Position ── */}
      <div>
        <SectionLabel>位置</SectionLabel>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Move size={12} className="text-stone-300" />
          <span className="text-[11px] text-stone-300">可直接拖动海报上的文字</span>
        </div>
        <div className="space-y-2">
          <Slider label="水平" value={text.x} min={5} max={95} unit="%"
            onChange={(v) => update({ x: v })} />
          <Slider label="垂直" value={text.y} min={2} max={50} unit="%"
            onChange={(v) => update({ y: v })} />
          <Slider label="宽度" value={text.width} min={45} max={90} unit="%"
            onChange={(v) => update({ width: v })} />
        </div>
      </div>

      {/* ── Text Color ── */}
      <div>
        <SectionLabel>文字颜色</SectionLabel>
        <div className="flex gap-3 flex-wrap items-center">
          {['#ffffff', '#1a1a1a', '#f0ede8', '#2a2520'].map((color) => (
            <button key={color} onClick={() => update({ color })} className="relative group p-1">
              <div
                className="w-10 h-10 rounded-full transition-transform duration-150 group-active:scale-90"
                style={{
                  backgroundColor: color,
                  boxShadow: color === '#ffffff' || color === '#f0ede8'
                    ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                }}
              />
              {text.color === color && (
                <div className="absolute inset-0 rounded-full border-2 border-stone-600" />
              )}
            </button>
          ))}
          {extractedColors.map((color) => (
            <button key={`text-${color}`} onClick={() => update({ color })} className="relative group p-1">
              <div className="w-10 h-10 rounded-full transition-transform duration-150 group-active:scale-90"
                style={{ backgroundColor: color }} />
              {text.color === color && (
                <div className="absolute inset-0 rounded-full border-2 border-stone-600" />
              )}
            </button>
          ))}
          <div className="relative p-1">
            <input type="color" value={text.color}
              onChange={(e) => update({ color: e.target.value })}
              className="w-10 h-10 rounded-full cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}
