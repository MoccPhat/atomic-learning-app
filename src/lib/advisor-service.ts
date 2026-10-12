import { Card, Category, UserStats } from './types';
import { filterDueCards } from './srs-engine';
import { DeadlineTask } from './deadline-types';
import { loadDeadlines } from './deadline-storage';
import {
  AdvisorInsights,
  RoadmapTask,
  RoadmapTaskStatus,
  StudyRecommendation,
} from './advisor-types';

const ROADMAP_STORAGE_KEY = 'auto_learning_roadmap_tasks';

export const INITIAL_ROADMAP_TASKS: RoadmapTask[] = [
  {
    id: 'task-1',
    title: 'Hoàn thành phiên ôn tập 8 thẻ Flashcard định kỳ',
    category: 'code',
    status: 'today',
    estimatedMinutes: 10,
    targetSubject: 'Cấu trúc dữ liệu & Thuật toán',
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: '25 phút Pomodoro: Đọc tài liệu Tiếng Anh & Collocations',
    category: 'english',
    status: 'today',
    estimatedMinutes: 25,
    targetSubject: 'IELTS Academic Vocabulary',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Ghi chép Cornell: Thuật toán Binary Search & Cues',
    category: 'code',
    status: 'in_progress',
    estimatedMinutes: 20,
    targetSubject: 'Công nghệ thông tin',
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Luyện 1 bộ đề trắc nghiệm kiểm tra kiến thức',
    category: 'exam',
    status: 'done',
    estimatedMinutes: 15,
    targetSubject: 'Ôn thi chứng chỉ',
    priority: 'low',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

/**
 * Đọc danh sách nhiệm vụ lộ trình (Roadmap Kanban - mặc định rỗng để người dùng tự lập kế hoạch của mình)
 */
export function getRoadmapTasks(): RoadmapTask[] {
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (!raw) {
      saveRoadmapTasks([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Lỗi khi đọc Roadmap Tasks:', e);
    return [];
  }
}

/**
 * Lưu danh sách nhiệm vụ lộ trình vào LocalStorage
 */
export function saveRoadmapTasks(tasks: RoadmapTask[]): void {
  try {
    localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Lỗi khi lưu Roadmap Tasks:', e);
  }
}

/**
 * Thêm một nhiệm vụ mới vào bảng Kanban
 */
export function addRoadmapTask(
  data: Omit<RoadmapTask, 'id' | 'createdAt' | 'completedAt'>
): RoadmapTask {
  const tasks = getRoadmapTasks();
  const newTask: RoadmapTask = {
    ...data,
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  saveRoadmapTasks(tasks);
  return newTask;
}

/**
 * Cập nhật trạng thái nhiệm vụ Kanban (Today -> In Progress -> Done)
 */
export function updateRoadmapTaskStatus(
  taskId: string,
  newStatus: RoadmapTaskStatus
): RoadmapTask | null {
  const tasks = getRoadmapTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return null;

  const current = tasks[index];
  const updated: RoadmapTask = {
    ...current,
    status: newStatus,
    completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
  };

  tasks[index] = updated;
  saveRoadmapTasks(tasks);
  return updated;
}

/**
 * Xóa một nhiệm vụ Kanban
 */
export function deleteRoadmapTask(taskId: string): boolean {
  const tasks = getRoadmapTasks();
  const filtered = tasks.filter((t) => t.id !== taskId);
  if (filtered.length !== tasks.length) {
    saveRoadmapTasks(filtered);
    return true;
  }
  return false;
}

/**
 * Phân tích dữ liệu học tập thông minh:
 * Quét Heatmap, Deadline, Thẻ đến hạn ôn, Nhiệm vụ Kanban để sinh khuyến nghị
 */
export function generateStudyInsights(
  cards: Card[],
  stats: UserStats,
  providedDeadlines?: DeadlineTask[]
): AdvisorInsights {
  const deadlines = providedDeadlines || loadDeadlines();
  const tasks = getRoadmapTasks();
  const dueCards = filterDueCards(cards);

  const recommendations: StudyRecommendation[] = [];
  const now = new Date();

  // 1. Phân tích Deadlines khẩn cấp (< 48 giờ hoặc quá hạn)
  const urgentDeadlines = deadlines.filter((d: DeadlineTask) => {
    if (d.completed) return false;
    const dueTime = new Date(`${d.dueDate}T23:59:59`).getTime();
    const diffHours = (dueTime - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 48;
  });

  urgentDeadlines.forEach((dl: DeadlineTask) => {
    const dueTime = new Date(`${dl.dueDate}T23:59:59`).getTime();
    const isOverdue = dueTime < now.getTime();

    recommendations.push({
      id: `rec-deadline-${dl.id}`,
      type: 'urgent_deadline',
      severity: isOverdue ? 'urgent' : 'warning',
      title: isOverdue ? `⚠️ Deadline Quá Hạn: ${dl.title}` : `⏰ Deadline Gấp: ${dl.title}`,
      message: `Hạn chót vào ngày ${dl.dueDate} (${dl.subjectName || 'Bài tập'}). Hãy khởi động 1 phiên Pomodoro tập trung để giải quyết ngay.`,
      actionText: 'Bật Pomodoro ngay',
      actionTab: 'pomodoro',
    });
  });

  // 2. Phân tích Thẻ Flashcard đang chờ ôn tập
  if (dueCards.length > 0) {
    recommendations.push({
      id: 'rec-due-cards',
      type: 'pending_reviews',
      severity: dueCards.length >= 10 ? 'urgent' : 'suggestion',
      title: `⚡ Có ${dueCards.length} thẻ kiến thức cần củng cố`,
      message: `Đừng để đường cong quên Ebbinghaus làm phai mờ trí nhớ. Dành khoảng ${Math.ceil(
        dueCards.length * 0.5
      )} phút để hoàn thành.`,
      actionText: 'Ôn tập thẻ ngay',
      actionTab: 'cards',
    });
  }

  // 3. Phân tích Môn học / Lĩnh vực bị bỏ quên (Neglected subjects)
  // Đếm số thẻ theo từng category
  const categories: Category[] = ['code', 'english', 'book', 'exam'];
  const neglectedCategories: Category[] = [];

  categories.forEach((cat) => {
    const catCards = cards.filter((c) => c.category === cat);
    // Nếu có thẻ thuộc danh mục này nhưng toàn bộ chưa có lượt ôn hoặc không có hoạt động trong 4 ngày
    if (catCards.length > 0) {
      const hasReviewedRecently = catCards.some((c) => c.repetitions > 0 && c.interval > 0);
      if (!hasReviewedRecently) {
        neglectedCategories.push(cat);
      }
    }
  });

  if (neglectedCategories.length > 0) {
    const catNames: Record<Category, string> = {
      code: 'Lập trình',
      english: 'Ngoại ngữ',
      book: 'Đọc sách',
      exam: 'Ôn thi chứng chỉ',
    };
    const neglectedLabels = neglectedCategories.map((c) => catNames[c]).join(', ');

    recommendations.push({
      id: 'rec-neglected',
      type: 'neglected_subject',
      severity: 'suggestion',
      title: `🌱 Môn học cần thêm sự chú ý: ${neglectedLabels}`,
      message:
        'Bạn đang dành nhiều thời gian cho các môn khác. Hãy ghi chép 1 bài Cornell hoặc làm 1 phiên tập trung để giữ đều đặn nhịp độ.',
      category: neglectedCategories[0],
      actionText: 'Mở Ghi chú Cornell',
      actionTab: 'cornell',
    });
  }

  // 4. Khen ngợi & Thúc đẩy Streak
  if (stats.streak >= 3) {
    recommendations.push({
      id: 'rec-streak-praise',
      type: 'study_momentum',
      severity: 'praise',
      title: `🔥 Chuỗi phong độ ấn tượng: ${stats.streak} ngày liên tục!`,
      message:
        'Thói quen học tập của bạn đang được duy trì rất tốt. Giữ vững ngọn lửa nhiệt huyết ngày hôm nay nhé!',
      actionText: 'Xem Cây tài liệu',
      actionTab: 'tree',
    });
  }

  // Tính điểm sẵn sàng (Readiness Score 0 - 100%)
  let score = 85;
  if (urgentDeadlines.length > 0) score -= urgentDeadlines.length * 15;
  if (dueCards.length > 15) score -= 10;
  if (stats.streak === 0) score -= 10;
  if (stats.streak >= 5) score += 10;

  const completedToday = tasks.filter((t) => t.status === 'done').length;
  score += completedToday * 5;

  const readinessScore = Math.max(20, Math.min(100, Math.round(score)));

  return {
    readinessScore,
    urgentCount: urgentDeadlines.length,
    totalTasksToday: tasks.length,
    completedTasksToday: completedToday,
    neglectedCategories,
    recommendations,
  };
}
