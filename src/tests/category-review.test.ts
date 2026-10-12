import { describe, it, expect } from 'vitest';
import { Card } from '../lib/types';
import {
  filterDueCardsByCategory,
  getDueCountsByCategory,
  formatDate,
} from '../lib/srs-engine';

describe('Category-based Flashcard Review Tests', () => {
  const today = formatDate();
  const yesterday = '2026-10-10';
  const tomorrow = '2026-10-20';

  const sampleCards: Card[] = [
    {
      id: 'c1',
      category: 'code',
      title: 'React useEffect',
      front: 'useEffect dùng để làm gì?',
      back: 'Xử lý side effects trong component.',
      tags: ['react'],
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: yesterday, // Đến hạn
      createdAt: '2026-10-01',
    },
    {
      id: 'c2',
      category: 'code',
      title: 'TypeScript Generics',
      front: 'Generics là gì?',
      back: 'Tạo component/hàm linh hoạt kiểu dữ liệu.',
      tags: ['ts'],
      interval: 5,
      repetitions: 2,
      easeFactor: 2.5,
      dueDate: tomorrow, // Chưa đến hạn
      createdAt: '2026-10-01',
    },
    {
      id: 'c3',
      category: 'english',
      title: 'Ubiquitous',
      front: 'Ubiquitous nghĩa là gì?',
      back: 'Có mặt ở khắp mọi nơi.',
      tags: ['vocab'],
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      dueDate: today, // Đến hạn
      createdAt: '2026-10-01',
    },
    {
      id: 'c4',
      category: 'english',
      title: 'Serendipity',
      front: 'Serendipity nghĩa là gì?',
      back: 'Sự may mắn tình cờ tìm thấy điều tốt đẹp.',
      tags: ['vocab'],
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: yesterday, // Đến hạn
      createdAt: '2026-10-01',
    },
    {
      id: 'c5',
      category: 'exam',
      title: 'AWS S3 Storage Classes',
      front: 'Các lớp lưu trữ của S3?',
      back: 'Standard, IA, Glacier, Deep Archive.',
      tags: ['aws'],
      interval: 2,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: yesterday, // Đến hạn
      createdAt: '2026-10-01',
    },
    {
      id: 'c6',
      category: 'book',
      title: 'Atomic Habits',
      front: 'Quy tắc 2 phút trong Atomic Habits?',
      back: 'Bắt đầu thói quen mới trong vòng dưới 2 phút.',
      tags: ['habits'],
      interval: 10,
      repetitions: 3,
      easeFactor: 2.6,
      dueDate: tomorrow, // Chưa đến hạn
      createdAt: '2026-10-01',
    },
  ];

  it('lọc chính xác thẻ đến hạn theo từng danh mục chuyên môn', () => {
    // 1. Chỉ ôn Lập trình
    const codeDue = filterDueCardsByCategory(sampleCards, 'code', today);
    expect(codeDue).toHaveLength(1);
    expect(codeDue[0].id).toBe('c1');

    // 2. Chỉ ôn Ngoại ngữ
    const englishDue = filterDueCardsByCategory(sampleCards, 'english', today);
    expect(englishDue).toHaveLength(2);
    expect(englishDue.map((c) => c.id)).toEqual(['c3', 'c4']);

    // 3. Chỉ ôn Chứng chỉ
    const examDue = filterDueCardsByCategory(sampleCards, 'exam', today);
    expect(examDue).toHaveLength(1);
    expect(examDue[0].id).toBe('c5');

    // 4. Môn Đọc sách chưa có thẻ nào đến hạn
    const bookDue = filterDueCardsByCategory(sampleCards, 'book', today);
    expect(bookDue).toHaveLength(0);

    // 5. Ôn tất cả danh mục
    const allDue = filterDueCardsByCategory(sampleCards, 'all', today);
    expect(allDue).toHaveLength(4); // c1, c3, c4, c5
  });

  it('tính toán số lượng thẻ đến hạn chính xác cho từng danh mục', () => {
    const dueCounts = getDueCountsByCategory(sampleCards, today);

    expect(dueCounts.all).toBe(4);
    expect(dueCounts.code).toBe(1);
    expect(dueCounts.english).toBe(2);
    expect(dueCounts.exam).toBe(1);
    expect(dueCounts.book).toBe(0);
  });
});
