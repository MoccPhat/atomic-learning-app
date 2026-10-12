import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTimeRemaining,
  getDeadlines,
  addDeadline,
  toggleDeadline,
  deleteDeadline,
  recordGeneralActivity,
} from '../lib/deadline-storage';
import { getUserStats, recordGeneralActivity as recordGeneralActivityFromStorage } from '../lib/storage';
import { formatDate } from '../lib/srs-engine';

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

describe('Deadlines & Exam Countdown Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('calculateTimeRemaining', () => {
    it('tính toán chính xác thời gian còn lại cho deadline tương lai xa (> 2 ngày)', () => {
      const now = new Date('2026-10-10T10:00:00');
      const dueDate = '2026-10-15T10:00:00'; // cách 5 ngày
      const res = calculateTimeRemaining(dueDate, now);

      expect(res.isOverdue).toBe(false);
      expect(res.isUrgent).toBe(false);
      expect(res.days).toBe(5);
      expect(res.label).toContain('Còn 5 ngày');
    });

    it('nhận diện trạng thái khẩn cấp (<= 2 ngày)', () => {
      const now = new Date('2026-10-10T10:00:00');
      const dueDate = '2026-10-11T20:00:00'; // cách 1 ngày 10 giờ
      const res = calculateTimeRemaining(dueDate, now);

      expect(res.isOverdue).toBe(false);
      expect(res.isUrgent).toBe(true);
      expect(res.days).toBe(1);
      expect(res.hours).toBe(10);
      expect(res.label).toContain('Còn 1 ngày');
    });

    it('tính toán chính xác hạn chót chỉ có ngày YYYY-MM-DD (tính đến 23:59:59)', () => {
      const now = new Date('2026-10-10T12:00:00');
      const dueDate = '2026-10-10'; // cùng ngày, hạn đến 23:59:59
      const res = calculateTimeRemaining(dueDate, now);

      expect(res.isOverdue).toBe(false);
      expect(res.isUrgent).toBe(true);
      expect(res.hours).toBe(11);
      expect(res.label).toContain('Còn 11 giờ');
    });

    it('nhận diện trạng thái Quá hạn (isOverdue = true)', () => {
      const now = new Date('2026-10-15T10:00:00');
      const dueDate = '2026-10-12T10:00:00'; // quá hạn 3 ngày
      const res = calculateTimeRemaining(dueDate, now);

      expect(res.isOverdue).toBe(true);
      expect(res.days).toBe(3);
      expect(res.label).toContain('Quá hạn 3 ngày');
    });
  });

  describe('Deadline Storage CRUD', () => {
    it('getDeadlines trả về mảng rỗng nếu storage trống để người dùng tự nhập deadline', () => {
      const deadlines = getDeadlines();
      expect(Array.isArray(deadlines)).toBe(true);
      expect(deadlines.length).toBe(0);
    });

    it('addDeadline tạo mới một nhiệm vụ thành công và chèn vào đầu danh sách', () => {
      const initialCount = getDeadlines().length;
      const newTask = addDeadline({
        title: 'Nộp bài báo cáo cuối kỳ Mạng Máy Tính',
        dueDate: '2026-10-25',
        priority: 'high',
        note: 'Nộp file PDF',
      });

      expect(newTask.id).toBeDefined();
      expect(newTask.completed).toBe(false);
      expect(newTask.title).toBe('Nộp bài báo cáo cuối kỳ Mạng Máy Tính');

      const all = getDeadlines();
      expect(all.length).toBe(initialCount + 1);
      expect(all[0].id).toBe(newTask.id);
    });

    it('toggleDeadline chuyển đổi trạng thái hoàn thành và ghi nhận completedAt', () => {
      const task = addDeadline({
        title: 'Làm bài trắc nghiệm chương 1',
        dueDate: '2026-10-20',
        priority: 'medium',
      });

      // Bật thành completed
      const { updatedTask } = toggleDeadline(task.id);
      expect(updatedTask?.completed).toBe(true);
      expect(updatedTask?.completedAt).toBeDefined();

      // Bật lại thành chưa completed
      const { updatedTask: toggledBack } = toggleDeadline(task.id);
      expect(toggledBack?.completed).toBe(false);
      expect(toggledBack?.completedAt).toBeUndefined();
    });

    it('deleteDeadline xóa nhiệm vụ khỏi danh sách', () => {
      const task = addDeadline({
        title: 'Task tạm thời cần xóa',
        dueDate: '2026-10-30',
        priority: 'low',
      });

      const remaining = deleteDeadline(task.id);
      expect(remaining.some((t) => t.id === task.id)).toBe(false);
    });
  });

  describe('Activity Logging to Heatmap', () => {
    it('recordGeneralActivity ghi nhận điểm vào historyMap của hôm nay', () => {
      const today = formatDate();
      const initialStats = getUserStats();
      const initialTodayCount = initialStats.historyMap[today] || 0;

      recordGeneralActivity(2);

      const updatedStats = getUserStats();
      expect(updatedStats.historyMap[today]).toBe(initialTodayCount + 2);
    });

    it('recordGeneralActivity trực tiếp từ storage.ts cũng hoạt động đồng nhất', () => {
      const today = formatDate();
      const initialStats = getUserStats();
      const initialTodayCount = initialStats.historyMap[today] || 0;

      recordGeneralActivityFromStorage(3);

      const updatedStats = getUserStats();
      expect(updatedStats.historyMap[today]).toBe(initialTodayCount + 3);
    });
  });
});
