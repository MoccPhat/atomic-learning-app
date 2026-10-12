import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadQuizSets,
  saveQuizSets,
  getInitialQuizSet,
  deleteQuizSet,
  addQuizSetFromText,
} from '../lib/quiz-storage';
import {
  getMindMaps,
  saveMindMap,
  INITIAL_MINDMAPS,
  deleteMindMap,
} from '../lib/mindmap-storage';
import {
  getDeadlines,
  saveDeadlines,
  getInitialDeadlines,
  deleteDeadline,
} from '../lib/deadline-storage';

// Polyfill localStorage cho môi trường kiểm thử Vitest
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
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

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

describe('Storage Deletion Persistence (Karpathy Verification)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Quiz Storage Deletion', () => {
    it('khởi tạo danh sách rỗng khi LocalStorage hoàn toàn chưa có dữ liệu (null)', () => {
      const initial = loadQuizSets();
      expect(initial).toEqual([]);
    });

    it('xóa bộ đề duy nhất thành công và không bị tự động hồi sinh dữ liệu mẫu', () => {
      saveQuizSets(getInitialQuizSet());
      const initial = loadQuizSets();
      expect(initial.length).toBe(1);
      const targetId = initial[0].id;

      // Thực hiện xóa bộ đề
      deleteQuizSet(targetId);

      // Tải lại danh sách sau khi xóa
      const remaining = loadQuizSets();
      expect(remaining).toEqual([]);
      expect(remaining.length).toBe(0);
    });

    it('nạp đề mới rồi xóa hết thì danh sách vẫn giữ nguyên trạng thái rỗng', () => {
      const markdown = `
# Đề thi Thử Mạng Máy Tính
Câu 1: Giao thức nào hoạt động ở tầng Transport?
A. IP
B. TCP
C. HTTP
D. ARP
Đáp án: B
Giải thích: TCP và UDP thuộc Transport Layer.
`;
      const res = addQuizSetFromText(markdown, 'Mạng máy tính');
      expect(res.success).toBe(true);

      const listAfterAdd = loadQuizSets();
      const addedQuiz = listAfterAdd.find((q) => q.name.includes('Mạng Máy Tính'));
      expect(addedQuiz).toBeDefined();

      if (addedQuiz) {
        deleteQuizSet(addedQuiz.id);
      }

      // Xóa tất cả các quiz còn lại nếu có
      loadQuizSets().forEach((q) => deleteQuizSet(q.id));

      const finalList = loadQuizSets();
      expect(finalList).toHaveLength(0);
    });
  });

  describe('MindMap Storage Deletion', () => {
    it('khởi tạo danh sách mindmaps rỗng khi chưa có dữ liệu', () => {
      const maps = getMindMaps();
      expect(maps).toEqual([]);
    });

    it('xóa toàn bộ mindmap không bị hồi sinh INITIAL_MINDMAPS', () => {
      saveMindMap(INITIAL_MINDMAPS[0]);
      const maps = getMindMaps();
      expect(maps.length).toBeGreaterThan(0);

      maps.forEach((m) => deleteMindMap(m.id));

      const remaining = getMindMaps();
      expect(remaining).toEqual([]);
      expect(remaining.length).toBe(0);
    });
  });

  describe('Deadline Storage Deletion', () => {
    it('xóa toàn bộ deadlines không bị hồi sinh', () => {
      saveDeadlines(getInitialDeadlines());
      const initial = getDeadlines();
      expect(initial.length).toBeGreaterThan(0);

      initial.forEach((d) => deleteDeadline(d.id));

      const remaining = getDeadlines();
      expect(remaining).toEqual([]);
      expect(remaining.length).toBe(0);
    });
  });
});
