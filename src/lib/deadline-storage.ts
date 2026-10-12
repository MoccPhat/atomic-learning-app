import { DeadlineTask, TimeRemaining } from './deadline-types';
import { recordGeneralActivity } from './storage';

const DEADLINES_STORAGE_KEY = 'atomic_learn_deadlines';

/**
 * Tính toán thời gian còn lại đến hạn chót (Deadline)
 */
export function calculateTimeRemaining(dueDateStr: string, fromDate: Date = new Date()): TimeRemaining {
  // Chuẩn hóa định dạng thời gian
  let targetTime: number;
  if (dueDateStr.includes('T')) {
    targetTime = new Date(dueDateStr).getTime();
  } else {
    // Nếu chỉ có YYYY-MM-DD, tính đến cuối ngày đó (23:59:59)
    targetTime = new Date(`${dueDateStr}T23:59:59`).getTime();
  }

  const diffMs = targetTime - fromDate.getTime();
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  let label = '';
  if (isOverdue) {
    if (days > 0) {
      label = `Quá hạn ${days} ngày`;
    } else if (hours > 0) {
      label = `Quá hạn ${hours} giờ`;
    } else {
      label = `Quá hạn ${minutes} phút`;
    }
  } else {
    if (days > 1) {
      label = `Còn ${days} ngày ${hours} giờ`;
    } else if (days === 1) {
      label = `Còn 1 ngày ${hours} giờ`;
    } else if (hours > 0) {
      label = `Còn ${hours} giờ ${minutes} phút`;
    } else if (minutes > 0) {
      label = `Còn ${minutes} phút!`;
    } else {
      label = 'Đến hạn ngay bây giờ!';
    }
  }

  const isUrgent = !isOverdue && days <= 2;

  return {
    totalMs: diffMs,
    days,
    hours,
    minutes,
    isOverdue,
    isUrgent,
    label,
  };
}

/**
 * Dữ liệu mẫu ban đầu cho Deadlines
 */
function getInitialDeadlines(): DeadlineTask[] {
  const now = new Date();
  const formatOffset = (daysOffset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      id: 'dl-seed-1',
      title: 'Nộp báo cáo bài tập lớn Xử lý ảnh (Lab 2 Canny)',
      subjectId: 'sub-cv',
      subjectName: 'Thị giác máy tính & Xử lý ảnh',
      weekId: 'wk-cv-2',
      weekTitle: 'Tuần 2: Lọc tích chập & Phát hiện biên cạnh',
      dueDate: formatOffset(3),
      priority: 'high',
      completed: false,
      note: 'Yêu cầu đính kèm file .docx và file .ipynb',
      createdAt: now.toISOString(),
    },
    {
      id: 'dl-seed-2',
      title: 'Luyện 30 câu trắc nghiệm Machine Learning',
      subjectId: 'sub-ml',
      subjectName: 'Học máy & Trí tuệ nhân tạo',
      dueDate: formatOffset(5),
      priority: 'medium',
      completed: false,
      note: 'Ôn tập chương Hồi quy tuyến tính',
      createdAt: now.toISOString(),
    },
    {
      id: 'dl-seed-3',
      title: 'Học thuộc 20 từ vựng Tiếng Anh chuyên ngành',
      subjectId: 'sub-en',
      subjectName: 'Tiếng Anh Kỹ Thuật',
      dueDate: formatOffset(1),
      priority: 'low',
      completed: false,
      note: 'Ôn qua thẻ Flashcard',
      createdAt: now.toISOString(),
    },
  ];
}

/**
 * Đọc danh sách Deadlines từ LocalStorage
 */
export function getDeadlines(): DeadlineTask[] {
  try {
    const raw = localStorage.getItem(DEADLINES_STORAGE_KEY);
    if (raw === null) {
      const initial = getInitialDeadlines();
      saveDeadlines(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Bí danh cho getDeadlines
 */
export const loadDeadlines = getDeadlines;

/**
 * Lưu danh sách Deadlines
 */
export function saveDeadlines(deadlines: DeadlineTask[]): void {
  try {
    localStorage.setItem(DEADLINES_STORAGE_KEY, JSON.stringify(deadlines));
  } catch (e) {
    console.error('Lỗi khi lưu deadlines:', e);
  }
}

/**
 * Thêm một Deadline / Nhiệm vụ mới
 */
export function addDeadline(
  task: Omit<DeadlineTask, 'id' | 'createdAt' | 'completed'>
): DeadlineTask {
  const current = getDeadlines();
  const newTask: DeadlineTask = {
    ...task,
    id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newTask, ...current];
  saveDeadlines(updated);
  return newTask;
}

/**
 * Bật/tắt trạng thái hoàn thành Deadline
 */
export function toggleDeadline(id: string): { updatedTask: DeadlineTask | null; all: DeadlineTask[] } {
  const current = getDeadlines();
  let updatedTask: DeadlineTask | null = null;

  const updatedList = current.map((task) => {
    if (task.id !== id) return task;
    const isNowCompleted = !task.completed;
    updatedTask = {
      ...task,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    };
    return updatedTask;
  });

  saveDeadlines(updatedList);

  // Nếu vừa hoàn thành, tự động ghi nhận +1 vào Heatmap hoạt động hôm nay!
  if (updatedTask && (updatedTask as DeadlineTask).completed) {
    recordGeneralActivity(1);
  }

  return { updatedTask, all: updatedList };
}

/**
 * Xóa một Deadline
 */
export function deleteDeadline(id: string): DeadlineTask[] {
  const current = getDeadlines();
  const updated = current.filter((t) => t.id !== id);
  saveDeadlines(updated);
  return updated;
}

export { recordGeneralActivity };
