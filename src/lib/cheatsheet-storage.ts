import { CheatSheetItem, CheatSheetCategory } from './cheatsheet-types';
export { INITIAL_CHEATSHEETS } from './cheatsheet-seed-data';

const STORAGE_KEY = 'atomic_cheatsheet_vault';

/**
 * Nạp danh sách Cheat Sheets (mặc định rỗng để người dùng tự thêm cẩm nang tra cứu)
 */
export function getCheatSheets(): CheatSheetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveCheatSheets([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Lỗi khi nạp Cheat Sheets:', e);
    return [];
  }
}

/**
 * Lưu danh sách Cheat Sheets vào LocalStorage
 */
export function saveCheatSheets(items: CheatSheetItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Lỗi khi lưu Cheat Sheets:', e);
  }
}

/**
 * Thêm một Cheat Sheet mới do người dùng tự tạo
 */
export function addCustomCheatSheet(item: Omit<CheatSheetItem, 'id' | 'isCustom'>): CheatSheetItem {
  const list = getCheatSheets();
  const newItem: CheatSheetItem = {
    ...item,
    id: `cs-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isCustom: true,
  };
  list.unshift(newItem);
  saveCheatSheets(list);
  return newItem;
}

/**
 * Xóa một Cheat Sheet
 */
export function deleteCheatSheet(id: string): void {
  const list = getCheatSheets();
  const filtered = list.filter((item) => item.id !== id);
  saveCheatSheets(filtered);
}

/**
 * Tìm kiếm nhanh Cheat Sheet theo từ khóa và chủ đề
 */
export function searchCheatSheets(
  items: CheatSheetItem[],
  query: string,
  categoryFilter: CheatSheetCategory | 'all' = 'all'
): CheatSheetItem[] {
  const q = query.trim().toLowerCase();

  return items.filter((item) => {
    // 1. Lọc theo danh mục
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    // 2. Lọc theo từ khóa
    if (!q) return true;

    return (
      item.title.toLowerCase().includes(q) ||
      item.syntax.toLowerCase().includes(q) ||
      item.explanation.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}
