import { describe, it, expect, beforeEach } from 'vitest';
import { getCards, saveCards, deleteCardsByCategory, deleteAllCards } from '../lib/storage';
import { Card } from '../lib/types';

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

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

describe('Category Deletion & Batch Delete', () => {
  const mockCards: Card[] = [
    {
      id: 'c-1',
      category: 'code',
      title: 'Python List',
      front: 'List comp',
      back: 'Syntax',
      tags: ['python'],
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00.000Z',
    },
    {
      id: 'c-2',
      category: 'code',
      title: 'JavaScript Async',
      front: 'Async/await',
      back: 'Promise wrapper',
      tags: ['js'],
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00.000Z',
    },
    {
      id: 'c-3',
      category: 'english',
      title: 'Cut corners',
      front: 'Idiom meaning',
      back: 'Do something perfunctorily',
      tags: ['idioms'],
      interval: 2,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: '2026-10-13',
      createdAt: '2026-10-12T00:00:00.000Z',
    },
    {
      id: 'c-4',
      category: 'book',
      title: 'Atomic Habits',
      front: '2 minute rule',
      back: 'Start habits under 2 minutes',
      tags: ['habits'],
      interval: 3,
      repetitions: 2,
      easeFactor: 2.5,
      dueDate: '2026-10-14',
      createdAt: '2026-10-12T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    saveCards(mockCards);
  });

  it('xóa toàn bộ thẻ thuộc một danh mục cụ thể (code)', () => {
    const deletedCount = deleteCardsByCategory('code');
    expect(deletedCount).toBe(2);

    const remaining = getCards();
    expect(remaining.length).toBe(2);
    expect(remaining.every((c) => c.category !== 'code')).toBe(true);
    expect(remaining.map((c) => c.id)).toEqual(['c-3', 'c-4']);
  });

  it('xóa danh mục không có thẻ nào trả về 0 và giữ nguyên các thẻ khác', () => {
    const deletedCount = deleteCardsByCategory('exam');
    expect(deletedCount).toBe(0);

    const remaining = getCards();
    expect(remaining.length).toBe(4);
  });

  it('xóa tất cả thẻ làm sạch toàn bộ thẻ và không tự nạp lại seed data', () => {
    const totalDeleted = deleteAllCards();
    expect(totalDeleted).toBe(4);

    const remaining = getCards();
    expect(remaining).toEqual([]);
    expect(remaining.length).toBe(0);
  });
});
