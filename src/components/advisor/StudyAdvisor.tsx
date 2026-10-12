import React, { useState, useMemo } from 'react';
import {
  Compass,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Zap,
  TrendingUp,
  BookOpen,
  Code,
  Globe,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, Category, UserStats } from '../../lib/types';
import { TreeData } from '../../lib/tree-types';
import {
  AdvisorInsights,
  RoadmapTask,
  RoadmapTaskStatus,
} from '../../lib/advisor-types';
import {
  getRoadmapTasks,
  addRoadmapTask,
  updateRoadmapTaskStatus,
  deleteRoadmapTask,
  generateStudyInsights,
} from '../../lib/advisor-service';
import { loadDeadlines } from '../../lib/deadline-storage';

interface StudyAdvisorProps {
  cards: Card[];
  stats: UserStats;
  treeData?: TreeData;
  onNavigateToTab?: (tab: 'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner' | 'cornell' | 'advisor') => void;
  onActivityLogged?: () => void;
}

const CATEGORY_MAP: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  code: { label: 'Lập trình', icon: <Code className="w-3.5 h-3.5" />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
  english: { label: 'Ngoại ngữ', icon: <Globe className="w-3.5 h-3.5" />, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800' },
  book: { label: 'Đọc sách', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  exam: { label: 'Ôn thi cử', icon: <Award className="w-3.5 h-3.5" />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
};

export const StudyAdvisor: React.FC<StudyAdvisorProps> = ({
  cards,
  stats,
  treeData,
  onNavigateToTab,
  onActivityLogged,
}) => {
  const [tasks, setTasks] = useState<RoadmapTask[]>(() => getRoadmapTasks());
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('code');
  const [newTaskMinutes, setNewTaskMinutes] = useState(25);
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tính toán các khuyến nghị và điểm số thông minh
  const insights: AdvisorInsights = useMemo(() => {
    const deadlines = loadDeadlines();
    return generateStudyInsights(cards, stats, deadlines);
  }, [cards, stats, tasks]);

  // Phân chia nhiệm vụ theo 3 cột Kanban
  const kanbanColumns = useMemo(() => {
    return {
      today: tasks.filter((t) => t.status === 'today'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      done: tasks.filter((t) => t.status === 'done'),
    };
  }, [tasks]);

  // Thêm nhiệm vụ mới
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const created = addRoadmapTask({
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      status: 'today',
      estimatedMinutes: newTaskMinutes,
      priority: newTaskPriority,
      targetSubject: treeData?.groups?.[0]?.name || 'Môn học trọng tâm',
    });

    setTasks(getRoadmapTasks());
    setNewTaskTitle('');
    setIsAddingTask(false);
    showToast(`Đã thêm nhiệm vụ "${created.title}" vào lộ trình hôm nay!`);
  };

  // Chuyển trạng thái nhiệm vụ Kanban
  const handleMoveStatus = (taskId: string, targetStatus: RoadmapTaskStatus) => {
    const updated = updateRoadmapTaskStatus(taskId, targetStatus);
    if (updated) {
      setTasks(getRoadmapTasks());
      if (targetStatus === 'done') {
        showToast(`🎉 Tuyệt vời! Đã hoàn thành "${updated.title}"!`);
        onActivityLogged?.();
      }
    }
  };

  // Xóa nhiệm vụ
  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    deleteRoadmapTask(taskId);
    setTasks(getRoadmapTasks());
    showToast(`Đã xóa nhiệm vụ "${taskTitle}"!`);
  };

  // Tính tỷ lệ phân bổ môn học
  const categoryDistribution = useMemo(() => {
    const counts: Record<Category, number> = { code: 0, english: 0, book: 0, exam: 0 };
    cards.forEach((c) => {
      if (counts[c.category] !== undefined) counts[c.category]++;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return {
      code: Math.round((counts.code / total) * 100),
      english: Math.round((counts.english / total) * 100),
      book: Math.round((counts.book / total) * 100),
      exam: Math.round((counts.exam / total) * 100),
    };
  }, [cards]);

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left animate-fade-in space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 shadow-2xl backdrop-blur-md border border-slate-700/50 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header: Trợ Lý Lộ Trình & Smart Advisor */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Trợ Lý Lộ Trình & Nhắc Nhở Thông Minh
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                  Smart Advisor
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Phân tích dữ liệu từ Heatmap, Deadline & SRS để tối ưu hóa thứ tự học tập và đảm bảo không môn học nào bị bỏ quên.
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm mục tiêu hôm nay</span>
          </button>
        </div>
      </div>

      {/* Form thêm nhiệm vụ nhanh khi bấm nút */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md animate-slide-up space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Thêm Nhiệm Vụ Mới Vào Lộ Trình
            </span>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Hủy
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Nội dung nhiệm vụ</label>
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ví dụ: Ôn tập 10 thẻ Lập trình, Đọc 1 bài IELTS..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Lĩnh vực</label>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="code">Lập trình</option>
                <option value="english">Ngoại ngữ</option>
                <option value="book">Đọc sách</option>
                <option value="exam">Ôn thi cử</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Thời gian (phút)</label>
              <input
                type="number"
                min="5"
                max="180"
                step="5"
                value={newTaskMinutes}
                onChange={(e) => setNewTaskMinutes(parseInt(e.target.value) || 25)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Độ ưu tiên</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-500 transition-colors"
            >
              Lưu nhiệm vụ
            </button>
          </div>
        </form>
      )}

      {/* 4 Thẻ KPI Thông Minh: Điểm Sẵn Sàng, Deadline Gấp, Mục Tiêu Hôm Nay, Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Điểm sẵn sàng học tập */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/25 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider block">
              Chỉ số Sẵn sàng Học tập
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                {insights.readinessScore}%
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {insights.readinessScore >= 80 ? 'Rất tốt' : insights.readinessScore >= 60 ? 'Bình thường' : 'Cần chú ý'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Deadline Khẩn cấp */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-transparent border border-rose-500/20 dark:border-rose-500/25 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider block">
              Deadline Cần Giải Quyết
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
                {insights.urgentCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">hạn chót</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Tiến độ nhiệm vụ hôm nay */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/25 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider block">
              Nhiệm Vụ Đã Xong Hôm Nay
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {insights.completedTasksToday}/{insights.totalTasksToday}
              </span>
              <span className="text-xs font-semibold text-slate-400">mục tiêu</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Streak phong độ */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/25 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider block">
              Chuỗi Học Tập (Streak)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                {stats.streak} ngày
              </span>
              <span className="text-xs font-semibold text-slate-400">🔥 liên tục</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* PHẦN 1: CẢNH BÁO & KHUYẾN NGHỊ THÔNG MINH (Smart Recommendations) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Cảnh Báo & Gợi Ý Hành Động Thông Minh
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {insights.recommendations.length} đề xuất
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {insights.recommendations.map((rec) => {
            const isUrgent = rec.severity === 'urgent';
            const isWarning = rec.severity === 'warning';
            const isPraise = rec.severity === 'praise';

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isUrgent
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : isWarning
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : isPraise
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div>
                  <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                    {rec.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {rec.message}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToTab?.(rec.actionTab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs transition-transform active:scale-95 shadow-xs"
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHẦN 2: BẢNG KANBAN LỘ TRÌNH HỌC TẬP TRONG NGÀY (3 Cột) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Bảng Lộ Trình Nhiệm Vụ Trong Ngày (Kanban Roadmap)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Kéo thả hoặc bấm nút để chuyển trạng thái công việc
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CỘT 1: CẦN HỌC HÔM NAY (Today) */}
          <div className="p-4 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Cần học hôm nay
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {kanbanColumns.today.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {kanbanColumns.today.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Không còn việc nào cần làm.
                </div>
              ) : (
                kanbanColumns.today.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_MAP[task.category].color}`}>
                        {CATEGORY_MAP[task.category].label}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedMinutes}p</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                          title="Xóa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {task.priority === 'high' ? '🔥 Gấp' : task.priority === 'medium' ? '⚡ Vừa' : 'Thong thả'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveStatus(task.id, 'in_progress')}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition-colors"
                      >
                        Bắt đầu ➔
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CỘT 2: ĐANG TIẾN HÀNH (In Progress) */}
          <div className="p-4 rounded-3xl bg-amber-50/30 dark:bg-slate-900/60 border border-amber-200/50 dark:border-slate-800 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Đang tiến hành
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400">
                {kanbanColumns.in_progress.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {kanbanColumns.in_progress.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Chưa có nhiệm vụ nào đang học.
                </div>
              ) : (
                kanbanColumns.in_progress.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-amber-300/80 dark:border-amber-800/60 shadow-xs space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_MAP[task.category].color}`}>
                        {CATEGORY_MAP[task.category].label}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedMinutes}p</span>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStatus(task.id, 'today')}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                      >
                        ← Trở lại
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStatus(task.id, 'done')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 transition-colors"
                      >
                        Hoàn thành ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CỘT 3: ĐÃ HOÀN THÀNH (Done) */}
          <div className="p-4 rounded-3xl bg-emerald-50/30 dark:bg-slate-900/60 border border-emerald-200/50 dark:border-slate-800 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Đã hoàn thành hôm nay
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-400">
                {kanbanColumns.done.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {kanbanColumns.done.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Chưa có nhiệm vụ nào hoàn thành.
                </div>
              ) : (
                kanbanColumns.done.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-emerald-200/60 dark:border-emerald-900/40 opacity-80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      <span>✓ Đã xong</span>
                      <span>{task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 line-through">
                      {task.title}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN 3: PHÂN BỔ THỜI LƯỢNG HỌC TẬP THEO MÔN */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Cân Bằng Kiến Thức (Subject Distribution)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Tỷ lệ phân bổ kho kiến thức hiện tại
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['code', 'english', 'book', 'exam'] as const).map((cat) => {
            const catInfo = CATEGORY_MAP[cat];
            const pct = categoryDistribution[cat];

            return (
              <div key={cat} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {catInfo.icon}
                    <span>{catInfo.label}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
