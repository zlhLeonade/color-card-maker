export interface TextStyle {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  x: number;       // percentage from left (center of text box)
  y: number;       // percentage from top
  width: number;   // percentage width of text box (45–90)
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
}

/** Position for any independently draggable text box */
export interface TextBoxPos {
  x: number;   // percentage from left (center of box)
  y: number;   // percentage from top
}

export type ColorInfoMode = 'none' | 'name' | 'name-hex';

export interface ExifData {
  dateTime?: string;    // formatted as YYYY.MM.DD
  cameraModel?: string;
}

export interface ExifSettings {
  showDate: boolean;
  showCamera: boolean;
  showColorInfo: ColorInfoMode;
}

export type CropAspect = 'original' | '1:1' | '3:2' | '4:3' | '16:9' | '9:16';

export type ExportQuality = 'sd' | 'hd' | 'fhd' | 'uhd';

export interface ExportPreset {
  id: ExportQuality;
  label: string;
  width: number;
  height: number;
  description: string;
  warn?: string;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'sd',  label: '标清', width: 1080, height: 1440, description: '1080 × 1440' },
  { id: 'hd',  label: '高清', width: 1620, height: 2160, description: '1620 × 2160' },
  { id: 'fhd', label: '超清', width: 2160, height: 2880, description: '2160 × 2880' },
  { id: 'uhd', label: '极清', width: 3240, height: 4320, description: '3240 × 4320', warn: '文件较大，建议桌面端使用' },
];

export interface PosterState {
  originalImage: string | null;
  croppedImage: string | null;
  cropAspect: CropAspect;
  bgColor: string;
  colors: string[];
  text: TextStyle;
  mainTextBox: TextBoxPos;
  dateTextBox: TextBoxPos;
  cameraTextBox: TextBoxPos;
  colorInfoTextBox: TextBoxPos;
  imageOffsetY: number;       // -50..50 object-position Y
  showNoise: boolean;
  noiseIntensity: number;     // 0–100
  exifData: ExifData | null;
  exifSettings: ExifSettings;
  exportQuality: ExportQuality;
}

export const DEFAULT_STATE: PosterState = {
  originalImage: null,
  croppedImage: null,
  cropAspect: '3:2',
  bgColor: '#c8b8a8',
  colors: [],
  text: {
    content: 'Found in the light.',
    fontFamily: '"Special Elite", cursive',
    fontSize: 28,
    color: '#f0ede8',
    x: 50,
    y: 16,
    width: 70,
    bold: false,
    italic: false,
    align: 'center',
    letterSpacing: 0.06,
    lineHeight: 1.5,
  },
  mainTextBox: { x: 50, y: 16 },
  dateTextBox: { x: 50, y: 85 },
  cameraTextBox: { x: 50, y: 90 },
  colorInfoTextBox: { x: 50, y: 94 },
  imageOffsetY: 0,
  showNoise: false,
  noiseIntensity: 15,
  exifData: null,
  exifSettings: { showDate: false, showCamera: false, showColorInfo: 'none' },
  exportQuality: 'fhd',
};

/* ── Collage types ── */

export interface CollagePhoto {
  id: string;
  src: string;        // data URL
  originalName: string;
}

export interface CollageCell {
  x: number;      // percentage
  y: number;
  w: number;      // percentage width
  h: number;      // percentage height
}

export interface CollageTemplate {
  id: string;
  label: string;
  cells: CollageCell[];
}

export const COLLAGE_TEMPLATES: CollageTemplate[] = [
  {
    id: 'side-2',
    label: '左右二分',
    cells: [
      { x: 0, y: 0, w: 50, h: 100 },
      { x: 50, y: 0, w: 50, h: 100 },
    ],
  },
  {
    id: 'major-left-2',
    label: '左大右小',
    cells: [
      { x: 0, y: 0, w: 66.67, h: 100 },
      { x: 66.67, y: 0, w: 33.33, h: 100 },
    ],
  },
  {
    id: 'top-bottom-2',
    label: '上下二分',
    cells: [
      { x: 0, y: 0, w: 100, h: 50 },
      { x: 0, y: 50, w: 100, h: 50 },
    ],
  },
  {
    id: 'tri-left-3',
    label: '左一右二',
    cells: [
      { x: 0, y: 0, w: 50, h: 100 },
      { x: 50, y: 0, w: 50, h: 50 },
      { x: 50, y: 50, w: 50, h: 50 },
    ],
  },
  {
    id: 'tri-top-3',
    label: '上一下二',
    cells: [
      { x: 0, y: 0, w: 100, h: 50 },
      { x: 0, y: 50, w: 50, h: 50 },
      { x: 50, y: 50, w: 50, h: 50 },
    ],
  },
  {
    id: 'grid-4',
    label: '四宫格',
    cells: [
      { x: 0, y: 0, w: 50, h: 50 },
      { x: 50, y: 0, w: 50, h: 50 },
      { x: 0, y: 50, w: 50, h: 50 },
      { x: 50, y: 50, w: 50, h: 50 },
    ],
  },
  {
    id: 'cross-4',
    label: '十字四格',
    cells: [
      { x: 0, y: 0, w: 66.67, h: 50 },
      { x: 66.67, y: 0, w: 33.33, h: 50 },
      { x: 0, y: 50, w: 33.33, h: 50 },
      { x: 33.33, y: 50, w: 66.67, h: 50 },
    ],
  },
  {
    id: 'five-grid',
    label: '五宫格',
    cells: [
      { x: 0, y: 0, w: 50, h: 50 },
      { x: 50, y: 0, w: 50, h: 50 },
      { x: 0, y: 50, w: 33.33, h: 50 },
      { x: 33.33, y: 50, w: 33.33, h: 50 },
      { x: 66.67, y: 50, w: 33.33, h: 50 },
    ],
  },
];

export type CollageExportQuality = 'hd' | 'fhd' | 'uhd';

export interface CollageExportPreset {
  id: CollageExportQuality;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const COLLAGE_EXPORT_PRESETS: CollageExportPreset[] = [
  { id: 'hd',  label: '高清', width: 1920, height: 1080, description: '1920 × 1080' },
  { id: 'fhd', label: '超清', width: 2560, height: 1440, description: '2560 × 1440' },
  { id: 'uhd', label: '极清', width: 3840, height: 2160, description: '3840 × 2160' },
];

export interface CollageState {
  photos: CollagePhoto[];
  templateId: string;
  bgColor: string;
  gap: number;        // px in preview, scales on export
  padding: number;    // outer padding
  exportQuality: CollageExportQuality;
}

export const DEFAULT_COLLAGE_STATE: CollageState = {
  photos: [],
  templateId: 'side-2',
  bgColor: '#1a1a1a',
  gap: 4,
  padding: 8,
  exportQuality: 'fhd',
};

export type AppMode = 'colorwalk' | 'collage';

export interface FontOption {
  label: string;
  value: string;
  group: 'serif' | 'sans' | 'handwriting' | 'cjk';
}

export const FONT_OPTIONS: FontOption[] = [
  // CJK
  { label: '文楷 / WenKai', value: '"LXGW WenKai", KaiTi, STKaiti, serif', group: 'cjk' },
  { label: '楷体 / KaiTi', value: 'KaiTi, STKaiti, serif', group: 'cjk' },
  { label: '宋体 / Songti', value: 'SimSun, "Songti SC", serif', group: 'cjk' },
  { label: '仿宋 / FangSong', value: 'FangSong, STFangsong, serif', group: 'cjk' },
  { label: '黑体 / Heiti', value: 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', group: 'cjk' },
  // Serif
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif', group: 'serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif', group: 'serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif', group: 'serif' },
  // Handwriting
  { label: 'Special Elite', value: '"Special Elite", cursive', group: 'handwriting' },
  { label: 'Caveat', value: '"Caveat", cursive', group: 'handwriting' },
  { label: 'Dancing Script', value: '"Dancing Script", cursive', group: 'handwriting' },
  { label: 'Patrick Hand', value: '"Patrick Hand", cursive', group: 'handwriting' },
  { label: 'Kalam', value: '"Kalam", cursive', group: 'handwriting' },
  { label: 'Indie Flower', value: '"Indie Flower", cursive', group: 'handwriting' },
  { label: 'Shadows Into Light', value: '"Shadows Into Light", cursive', group: 'handwriting' },
];
