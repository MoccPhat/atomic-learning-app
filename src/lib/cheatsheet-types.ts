export type CheatSheetCategory = 'dev' | 'math' | 'english' | 'devops' | 'regex';

export interface CheatSheetItem {
  id: string;
  title: string;
  category: CheatSheetCategory;
  syntax: string;
  explanation: string;
  example?: string;
  tags: string[];
  isCustom?: boolean;
}

export const CHEATSHEET_CATEGORY_META: Record<
  CheatSheetCategory,
  { label: string; icon: string; color: string }
> = {
  dev: { label: 'Lập trình & Web', icon: '💻', color: 'indigo' },
  devops: { label: 'Linux & Git & Docker', icon: '⚡', color: 'emerald' },
  math: { label: 'Toán & Khoa học', icon: '📐', color: 'amber' },
  english: { label: 'Ngữ pháp & Tiếng Anh', icon: '🌍', color: 'sky' },
  regex: { label: 'Biểu thức Regex', icon: '🎯', color: 'purple' },
};
