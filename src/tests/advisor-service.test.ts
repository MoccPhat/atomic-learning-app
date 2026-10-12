import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRoadmapTasks,
  addRoadmapTask,
  updateRoadmapTaskStatus,
  deleteRoadmapTask,
  generateStudyInsights,
} from '../lib/advisor-service';
import { Card, UserStats } from '../lib/types';
import { DeadlineTask } from '../lib/deadline-types';

// Polyfill localStorage cho Vitest
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

describe('Smart Study Advisor & Kanban Roadmap Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('khởi tạo danh sách nhiệm vụ rỗng ban đầu để người dùng tự lập kế hoạch', () => {
    const tasks = getRoadmapTasks();
    expect(tasks).toEqual([]);
  });

  it('thêm nhiệm vụ mới vào bảng Kanban', () => {
    const newTask = addRoadmapTask({
      title: 'Luyện 20 từ vựng chuyên ngành',
      category: 'english',
      status: 'today',
      estimatedMinutes: 20,
      priority: 'high',
      targetSubject: 'Tiếng Anh Kỹ Thuật',
    });

    expect(newTask.id).toBeDefined();
    expect(newTask.createdAt).toBeDefined();

    const tasks = getRoadmapTasks();
    expect(tasks.some((t) => t.id === newTask.id)).toBe(true);
  });

  it('cập nhật trạng thái nhiệm vụ sang done và gắn completedAt', () => {
    const task = addRoadmapTask({
      title: 'Học bài',
      category: 'code',
      status: 'today',
      estimatedMinutes: 15,
      priority: 'medium',
    });

    const updated = updateRoadmapTaskStatus(task.id, 'done');
    expect(updated?.status).toBe('done');
    expect(updated?.completedAt).toBeDefined();
  });

  it('xóa nhiệm vụ khỏi bảng Kanban', () => {
    const task = addRoadmapTask({
      title: 'Task bỏ qua',
      category: 'book',
      status: 'today',
      estimatedMinutes: 10,
      priority: 'low',
    });

    const deleted = deleteRoadmapTask(task.id);
    expect(deleted).toBe(true);
    expect(getRoadmapTasks().some((t) => t.id === task.id)).toBe(false);
  });

  it('phân tích thông minh: phát hiện deadline gấp và thẻ đến hạn', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const deadlines: DeadlineTask[] = [
      {
        id: 'dl-urgent',
        title: 'Nộp đồ án Web cuối kỳ',
        dueDate: tomorrowStr,
        priority: 'high',
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const cards: Card[] = [
      {
        id: 'c-due',
        category: 'code',
        title: 'Python Dict',
        front: 'Dict syntax',
        back: '{}',
        tags: ['py'],
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      },
    ];

    const stats: UserStats = {
      streak: 5,
      lastActiveDate: new Date().toISOString().slice(0, 10),
      totalReviews: 25,
      historyMap: {},
    };

    const insights = generateStudyInsights(cards, stats, deadlines);

    expect(insights.urgentCount).toBe(1);
    expect(insights.readinessScore).toBeGreaterThanOrEqual(20);
    expect(insights.readinessScore).toBeLessThanOrEqual(100);

    // Kiểm tra có khuyến nghị deadline gấp
    expect(insights.recommendations.some((r) => r.type === 'urgent_deadline')).toBe(true);
    // Kiểm tra có khuyến nghị ôn thẻ đến hạn
    expect(insights.recommendations.some((r) => r.type === 'pending_reviews')).toBe(true);
    // Kiểm tra có khen ngợi streak
    expect(insights.recommendations.some((r) => r.type === 'study_momentum')).toBe(true);
  });
});
