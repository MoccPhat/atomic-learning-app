import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCornellNotes,
  createCornellNote,
  updateCornellNote,
  deleteCornellNote,
  convertCuesToFlashcards,
  exportCornellNoteToMarkdown,
} from '../lib/cornell-storage';
import { getCards } from '../lib/storage';

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

describe('Cornell Notes Studio - Storage & SRS Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('khởi tạo dữ liệu mẫu ban đầu khi LocalStorage trống', () => {
    const notes = getCornellNotes();
    expect(notes.length).toBeGreaterThanOrEqual(2);
    expect(notes[0].title).toContain('Tìm kiếm Nhị phân');
    expect(notes[0].cues.length).toBeGreaterThan(0);
  });

  it('tạo ghi chú mới với các trường hợp mặc định', () => {
    const newNote = createCornellNote({
      title: 'Học React hooks',
      category: 'code',
      notes: 'useEffect quản lý side effect',
      summary: 'Hooks giúp code tinh gọn hơn',
      cues: [{ id: 'cue-1', cue: 'useEffect chạy khi nào?', referenceAnswer: 'Sau khi render' }],
    });

    expect(newNote.id).toBeDefined();
    expect(newNote.title).toBe('Học React hooks');

    const loaded = getCornellNotes();
    expect(loaded.some((n) => n.id === newNote.id)).toBe(true);
  });

  it('cập nhật thành công nội dung ghi chú Cornell', () => {
    const note = createCornellNote({ title: 'Ghi chú ban đầu' });
    const updated = updateCornellNote(note.id, {
      title: 'Ghi chú sau cập nhật',
      summary: 'Tóm tắt bài học mới',
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Ghi chú sau cập nhật');
    expect(updated?.summary).toBe('Tóm tắt bài học mới');
  });

  it('xóa ghi chú thành công khỏi danh sách', () => {
    const note = createCornellNote({ title: 'Bài ghi chú cần xóa' });
    expect(getCornellNotes().some((n) => n.id === note.id)).toBe(true);

    const isDeleted = deleteCornellNote(note.id);
    expect(isDeleted).toBe(true);
    expect(getCornellNotes().some((n) => n.id === note.id)).toBe(false);
  });

  it('1-Click: chuyển đổi Cues thành Flashcard SRS đưa vào kho ôn tập', () => {
    const note = createCornellNote({
      title: 'Cấu trúc Dữ liệu Cây (Trees)',
      category: 'code',
      cues: [
        { id: 'c1', cue: 'Cây nhị phân tìm kiếm (BST) là gì?', referenceAnswer: 'Cây có nút con trái nhỏ hơn và nút con phải lớn hơn nút cha.' },
        { id: 'c2', cue: 'Độ phức tạp tìm kiếm trong BST cân bằng?', referenceAnswer: 'O(log n)' },
      ],
      summary: 'BST cho phép tìm kiếm nhanh như Binary Search trên mảng.',
    });

    const initialCardsCount = getCards().length;
    const result = convertCuesToFlashcards(note.id);

    expect(result.createdCount).toBe(2);
    expect(result.newCardIds.length).toBe(2);

    const allCards = getCards();
    expect(allCards.length).toBe(initialCardsCount + 2);

    const createdCard1 = allCards.find((c) => c.id === result.newCardIds[0]);
    expect(createdCard1?.front).toBe('Cây nhị phân tìm kiếm (BST) là gì?');
    expect(createdCard1?.back).toContain('Cây có nút con trái nhỏ hơn');
    expect(createdCard1?.tags).toContain('cornell');
  });

  it('xuất bài ghi chú chuẩn Cornell thành file Markdown có cấu trúc', () => {
    const note = createCornellNote({
      title: 'Quy luật Pareto 80/20',
      category: 'book',
      cues: [{ id: 'c1', cue: 'Nguyên lý 80/20 là gì?', referenceAnswer: '80% kết quả đến từ 20% nguyên nhân cốt lõi' }],
      notes: 'Tập trung vào 20% nỗ lực quan trọng nhất.',
      summary: 'Tối ưu hóa thời gian bằng cách loại bỏ 80% việc vụn vặt.',
      tags: ['productivity'],
    });

    const markdown = exportCornellNoteToMarkdown(note);
    expect(markdown).toContain('# Quy luật Pareto 80/20');
    expect(markdown).toContain('## 1. Cột Gợi Nhớ (Cues / Questions)');
    expect(markdown).toContain('## 2. Ghi Chép Chi Tiết (Notes)');
    expect(markdown).toContain('## 3. Tóm Tắt Đúc Kết (Summary)');
    expect(markdown).toContain('productivity');
  });
});
