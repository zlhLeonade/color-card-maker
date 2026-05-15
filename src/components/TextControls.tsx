import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const TEXT_TABS = [
  { id: 'content', label: '内容' },
  { id: 'style', label: '样式' },
  { id: 'typography', label: '排版' },
  { id: 'position', label: '位置' },
] as const;

type TabId = (typeof TEXT_TABS)[number]['id'];

/* ── Compact slider with - / + buttons ── */
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
      <span className="text-[11px] text-stone-400 w-7 shrink-0 font-medium">{label}</span>
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
      <span className="text-[11px] text-stone-500 w-10 text-right tabular-nums font-medium">
        {display}{unit}
      </span>
    </div>
  );
}

/* ── Main component ── */
export default function TextControls({
  text,
  onChange,
  extractedColors,
  bgColor,
  hasCamera,
}: TextControlsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('content');

  const update = (partial: Partial<TextStyle>) => {
    onChange({ ...text, ...partial });
  };

  const handleGenerate = () => {
    const caption = generateCaption({ bgColor, colors: extractedColors, hasCamera });
    update({ content: caption });
  };

  const alignOptions = [
    { value: 'left' as const, Icon: AlignLeft },
    { value: 'center' as const, Icon: AlignCenter },
    { value: 'right' as const, Icon: AlignRight },
  ];

  return (
    <div>
      {/* ── Sub-tabs ── */}
      <div
        className="flex gap-1.5 mb-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TEXT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px] ${
              activeTab === tab.id
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-stone-100/80 text-stone-500 active:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
        >
          {/* Content */}
          {activeTab === 'content' && (
            <div className="space-y-2">
              <textarea
                value={text.content}
                onChange={(e) => update({ content: e.target.value })}
                placeholder="输入海报文字..."
                rows={2}
                className="w-full px-3 py-2.5 bg-stone-50/80 border border-stone-200/60 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300/50 focus:border-stone-300 transition-all placeholder:text-stone-300"
              />
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 min-h-[38px] px-4 bg-stone-100/60 text-stone-500 rounded-xl text-xs font-medium active:bg-stone-200/80 transition-colors"
              >
                <Sparkles size={13} />
                Generate caption
              </button>
            </div>
          )}

          {/* Style */}
          {activeTab === 'style' && (
            <div className="space-y-3">
              {/* Font selector */}
              <select
                value={text.fontFamily}
                onChange={(e) => update({ fontFamily: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50/80 border border-stone-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300/50 focus:border-stone-300 transition-all appearance-none cursor-pointer"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>

              {/* Bold / Italic */}
              <div className="flex gap-2">
                <button
                  onClick={() => update({ bold: !text.bold })}
                  className={`flex-1 flex items-center justify-center gap-1.5 min-h-[36px] rounded-xl text-xs font-medium transition-colors ${
                    text.bold ? 'bg-stone-800 text-white' : 'bg-stone-100/80 text-stone-500 active:bg-stone-200'
                  }`}
                >
                  <Bold size={14} />粗体
                </button>
                <button
                  onClick={() => update({ italic: !text.italic })}
                  className={`flex-1 flex items-center justify-center gap-1.5 min-h-[36px] rounded-xl text-xs font-medium transition-colors ${
                    text.italic ? 'bg-stone-800 text-white' : 'bg-stone-100/80 text-stone-500 active:bg-stone-200'
                  }`}
                >
                  <Italic size={14} />斜体
                </button>
              </div>

              {/* Alignment */}
              <div className="flex bg-stone-100/80 rounded-xl p-1">
                {alignOptions.map(({ value, Icon }) => (
                  <button
                    key={value}
                    onClick={() => update({ align: value })}
                    className={`relative flex-1 flex items-center justify-center min-h-[32px] rounded-lg transition-colors ${
                      text.align === value ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 active:text-stone-500'
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>

              {/* Text color */}
              <div className="flex gap-2 flex-wrap items-center">
                {['#ffffff', '#1a1a1a', '#f0ede8', '#2a2520'].map((color) => (
                  <button key={color} onClick={() => update({ color })} className="relative group p-0.5">
                    <div
                      className="w-8 h-8 rounded-full transition-transform duration-150 group-active:scale-90"
                      style={{
                        backgroundColor: color,
                        boxShadow: color === '#ffffff' || color === '#f0ede8' ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                      }}
                    />
                    {text.color === color && <div className="absolute inset-0 rounded-full border-2 border-stone-600" />}
                  </button>
                ))}
                {extractedColors.map((color) => (
                  <button key={`tc-${color}`} onClick={() => update({ color })} className="relative group p-0.5">
                    <div className="w-8 h-8 rounded-full transition-transform duration-150 group-active:scale-90" style={{ backgroundColor: color }} />
                    {text.color === color && <div className="absolute inset-0 rounded-full border-2 border-stone-600" />}
                  </button>
                ))}
                <div className="relative p-0.5">
                  <input type="color" value={text.color} onChange={(e) => update({ color: e.target.value })} className="w-8 h-8 rounded-full cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* Typography */}
          {activeTab === 'typography' && (
            <div className="space-y-0.5">
              <CompactSlider label="字号" value={text.fontSize} min={0} max={40} unit="px"
                onChange={(v) => update({ fontSize: v })} />
              <CompactSlider label="字间距" value={text.letterSpacing} min={0} max={0.3} step={0.01} unit="em"
                onChange={(v) => update({ letterSpacing: v })} />
              <CompactSlider label="行高" value={text.lineHeight} min={1} max={2.5} step={0.05} unit=""
                onChange={(v) => update({ lineHeight: v })} />
              <CompactSlider label="宽度" value={text.width} min={45} max={90} unit="%"
                onChange={(v) => update({ width: v })} />
            </div>
          )}

          {/* Position */}
          {activeTab === 'position' && (
            <div className="space-y-2">
              {/* Quick position presets */}
              <div className="flex gap-1.5">
                {[
                  { label: '顶部居中', x: 50, y: 8 },
                  { label: '默认位置', x: 50, y: 16 },
                  { label: '中部居中', x: 50, y: 30 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => update({ x: preset.x, y: preset.y })}
                    className={`flex-1 min-h-[32px] rounded-lg text-[11px] font-medium transition-colors ${
                      text.x === preset.x && text.y === preset.y
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-100/80 text-stone-500 active:bg-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <CompactSlider label="水平" value={text.x} min={5} max={95} unit="%"
                onChange={(v) => update({ x: v })} />
              <CompactSlider label="垂直" value={text.y} min={2} max={50} unit="%"
                onChange={(v) => update({ y: v })} />

              <div className="flex items-center gap-1.5 px-1 pt-1">
                <Move size={11} className="text-stone-300" />
                <span className="text-[10px] text-stone-300">可直接拖动海报上的文字</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
