import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMistakes,
  recordMistake,
  updateMistakeReason,
  updateMistakeNote,
  markMistakeMastered,
  deleteMistake,
  clearAllMistakes,
  getMistakeStats,
} from '../lib/mistakes-storage';
import { extractCardsHeuristically, saveExtractedCardsAndQuizzes } from '../lib/auto-card-generator';
import { getCards } from '../lib/storage';
import { loadQuizSets } from '../lib/quiz-storage';

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

describe('Smart Mistake Notebook & Error Log Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ghi nhận câu làm sai lần đầu với failCount = 1 và trạng thái mastered = false', () => {
    const item = recordMistake({
      sourceType: 'quiz',
      sourceId: 'quiz-1',
      sourceName: 'Toán Rời Rạc',
      question: 'Định lý Bayes dùng để làm gì?',
      userChoice: 'A. Tính tích phân',
      correctAnswer: 'B. Tính xác suất có điều kiện',
      category: 'Toán',
      reason: 'unknown',
    });

    expect(item).toBeDefined();
    expect(item.failCount).toBe(1);
    expect(item.mastered).toBe(false);
    expect(item.question).toBe('Định lý Bayes dùng để làm gì?');

    const mistakes = getMistakes();
    expect(mistakes.length).toBe(1);
    expect(mistakes[0].id).toBe(item.id);
  });

  it('tăng failCount khi làm sai cùng một câu hỏi nhiều lần', () => {
    recordMistake({
      sourceType: 'quiz',
      sourceId: 'quiz-1',
      sourceName: 'Toán Rời Rạc',
      question: 'Định lý Bayes dùng để làm gì?',
      userChoice: 'A. Tính tích phân',
      correctAnswer: 'B. Tính xác suất có điều kiện',
      category: 'Toán',
    });

    const secondTry = recordMistake({
      sourceType: 'quiz',
      sourceId: 'quiz-1',
      sourceName: 'Toán Rời Rạc',
      question: 'Định lý Bayes dùng để làm gì?',
      userChoice: 'C. Đếm số hoán vị',
      correctAnswer: 'B. Tính xác suất có điều kiện',
      category: 'Toán',
    });

    expect(secondTry.failCount).toBe(2);
    const mistakes = getMistakes();
    expect(mistakes.length).toBe(1);
    expect(mistakes[0].failCount).toBe(2);
  });

  it('cập nhật nhãn nguyên nhân sai và ghi chú phản tư cá nhân', () => {
    const item = recordMistake({
      sourceType: 'flashcard',
      sourceId: 'card-123',
      sourceName: 'Lập trình',
      question: 'Closure trong JavaScript là gì?',
      correctAnswer: 'Hàm ghi nhớ lexical scope của nó',
      category: 'code',
      reason: 'unknown',
    });

    updateMistakeReason(item.id, 'forgot_concept');
    updateMistakeNote(item.id, 'Cần vẽ lại sơ đồ call stack và scope chain');

    const updatedList = getMistakes();
    expect(updatedList[0].reason).toBe('forgot_concept');
    expect(updatedList[0].userNote).toBe('Cần vẽ lại sơ đồ call stack và scope chain');
  });

  it('đánh dấu làm chủ lỗi sai (Mastered) và chuyển trạng thái', () => {
    const item = recordMistake({
      sourceType: 'quiz',
      sourceId: 'q-1',
      sourceName: 'Kinh Tế Vi Mô',
      question: 'Độ co giãn của cầu theo giá là gì?',
      userChoice: 'C. Tỷ số chi phí',
      correctAnswer: 'A. % thay đổi lượng cầu / % thay đổi giá',
      category: 'Kinh tế',
    });

    expect(item.mastered).toBe(false);

    markMistakeMastered(item.id, true);
    let mistakes = getMistakes();
    expect(mistakes[0].mastered).toBe(true);

    const stats = getMistakeStats();
    expect(stats.total).toBe(1);
    expect(stats.mastered).toBe(1);
    expect(stats.active).toBe(0);
  });

  it('xóa từng lỗi sai và xóa toàn bộ sổ lỗi', () => {
    const m1 = recordMistake({
      sourceType: 'quiz',
      sourceId: 'q-1',
      sourceName: 'Vật Lý',
      question: 'Công thức F = ma của ai?',
      correctAnswer: 'Newton',
      category: 'Vật lý',
    });

    const m2 = recordMistake({
      sourceType: 'quiz',
      sourceId: 'q-2',
      sourceName: 'Hóa Học',
      question: 'Nguyên tử khối của Cacbon?',
      correctAnswer: '12',
      category: 'Hóa',
    });

    expect(getMistakes().length).toBe(2);

    deleteMistake(m1.id);
    expect(getMistakes().length).toBe(1);
    expect(getMistakes()[0].id).toBe(m2.id);

    clearAllMistakes();
    expect(getMistakes().length).toBe(0);
  });
});

describe('1-Click Auto Card & Quiz Generator (Offline Heuristic Engine)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('trích xuất định nghĩa thuật ngữ thành Flashcards và Quiz từ văn bản thô', () => {
    const sampleText = `
# Tổng quan về Trí Tuệ Nhân Tạo

1. Học máy (Machine Learning): là một tập con của AI cho phép hệ thống tự học từ dữ liệu mà không cần lập trình tường minh.
2. Học sâu (Deep Learning): là một nhánh của học máy dựa trên mạng nơ-ron nhân tạo nhiều tầng.
3. Overfitting: hiện tượng mô hình học quá khớp với dữ liệu huấn luyện dẫn đến dự đoán kém trên dữ liệu mới.
4. Regularization: kỹ thuật ngăn chặn overfitting bằng cách phạt các trọng số lớn.
    `.trim();

    const result = extractCardsHeuristically(sampleText);

    expect(result.flashcards.length).toBeGreaterThanOrEqual(3);
    expect(result.quizzes.length).toBeGreaterThanOrEqual(1);

    const mlCard = result.flashcards.find((f) => f.title.toLowerCase().includes('học máy') || f.front.toLowerCase().includes('học máy'));
    expect(mlCard).toBeDefined();
    expect(mlCard?.back).toContain('tập con của AI');
  });

  it('lưu trữ thành công các Flashcard và đề Quiz đã rút trích vào LocalStorage', () => {
    const mockExtraction = {
      flashcards: [
        {
          title: 'Thuật toán A*',
          front: 'Thuật toán A* là gì?',
          back: 'Thuật toán tìm đường đi ngắn nhất sử dụng hàm heuristic f(n) = g(n) + h(n).',
          selected: true,
        },
        {
          title: 'Dijkstra',
          front: 'Thuật toán Dijkstra là gì?',
          back: 'Thuật toán tìm đường đi ngắn nhất từ một đỉnh nguồn trong đồ thị có trọng số không âm.',
          selected: false, // Không chọn
        },
      ],
      quizzes: [
        {
          question: 'Hàm chi phí của thuật toán A* có dạng nào?',
          options: [
            { key: 'A', text: 'f(n) = g(n) + h(n)' },
            { key: 'B', text: 'f(n) = g(n) * h(n)' },
            { key: 'C', text: 'f(n) = g(n) - h(n)' },
            { key: 'D', text: 'f(n) = h(n)' },
          ],
          answer: 'A',
          explanation: 'g(n) là chi phí thực tế từ đỉnh xuất phát, h(n) là ước lượng đến đích.',
          selected: true,
        },
      ],
      sourceLength: 500,
      engineUsed: 'heuristic' as const,
    };

    const saveRes = saveExtractedCardsAndQuizzes(mockExtraction, 'code', 'Đề Kiểm Tra Giải Thuật');

    expect(saveRes.cardsSaved).toBe(1); // Chỉ lưu 1 thẻ có selected: true
    expect(saveRes.quizzesSaved).toBe(1);

    const cardsInStore = getCards();
    expect(cardsInStore.some((c) => c.title === 'Thuật toán A*')).toBe(true);

    const quizSets = loadQuizSets();
    expect(quizSets.some((qs) => qs.name.includes('Đề Kiểm Tra Giải Thuật'))).toBe(true);
  });
});
