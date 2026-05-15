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

export interface ExifData {
  dateTime?: string;    // formatted as YYYY.MM.DD
  cameraModel?: string;
}

export interface ExifSettings {
  showDate: boolean;
  showCamera: boolean;
}

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
  cropAspect: '4:3' | '3:2';
  bgColor: string;
  colors: string[];
  text: TextStyle;
  imageWidth: number;
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
    content: '把今天的颜色留下',
    fontFamily: '"LXGW WenKai", KaiTi, STKaiti, serif',
    fontSize: 30,
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
  imageWidth: 100,
  exifData: null,
  exifSettings: { showDate: false, showCamera: false },
  exportQuality: 'fhd',
};

export const FONT_OPTIONS = [
  { label: '文楷 / WenKai', value: '"LXGW WenKai", KaiTi, STKaiti, serif' },
  { label: '楷体 / KaiTi', value: 'KaiTi, STKaiti, serif' },
  { label: '宋体 / Songti', value: 'SimSun, "Songti SC", serif' },
  { label: '仿宋 / FangSong', value: 'FangSong, STFangsong, serif' },
  { label: '黑体 / Heiti', value: 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: 'Special Elite', value: '"Special Elite", cursive' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
];
