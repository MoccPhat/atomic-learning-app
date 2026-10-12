export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusDurationMin: number; // Mặc định 25
  shortBreakDurationMin: number; // Mặc định 5
  longBreakDurationMin: number; // Mặc định 15
  longBreakInterval: number; // Sau bao nhiêu phiên focus thì nghỉ dài (mặc định 4)
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

export interface PomodoroSession {
  id: string;
  mode: PomodoroMode;
  durationMinutes: number;
  subjectId?: string;
  subjectName?: string;
  weekId?: string;
  weekTitle?: string;
  completedAt: string; // ISO date string
}

export interface PomodoroStats {
  totalFocusMinutes: number;
  completedSessionsToday: number;
  totalCompletedSessions: number;
  historyBySubject: Record<string, number>; // subjectId -> totalMinutes
  lastSessionDate: string;
}

export type AmbientSoundType = 'none' | 'rain' | 'ocean' | 'whitenoise';

export interface LofiTrack {
  id: string;
  title: string;
  videoId: string;
  tag: string;
  duration?: string;
}

export const TRIPLEG_TRACKS: LofiTrack[] = [
  { id: 'tg-1', title: 'honeycomb latte.', videoId: '17orSQHgJvM', tag: 'Lofi Soul 🍯', duration: '1:00:00' },
  { id: 'tg-2', title: 'earth matcha.', videoId: 'GsEY33EcHvo', tag: 'Chill Beats 🍵', duration: '1:00:00' },
  { id: 'tg-3', title: 'matcha affogato.', videoId: 'r25_g3FxTt0', tag: 'Relaxing 🍦', duration: '1:00:00' },
  { id: 'tg-4', title: 'strawberry jasmine.', videoId: 'SubsJvp716Q', tag: 'Cozy Study 🍓', duration: '1:00:00' },
  { id: 'tg-5', title: 'sakura matcha.', videoId: '5ASRtPeH4Po', tag: 'Peaceful 🌸', duration: '1:00:00' },
  { id: 'tg-6', title: 'ocean soda.', videoId: 'L_NxsrzwHuU', tag: 'Deep Focus 🌊', duration: '1:00:00' },
  { id: 'tg-7', title: 'coconut.', videoId: 'a-x7FtKaAU4', tag: 'Summer Chill 🥥', duration: '1:00:00' },
  { id: 'tg-8', title: 'turkish coffee.', videoId: 'Ska-3ecJipY', tag: 'Warm & Calm ☕', duration: '1:00:00' },
  { id: 'tg-9', title: 'blueberry soda.', videoId: 'VNsIbELcjes', tag: 'Gentle Beats 🫐', duration: '1:00:00' },
  { id: 'tg-10', title: 'lotus soda.', videoId: 'tkxVD3ewhD4', tag: 'Flow State 🪷', duration: '1:00:00' },
];
