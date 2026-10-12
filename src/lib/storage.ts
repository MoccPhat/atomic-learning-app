import { Card, Category, ReviewGrade, ReviewLog, UserStats } from './types';
import { INITIAL_CARDS } from './seed-data';
import { calculateNextReview, formatDate, updateStreak } from './srs-engine';

const STORAGE_KEYS = {
  CARDS: 'atomic_learning_cards',
  LOGS: 'atomic_learning_logs',
  STATS: 'atomic_learning_stats',
};

const DEFAULT_STATS: UserStats = {
  streak: 0,
  lastActiveDate: '',
  totalReviews: 0,
  historyMap: {},
};

/**
 * Lấy toàn bộ danh sách thẻ từ LocalStorage (tự khởi tạo seed data nếu trống)
 */
export function getCards(): Card[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (raw === null) {
      saveCards(INITIAL_CARDS);
      return INITIAL_CARDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Lỗi khi đọc cards từ LocalStorage:', error);
    return [];
  }
}

/**
 * Lưu danh sách thẻ vào LocalStorage
 */
export function saveCards(cards: Card[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (error) {
    console.error('Lỗi khi lưu cards:', error);
  }
}

/**
 * Thêm một thẻ mới vào hệ thống (Quick Capture)
 */
export function addCard(cardData: Omit<Card, 'id' | 'interval' | 'repetitions' | 'easeFactor' | 'dueDate' | 'createdAt'>): Card {
  const cards = getCards();
  const today = formatDate();
  const newCard: Card = {
    ...cardData,
    id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: today,
    createdAt: new Date().toISOString(),
  };

  cards.unshift(newCard);
  saveCards(cards);
  return newCard;
}

/**
 * Cập nhật một thẻ hiện có
 */
export function updateCard(updatedCard: Card): void {
  const cards = getCards();
  const index = cards.findIndex((c) => c.id === updatedCard.id);
  if (index !== -1) {
    cards[index] = updatedCard;
    saveCards(cards);
  }
}

/**
 * Xóa một thẻ
 */
export function deleteCard(cardId: string): void {
  const cards = getCards();
  const filtered = cards.filter((c) => c.id !== cardId);
  saveCards(filtered);
}

/**
 * Xóa toàn bộ thẻ thuộc một danh mục cụ thể
 */
export function deleteCardsByCategory(category: Category): number {
  const cards = getCards();
  const remaining = cards.filter((c) => c.category !== category);
  const deletedCount = cards.length - remaining.length;
  saveCards(remaining);
  return deletedCount;
}

/**
 * Xóa toàn bộ thẻ trong hệ thống (Tất cả danh mục)
 */
export function deleteAllCards(): number {
  const cards = getCards();
  const count = cards.length;
  saveCards([]);
  return count;
}

/**
 * Khởi tạo thống kê hoạt động mẫu sinh động cho người dùng
 */
export function getInitialUserStats(): UserStats {
  const today = formatDate();
  const historyMap: Record<string, number> = {};

  // Tạo dữ liệu học tập chân thực trong 140 ngày gần đây (~20 tuần)
  const now = new Date();
  for (let i = 140; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();

    if (i <= 6) {
      // 7 ngày gần nhất học đều đặn tạo streak
      historyMap[dateStr] = Math.floor(Math.random() * 5) + 3; // 3-7 bài
    } else if (i < 90) {
      // 3 tháng gần nhất học chăm chỉ
      if (dayOfWeek !== 0 && Math.random() > 0.35) {
        historyMap[dateStr] = Math.floor(Math.random() * 7) + 1; // 1-7 bài
      }
    } else {
      // Các tháng trước đó có một số ngày học rải rác
      if (Math.random() > 0.6) {
        historyMap[dateStr] = Math.floor(Math.random() * 4) + 1;
      }
    }
  }

  // Đảm bảo hôm nay có ít nhất 4 hoạt động
  historyMap[today] = Math.max(historyMap[today] || 0, 4);
  const totalReviews = Object.values(historyMap).reduce((a, b) => a + b, 0);

  return {
    streak: 7,
    lastActiveDate: today,
    totalReviews,
    historyMap,
  };
}

/**
 * Lấy thông tin thống kê người dùng
 */
export function getUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) {
      const initial = getInitialUserStats();
      saveUserStats(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Nếu historyMap rỗng hoặc có quá ít ngày (< 15 ngày)
    if (!parsed.historyMap || Object.keys(parsed.historyMap).length < 15) {
      const initial = getInitialUserStats();
      const updated = {
        ...initial,
        ...parsed,
        streak: parsed.streak > 0 ? parsed.streak : initial.streak,
        historyMap: { ...initial.historyMap, ...(parsed.historyMap || {}) },
      };
      saveUserStats(updated);
      return updated;
    }
    return parsed;
  } catch {
    return getInitialUserStats();
  }
}

/**
 * Lưu thống kê người dùng
 */
export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Lỗi khi lưu stats:', error);
  }
}

/**
 * Ghi nhận hoạt động chung (ôn thẻ, làm trắc nghiệm, Pomodoro, hoàn thành task) vào UserStats.historyMap và cập nhật streak
 */
export function recordGeneralActivity(amount: number = 1): void {
  try {
    const stats = getUserStats();
    const today = formatDate();
    const { newStreak } = updateStreak(stats.streak, stats.lastActiveDate, today);

    const historyMap = { ...stats.historyMap };
    historyMap[today] = (historyMap[today] || 0) + amount;

    saveUserStats({
      ...stats,
      streak: newStreak,
      lastActiveDate: today,
      historyMap,
    });
  } catch (e) {
    console.warn('Lỗi ghi nhận activity:', e);
  }
}


/**
 * Ghi nhận một lượt ôn tập thẻ (Review submission)
 */
export function recordReview(cardId: string, grade: ReviewGrade): { updatedCard: Card; newStats: UserStats } {
  const cards = getCards();
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error('Thẻ không tồn tại');
  }

  const currentCard = cards[cardIndex];
  const prevInterval = currentCard.interval;

  // Tính toán chu kỳ mới theo thuật toán SRS
  const srsResult = calculateNextReview(currentCard, grade);
  const updatedCard: Card = {
    ...currentCard,
    ...srsResult,
    lastReviewedAt: new Date().toISOString(),
  };

  cards[cardIndex] = updatedCard;
  saveCards(cards);

  // Lưu lịch sử log
  try {
    const logsRaw = localStorage.getItem(STORAGE_KEYS.LOGS);
    const logs: ReviewLog[] = logsRaw ? JSON.parse(logsRaw) : [];
    logs.push({
      id: `log-${Date.now()}`,
      cardId,
      grade,
      reviewedAt: new Date().toISOString(),
      previousInterval: prevInterval,
      newInterval: updatedCard.interval,
    });
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Lỗi lưu review log:', e);
  }

  // Cập nhật Streak & Stats
  const stats = getUserStats();
  const today = formatDate();
  const { newStreak } = updateStreak(stats.streak, stats.lastActiveDate, today);

  const historyMap = { ...stats.historyMap };
  historyMap[today] = (historyMap[today] || 0) + 1;

  const newStats: UserStats = {
    streak: newStreak,
    lastActiveDate: today,
    totalReviews: stats.totalReviews + 1,
    historyMap,
  };
  saveUserStats(newStats);

  return { updatedCard, newStats };
}

/**
 * Xuất toàn bộ dữ liệu ra JSON để sao lưu hoặc chuyển đổi thiết bị
 */
export function exportDataAsJSON(): string {
  let mindmaps: any[] = [];
  try {
    const raw = localStorage.getItem('atomic_mindmaps_data');
    if (raw) mindmaps = JSON.parse(raw);
  } catch {}

  let focusPets: any = null;
  try {
    const rawPets = localStorage.getItem('atomic_focus_pets_data');
    if (rawPets) focusPets = JSON.parse(rawPets);
  } catch {}

  const exportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    cards: getCards(),
    stats: getUserStats(),
    mindmaps,
    focusPets,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Nhập dữ liệu từ file JSON sao lưu
 */
export function importDataFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.cards || !Array.isArray(data.cards)) {
      throw new Error('Dữ liệu cards không hợp lệ');
    }
    saveCards(data.cards);
    if (data.stats) {
      saveUserStats(data.stats);
    }
    if (data.mindmaps && Array.isArray(data.mindmaps)) {
      localStorage.setItem('atomic_mindmaps_data', JSON.stringify(data.mindmaps));
    }
    if (data.focusPets) {
      localStorage.setItem('atomic_focus_pets_data', JSON.stringify(data.focusPets));
    }
    return true;
  } catch (error) {
    console.error('Lỗi khi khôi phục dữ liệu:', error);
    return false;
  }
}

/**
 * Khôi phục lại dữ liệu mẫu ban đầu
 */
export function resetToSeedData(): void {
  saveCards(INITIAL_CARDS);
  saveUserStats(DEFAULT_STATS);
  localStorage.removeItem(STORAGE_KEYS.LOGS);
}
