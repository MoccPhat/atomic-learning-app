import { describe, it, expect, beforeEach } from 'vitest';
import {
  getGardenTrees,
  plantCompletedTree,
  recordWitheredTree,
  getGardenStats,
  INITIAL_GARDEN_TREES,
} from '../lib/focus-garden-storage';

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

describe('Virtual Focus Garden Storage & Stats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('nạp dữ liệu khởi tạo khi chưa có dữ liệu trong LocalStorage', () => {
    const trees = getGardenTrees();
    expect(trees.length).toBe(INITIAL_GARDEN_TREES.length);
    expect(trees[0].species).toBe('oak');
  });

  it('trồng cây mới thành công khi hoàn thành phiên Pomodoro', () => {
    const newTree = plantCompletedTree(45, 'Khoa học Máy tính', 'lotus');
    expect(newTree.species).toBe('lotus');
    expect(newTree.stage).toBe('blooming');
    expect(newTree.focusMinutes).toBe(45);
    expect(newTree.subjectName).toBe('Khoa học Máy tính');

    const all = getGardenTrees();
    expect(all[0].id).toBe(newTree.id);
  });

  it('ghi nhận cây héo úa khi phiên bị hủy dở', () => {
    const withered = recordWitheredTree(10, 'Ôn thi');
    expect(withered.stage).toBe('withered');
    expect(withered.focusMinutes).toBe(10);
  });

  it('tính toán cấp bậc người làm vườn chuẩn xác theo số lượng cây', () => {
    // 3 cây mẫu ban đầu: Level 1
    let stats = getGardenStats();
    expect(stats.totalHarvested).toBe(3);
    expect(stats.gardenerLevel).toContain('Level 1');

    // Thêm cây để thăng hạng
    plantCompletedTree(30, 'Toán');
    plantCompletedTree(30, 'Văn');
    plantCompletedTree(30, 'Anh');
    plantCompletedTree(30, 'Lý');
    plantCompletedTree(30, 'Hóa');

    stats = getGardenStats();
    expect(stats.totalHarvested).toBe(8);
    expect(stats.gardenerLevel).toContain('Level 3');
  });
});
