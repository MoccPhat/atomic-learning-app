import { Card, ReviewGrade } from './types';

/**
 * Định dạng ngày Date sang chuỗi YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cộng thêm n ngày vào một ngày cụ thể
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Thuật toán tính toán chu kỳ lặp lại ngắt quãng (SM-2 tối ưu cho Micro-learning)
 * Grade:
 * 1 = Quên hoàn toàn (Again)
 * 2 = Khó khăn (Hard)
 * 3 = Nhớ tốt (Good)
 * 4 = Rất dễ (Easy)
 */
export function calculateNextReview(
  card: Card,
  grade: ReviewGrade,
  currentDate: Date = new Date()
): { interval: number; repetitions: number; easeFactor: number; dueDate: string } {
  let interval: number;
  let repetitions: number;
  let easeFactor = card.easeFactor || 2.5;

  if (grade === 1) {
    // Quên hoàn toàn: Reset chuỗi, ôn lại vào ngày mai
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Nhớ được (Hard, Good, Easy)
    if (card.repetitions === 0) {
      interval = grade === 2 ? 1 : grade === 3 ? 1 : 2;
    } else if (card.repetitions === 1) {
      interval = grade === 2 ? 2 : grade === 3 ? 3 : 5;
    } else {
      interval = Math.round(card.interval * easeFactor);
      if (grade === 2) {
        // Hard: tăng chậm hơn
        interval = Math.max(card.interval + 1, Math.round(interval * 0.8));
      } else if (grade === 4) {
        // Easy: tăng nhanh hơn
        interval = Math.round(interval * 1.3);
      }
    }

    repetitions = card.repetitions + 1;

    // Cập nhật Ease Factor
    if (grade === 4) {
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    } else if (grade === 2) {
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    }
  }

  // Đảm bảo tối thiểu 1 ngày
  interval = Math.max(1, interval);

  const nextDate = addDays(currentDate, interval);
  const dueDate = formatDate(nextDate);

  return {
    interval,
    repetitions,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueDate,
  };
}

/**
 * Kiểm tra xem thẻ có đến hạn cần ôn hay không
 */
export function isCardDue(card: Card, todayStr: string = formatDate()): boolean {
  return card.dueDate <= todayStr;
}

/**
 * Lọc danh sách các thẻ cần ôn hôm nay
 */
export function filterDueCards(cards: Card[], todayStr: string = formatDate()): Card[] {
  return cards.filter((card) => isCardDue(card, todayStr));
}

/**
 * Cập nhật số ngày Streak học liên tục
 */
export function updateStreak(
  currentStreak: number,
  lastActiveDate: string,
  todayStr: string = formatDate()
): { newStreak: number; isIncremented: boolean } {
  if (!lastActiveDate) {
    return { newStreak: 1, isIncremented: true };
  }

  if (lastActiveDate === todayStr) {
    // Đã học hôm nay rồi, giữ nguyên streak
    return { newStreak: currentStreak, isIncremented: false };
  }

  const today = new Date(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  if (lastActiveDate === yesterdayStr) {
    // Học tiếp nối ngày hôm qua -> tăng streak
    return { newStreak: currentStreak + 1, isIncremented: true };
  }

  // Bị ngắt quãng quá 1 ngày -> reset về 1
  return { newStreak: 1, isIncremented: true };
}
