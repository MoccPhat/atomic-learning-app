import { describe, it, expect } from 'vitest';
import { calculateNextReview, filterDueCards, updateStreak } from '../lib/srs-engine';
import { Card } from '../lib/types';

describe('SRS Engine (Spaced Repetition)', () => {
  const baseCard: Card = {
    id: 'test-1',
    category: 'code',
    title: 'Python List Comprehension',
    front: 'Cú pháp tạo list gồm các số chẵn từ 0 đến 9',
    back: '[x for x in range(10) if x % 2 == 0]',
    tags: ['python', 'syntax'],
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: '2026-10-11',
    createdAt: '2026-10-11T00:00:00.000Z',
  };

  it('khi chọn Again (1), interval phải reset về 1 và repetitions về 0', () => {
    const activeCard = { ...baseCard, interval: 10, repetitions: 3, easeFactor: 2.5 };
    const result = calculateNextReview(activeCard, 1, new Date('2026-10-11'));

    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.easeFactor).toBeLessThan(2.5);
    expect(result.dueDate).toBe('2026-10-12');
  });

  it('khi lần đầu ôn và chọn Good (3), interval là 1 ngày và repetitions là 1', () => {
    const result = calculateNextReview(baseCard, 3, new Date('2026-10-11'));

    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.dueDate).toBe('2026-10-12');
  });

  it('khi lần đầu ôn và chọn Easy (4), interval là 2 ngày và easeFactor tăng', () => {
    const result = calculateNextReview(baseCard, 4, new Date('2026-10-11'));

    expect(result.interval).toBe(2);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBeGreaterThan(2.5);
    expect(result.dueDate).toBe('2026-10-13');
  });

  it('khi ôn lần 2 và chọn Good (3), interval tăng lên 3 ngày', () => {
    const cardStep1 = { ...baseCard, interval: 1, repetitions: 1, easeFactor: 2.5 };
    const result = calculateNextReview(cardStep1, 3, new Date('2026-10-11'));

    expect(result.interval).toBe(3);
    expect(result.repetitions).toBe(2);
    expect(result.dueDate).toBe('2026-10-14');
  });

  it('khi ôn nhiều lần và chọn Good (3), interval nhân theo easeFactor', () => {
    const matureCard = { ...baseCard, interval: 6, repetitions: 3, easeFactor: 2.5 };
    const result = calculateNextReview(matureCard, 3, new Date('2026-10-11'));

    expect(result.interval).toBe(15); // 6 * 2.5 = 15
    expect(result.repetitions).toBe(4);
  });
});

describe('Card Due Filtering', () => {
  const cards: Card[] = [
    {
      id: 'c1',
      category: 'english',
      title: 'Ephemeral',
      front: 'Ephemeral nghĩa là gì?',
      back: 'Phù du, chóng tàn, ngắn ngủi',
      tags: ['ielts'],
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: '2026-10-10', // Đã quá hạn
      createdAt: '',
    },
    {
      id: 'c2',
      category: 'book',
      title: 'Atomic Habits',
      front: 'Quy tắc 2 phút',
      back: 'Bắt đầu thói quen mới chỉ cần làm trong 2 phút',
      tags: ['habit'],
      interval: 3,
      repetitions: 2,
      easeFactor: 2.5,
      dueDate: '2026-10-11', // Đến hạn hôm nay
      createdAt: '',
    },
    {
      id: 'c3',
      category: 'exam',
      title: 'AWS S3 Storage Classes',
      front: 'Loại S3 nào rẻ nhất cho lưu trữ lưu trữ hiếm khi truy cập?',
      back: 'S3 Glacier Deep Archive',
      tags: ['aws'],
      interval: 7,
      repetitions: 3,
      easeFactor: 2.5,
      dueDate: '2026-10-15', // Chưa đến hạn
      createdAt: '',
    },
  ];

  it('lọc đúng các thẻ đến hạn hoặc quá hạn vào hôm nay 2026-10-11', () => {
    const dueCards = filterDueCards(cards, '2026-10-11');
    expect(dueCards.length).toBe(2);
    expect(dueCards.map(c => c.id)).toEqual(['c1', 'c2']);
  });
});

describe('Streak Calculator', () => {
  it('tăng streak nếu ngày trước đó là hôm qua', () => {
    const { newStreak, isIncremented } = updateStreak(5, '2026-10-10', '2026-10-11');
    expect(newStreak).toBe(6);
    expect(isIncremented).toBe(true);
  });

  it('giữ nguyên streak nếu đã học trong ngày hôm nay', () => {
    const { newStreak, isIncremented } = updateStreak(5, '2026-10-11', '2026-10-11');
    expect(newStreak).toBe(5);
    expect(isIncremented).toBe(false);
  });

  it('reset streak về 1 nếu bị gián đoạn quá 1 ngày', () => {
    const { newStreak, isIncremented } = updateStreak(5, '2026-10-08', '2026-10-11');
    expect(newStreak).toBe(1);
    expect(isIncremented).toBe(true);
  });
});
