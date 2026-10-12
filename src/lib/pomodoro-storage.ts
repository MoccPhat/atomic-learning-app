import {
  PomodoroSettings,
  PomodoroSession,
  PomodoroStats,
} from './pomodoro-types';
import { recordGeneralActivity } from './storage';
import { formatDate } from './srs-engine';

const STORAGE_KEYS = {
  SETTINGS: 'atomic_learn_pomodoro_settings',
  STATS: 'atomic_learn_pomodoro_stats',
  SESSIONS: 'atomic_learn_pomodoro_sessions',
};

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDurationMin: 25,
  shortBreakDurationMin: 5,
  longBreakDurationMin: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
};

export const DEFAULT_POMODORO_STATS: PomodoroStats = {
  totalFocusMinutes: 0,
  completedSessionsToday: 0,
  totalCompletedSessions: 0,
  historyBySubject: {},
  lastSessionDate: '',
};

/**
 * Lấy cài đặt Pomodoro
 */
export function getPomodoroSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_POMODORO_SETTINGS;
    return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

/**
 * Lưu cài đặt Pomodoro
 */
export function savePomodoroSettings(settings: PomodoroSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Lỗi khi lưu cài đặt Pomodoro:', e);
  }
}

/**
 * Lấy thống kê Pomodoro
 */
export function getPomodoroStats(): PomodoroStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    const today = formatDate();
    if (!raw) return { ...DEFAULT_POMODORO_STATS, lastSessionDate: today };

    const parsed: PomodoroStats = JSON.parse(raw);
    // Nếu sang ngày mới, reset số session hoàn thành hôm nay về 0
    if (parsed.lastSessionDate !== today) {
      parsed.completedSessionsToday = 0;
      parsed.lastSessionDate = today;
      savePomodoroStats(parsed);
    }
    return parsed;
  } catch {
    return DEFAULT_POMODORO_STATS;
  }
}

/**
 * Lưu thống kê Pomodoro
 */
export function savePomodoroStats(stats: PomodoroStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Lỗi khi lưu thống kê Pomodoro:', e);
  }
}

/**
 * Lấy danh sách phiên học gần đây
 */
export function getRecentPomodoroSessions(limit: number = 20): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    const list: PomodoroSession[] = JSON.parse(raw);
    return list.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Ghi nhận hoàn thành một phiên Pomodoro
 */
export function recordCompletedPomodoro(
  sessionData: Omit<PomodoroSession, 'id' | 'completedAt'>
): { newSession: PomodoroSession; updatedStats: PomodoroStats } {
  const today = formatDate();
  const now = new Date();

  const newSession: PomodoroSession = {
    ...sessionData,
    id: `pomo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    completedAt: now.toISOString(),
  };

  // 1. Lưu session
  try {
    const currentSessions = getRecentPomodoroSessions(100);
    const updatedSessions = [newSession, ...currentSessions];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));
  } catch (e) {
    console.error('Lỗi khi lưu phiên Pomodoro:', e);
  }

  // 2. Cập nhật thống kê Pomodoro
  const stats = getPomodoroStats();
  const isToday = stats.lastSessionDate === today;
  const completedToday = (isToday ? stats.completedSessionsToday : 0) + (sessionData.mode === 'focus' ? 1 : 0);

  const updatedHistoryBySubject = { ...stats.historyBySubject };
  if (sessionData.mode === 'focus' && sessionData.subjectId) {
    updatedHistoryBySubject[sessionData.subjectId] =
      (updatedHistoryBySubject[sessionData.subjectId] || 0) + sessionData.durationMinutes;
  }

  const updatedStats: PomodoroStats = {
    totalFocusMinutes:
      stats.totalFocusMinutes + (sessionData.mode === 'focus' ? sessionData.durationMinutes : 0),
    completedSessionsToday: completedToday,
    totalCompletedSessions:
      stats.totalCompletedSessions + (sessionData.mode === 'focus' ? 1 : 0),
    historyBySubject: updatedHistoryBySubject,
    lastSessionDate: today,
  };

  savePomodoroStats(updatedStats);

  // 3. Tự động ghi nhận +1 vào Heatmap chăm chỉ của ngày hôm nay!
  if (sessionData.mode === 'focus') {
    recordGeneralActivity(1);
  }

  return { newSession, updatedStats };
}
