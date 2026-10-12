import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCheatSheets,
  addCustomCheatSheet,
  deleteCheatSheet,
  searchCheatSheets,
} from '../lib/cheatsheet-storage';
import { INITIAL_CHEATSHEETS } from '../lib/cheatsheet-seed-data';

// Polyfill localStorage cho Vitest môi trường Node
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: mockStorage });

describe('Cheat Sheet & Quick Reference Vault', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('nạp đầy đủ dữ liệu mẫu khởi tạo khi chưa có trong LocalStorage', () => {
    const list = getCheatSheets();
    expect(list.length).toBe(INITIAL_CHEATSHEETS.length);
    expect(list.some((item) => item.category === 'devops')).toBe(true);
    expect(list.some((item) => item.category === 'dev')).toBe(true);
    expect(list.some((item) => item.category === 'math')).toBe(true);
  });

  it('tìm kiếm tức thì theo từ khóa chính xác', () => {
    const list = getCheatSheets();
    const results = searchCheatSheets(list, 'git reset');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].syntax).toContain('git reset --soft');
  });

  it('lọc công thức theo danh mục chủ đề', () => {
    const list = getCheatSheets();
    const mathItems = searchCheatSheets(list, '', 'math');
    expect(mathItems.length).toBeGreaterThanOrEqual(1);
    expect(mathItems.every((item) => item.category === 'math')).toBe(true);
  });

  it('thêm công thức tự tạo (isCustom) và xóa thành công', () => {
    const custom = addCustomCheatSheet({
      title: 'Lệnh kill port nhanh',
      category: 'devops',
      syntax: 'npx kill-port 3000',
      explanation: 'Tắt ngay tiến trình treo cổng 3000',
      tags: ['kill', 'port'],
    });

    expect(custom.isCustom).toBe(true);
    let all = getCheatSheets();
    expect(all[0].id).toBe(custom.id);

    deleteCheatSheet(custom.id);
    all = getCheatSheets();
    expect(all.some((item) => item.id === custom.id)).toBe(false);
  });
});
