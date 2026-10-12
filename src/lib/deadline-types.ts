export type DeadlinePriority = 'high' | 'medium' | 'low';

export interface DeadlineTask {
  id: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  weekId?: string;
  weekTitle?: string;
  dueDate: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  priority: DeadlinePriority;
  completed: boolean;
  completedAt?: string;
  note?: string;
  createdAt: string;
}

export interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
  isUrgent: boolean; // <= 2 days remaining
  label: string; // e.g. "Còn 3 ngày", "Còn 5 giờ 30 phút", "Đã quá hạn 2 ngày"
}
