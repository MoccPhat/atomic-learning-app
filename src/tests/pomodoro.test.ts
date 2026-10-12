import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPomodoroSettings,
  savePomodoroSettings,
  recordCompletedPomodoro,
  getRecentPomodoroSessions,
  DEFAULT_POMODORO_SETTINGS,
} from '../lib/pomodoro-storage';
import { getUserStats } from '../lib/storage';
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

describe('Pomodoro Engine & Session Tracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lấy đúng cài đặt mặc định và cho phép lưu cài đặt mới', () => {
    const settings = getPomodoroSettings();
    expect(settings.focusDurationMin).toBe(DEFAULT_POMODORO_SETTINGS.focusDurationMin);
    expect(settings.shortBreakDurationMin).toBe(5);

    savePomodoroSettings({
      ...settings,
      focusDurationMin: 30,
      shortBreakDurationMin: 6,
    });

    const updated = getPomodoroSettings();
    expect(updated.focusDurationMin).toBe(30);
    expect(updated.shortBreakDurationMin).toBe(6);
  });

  it('recordCompletedPomodoro phiên focus cộng dồn thời gian và ghi nhận phiên', () => {
    const today = formatDate();
    const initialUserStats = getUserStats();
    const initialTodayCount = initialUserStats.historyMap[today] || 0;

    const { newSession, updatedStats } = recordCompletedPomodoro({
      mode: 'focus',
      durationMinutes: 25,
      subjectId: 'sub-cv',
      subjectName: 'Thị giác máy tính',
      weekId: 'wk-1',
      weekTitle: 'Tuần 1',
    });

    expect(newSession.id).toBeDefined();
    expect(newSession.completedAt).toBeDefined();
    expect(updatedStats.totalFocusMinutes).toBe(25);
    expect(updatedStats.completedSessionsToday).toBe(1);
    expect(updatedStats.historyBySubject['sub-cv']).toBe(25);

    // Kiểm tra đã tự động ghi nhận vào UserStats.historyMap hôm nay
    const afterUserStats = getUserStats();
    expect(afterUserStats.historyMap[today]).toBe(initialTodayCount + 1);

    // Kiểm tra danh sách phiên gần đây
    const sessions = getRecentPomodoroSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].subjectName).toBe('Thị giác máy tính');
  });

  it('phiên nghỉ giải lao (shortBreak / longBreak) không tính vào tổng phút tập trung', () => {
    const { updatedStats } = recordCompletedPomodoro({
      mode: 'shortBreak',
      durationMinutes: 5,
    });

    expect(updatedStats.totalFocusMinutes).toBe(0);
    expect(updatedStats.completedSessionsToday).toBe(0);
  });
});
