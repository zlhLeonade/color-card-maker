const MONTHS = [
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.',
  'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.',
];

/**
 * Format a date string (YYYY.MM.DD or YYYY-MM-DD) into short form: "May. 14"
 */
export function formatExifDateShort(dateStr: string): string {
  const match = dateStr.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
  if (!match) return dateStr;
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  if (month < 0 || month > 11) return dateStr;
  return `${MONTHS[month]} ${day}`;
}
