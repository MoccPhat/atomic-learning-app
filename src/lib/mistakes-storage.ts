import { MistakeItem, MistakeReason } from './mistakes-types';
import { rewardFocusMinutes } from './focus-pet-storage';

export const MISTAKES_STORAGE_KEY = 'atomic_learning_mistakes';

/**
 * Tải toàn bộ danh sách câu hỏi trong Sổ Lỗi Sai
 */
export function getMistakes(): MistakeItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(MISTAKES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Lỗi khi đọc Sổ Lỗi Sai:', e);
    return [];
  }
}

/**
 * Lưu danh sách Sổ Lỗi Sai
 */
export function saveMistakes(mistakes: MistakeItem[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(mistakes));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('mistakes-updated', { detail: mistakes }));
    }
  } catch (e) {
    console.error('Lỗi khi lưu Sổ Lỗi Sai:', e);
  }
}

/**
 * Ghi nhận một câu làm sai vào Sổ Lỗi Sai (Tự động cập nhật nếu đã từng sai)
 */
export function recordMistake(
  data: Omit<MistakeItem, 'id' | 'createdAt' | 'lastFailedAt' | 'failCount' | 'mastered' | 'reason'> & {
    reason?: MistakeReason;
  }
): MistakeItem {
  const mistakes = getMistakes();
  const now = Date.now();

  // Tìm xem câu hỏi này đã có trong sổ lỗi chưa (dựa theo nội dung câu hỏi)
  const existingIdx = mistakes.findIndex(
    (m) => m.question.trim().toLowerCase() === data.question.trim().toLowerCase()
  );

  let updatedItem: MistakeItem;

  if (existingIdx >= 0) {
    const existing = mistakes[existingIdx];
    updatedItem = {
      ...existing,
      userChoice: data.userChoice || existing.userChoice,
      correctAnswer: data.correctAnswer,
      options: data.options || existing.options,
      explanation: data.explanation || existing.explanation,
      category: data.category || existing.category,
      sourceName: data.sourceName || existing.sourceName,
      failCount: existing.failCount + 1,
      lastFailedAt: now,
      mastered: false, // Bị sai lại nên hủy cờ mastered
      reason: data.reason || existing.reason || 'unknown',
    };
    mistakes[existingIdx] = updatedItem;
  } else {
    updatedItem = {
      id: `mistake_${now}_${Math.random().toString(36).substring(2, 6)}`,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      sourceName: data.sourceName,
      question: data.question,
      userChoice: data.userChoice,
      correctAnswer: data.correctAnswer,
      options: data.options,
      explanation: data.explanation,
      category: data.category,
      reason: data.reason || 'unknown',
      failCount: 1,
      createdAt: now,
      lastFailedAt: now,
      mastered: false,
    };
    mistakes.unshift(updatedItem);
  }

  saveMistakes(mistakes);
  return updatedItem;
}

/**
 * Cập nhật lý do làm sai và ghi chú kinh nghiệm của người dùng
 */
export function updateMistakeReason(
  id: string,
  reason: MistakeReason,
  userNote?: string
): boolean {
  const mistakes = getMistakes();
  const item = mistakes.find((m) => m.id === id);
  if (!item) return false;

  item.reason = reason;
  if (userNote !== undefined) {
    item.userNote = userNote;
  }
  saveMistakes(mistakes);
  return true;
}

/**
 * Cập nhật riêng ghi chú rút kinh nghiệm của người dùng
 */
export function updateMistakeNote(id: string, userNote: string): boolean {
  const mistakes = getMistakes();
  const item = mistakes.find((m) => m.id === id);
  if (!item) return false;

  item.userNote = userNote;
  saveMistakes(mistakes);
  return true;
}

/**
 * Đánh dấu một câu đã phục thù thành công (Mastered) và thưởng hạt cho Pet!
 */
export function markMistakeMastered(
  id: string,
  mastered: boolean = true
): { success: boolean; treatsAwarded: number } {
  const mistakes = getMistakes();
  const item = mistakes.find((m) => m.id === id);
  if (!item) return { success: false, treatsAwarded: 0 };

  item.mastered = mastered;
  if (mastered) {
    item.masteredAt = Date.now();
  } else {
    delete item.masteredAt;
  }
  saveMistakes(mistakes);

  // Thưởng hạt cho Pet khi khắc phục thành công lỗi sai!
  let treatsAwarded = 0;
  if (mastered) {
    try {
      rewardFocusMinutes(5); // Tương đương hoàn thành 1 mini task tập trung, cộng hạt và EXP
      treatsAwarded = 1;
    } catch (e) {
      console.error('Lỗi khi thưởng hạt pet:', e);
    }
  }

  return { success: true, treatsAwarded };
}

/**
 * Thống kê tổng số, số câu đã phục thù và số câu còn đang sai
 */
export function getMistakeStats(): { total: number; mastered: number; active: number } {
  const mistakes = getMistakes();
  const total = mistakes.length;
  const mastered = mistakes.filter((m) => m.mastered).length;
  const active = total - mastered;
  return { total, mastered, active };
}

/**
 * Xóa một mục khỏi Sổ Lỗi Sai
 */
export function deleteMistake(id: string): boolean {
  const mistakes = getMistakes();
  const filtered = mistakes.filter((m) => m.id !== id);
  if (filtered.length !== mistakes.length) {
    saveMistakes(filtered);
    return true;
  }
  return false;
}

/**
 * Xóa toàn bộ Sổ Lỗi Sai
 */
export function clearAllMistakes(): void {
  saveMistakes([]);
}
