import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  AlertTriangle,
  Flame,
  Check,
} from 'lucide-react';
import { DeadlineTask, TimeRemaining } from '../../lib/deadline-types';
import {
  getDeadlines,
  toggleDeadline,
  deleteDeadline,
  calculateTimeRemaining,
} from '../../lib/deadline-storage';
import { AddDeadlineModal } from './AddDeadlineModal';
import { TreeData } from '../../lib/tree-types';

interface DeadlineManagerProps {
  treeData?: TreeData;
  onActivityLogged?: () => void;
}

export const DeadlineManager: React.FC<DeadlineManagerProps> = ({
  treeData,
  onActivityLogged,
}) => {
  const [deadlines, setDeadlines] = useState<DeadlineTask[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Nạp danh sách deadlines
  const refreshDeadlines = () => {
    setDeadlines(getDeadlines());
  };

  useEffect(() => {
    refreshDeadlines();
  }, []);

  // Cập nhật đồng hồ đếm ngược mỗi 60 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Xử lý bật tắt hoàn thành
  const handleToggle = (id: string) => {
    const { updatedTask } = toggleDeadline(id);
    refreshDeadlines();
    if (updatedTask?.completed && onActivityLogged) {
      onActivityLogged();
    }
  };

  // Xử lý xóa deadline trực tiếp, hiện toast thông báo thành công
  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDeadline(id);
    refreshDeadlines();
    setToastMessage(`Đã xóa nhiệm vụ "${title}" thành công!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tính toán thời gian và lọc danh sách
  const processedTasks = useMemo(() => {
    return deadlines.map((task) => {
      const remaining = calculateTimeRemaining(task.dueDate, currentTime);
      return {
        task,
        remaining,
      };
    });
  }, [deadlines, currentTime]);

  const filteredTasks = useMemo(() => {
    return processedTasks
      .filter(({ task }) => {
        if (filterTab === 'upcoming') return !task.completed;
        if (filterTab === 'completed') return task.completed;
        return true;
      })
      .filter(({ task }) => {
        if (priorityFilter === 'all') return true;
        return task.priority === priorityFilter;
      })
      .sort((a, b) => {
        // Sắp xếp: chưa hoàn thành lên trước, trong đó quá hạn / khẩn cấp lên đầu
        if (a.task.completed !== b.task.completed) {
          return a.task.completed ? 1 : -1;
        }
        return a.remaining.totalMs - b.remaining.totalMs;
      });
  }, [processedTasks, filterTab, priorityFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const uncompleted = processedTasks.filter((p) => !p.task.completed);
    const overdueCount = uncompleted.filter((p) => p.remaining.isOverdue).length;
    const urgentCount = uncompleted.filter((p) => p.remaining.isUrgent).length;
    const completedCount = processedTasks.filter((p) => p.task.completed).length;

    return {
      total: processedTasks.length,
      uncompleted: uncompleted.length,
      overdueCount,
      urgentCount,
      completedCount,
    };
  }, [processedTasks]);

  // Style badge đếm ngược theo độ khẩn cấp
  const getBadgeStyle = (remaining: TimeRemaining, completed: boolean) => {
    if (completed) {
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (remaining.isOverdue) {
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse';
    }
    if (remaining.isUrgent) {
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const getPriorityBadge = (priority: DeadlineTask['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
            Ưu tiên cao
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
            Ưu tiên vừa
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            Bình thường
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm text-left relative">
      {/* Toast Notification khi xóa thành công */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
              Lịch đếm ngược Deadline & Bài tập
            </h3>
            {stats.overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {stats.overdueCount} quá hạn!
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Quản lý hạn chót làm bài tập theo tuần, kỳ thi giữa kỳ và chứng chỉ
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Deadline</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        {/* Filter Tab buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sắp tới ({stats.uncompleted})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Đã xong ({stats.completedCount})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tất cả ({stats.total})
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">Lọc:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Mọi mức độ</option>
            <option value="high">🔴 Ưu tiên cao</option>
            <option value="medium">🟠 Ưu tiên vừa</option>
            <option value="low">🟢 Bình thường</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-5">
          <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {filterTab === 'upcoming'
              ? 'Tuyệt vời! Không có deadline nào cần gấp.'
              : 'Chưa có nhiệm vụ nào trong mục này.'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Bấm "Thêm Deadline" để đặt mục tiêu cho tuần học hoặc kỳ thi.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map(({ task, remaining }) => (
            <div
              key={task.id}
              onClick={() => handleToggle(task.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                task.completed
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-70'
                  : remaining.isOverdue
                  ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 hover:border-rose-400 shadow-xs'
                  : remaining.isUrgent
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-brand-400 hover:shadow-xs'
              }`}
            >
              {/* Checkbox Icon */}
              <div className="pt-0.5 shrink-0">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" />
                )}
              </div>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {/* Countdown Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getBadgeStyle(
                      remaining,
                      task.completed
                    )}`}
                  >
                    {task.completed ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Đã hoàn thành</span>
                      </>
                    ) : remaining.isOverdue ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>{remaining.label}</span>
                      </>
                    ) : remaining.isUrgent ? (
                      <>
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>{remaining.label}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{remaining.label}</span>
                      </>
                    )}
                  </span>

                  {/* Priority Tag */}
                  {getPriorityBadge(task.priority)}

                  {/* Subject Tag */}
                  {task.subjectName && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {task.subjectName}
                    </span>
                  )}

                  {/* Week Tag */}
                  {task.weekTitle && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                      {task.weekTitle}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4
                  className={`text-xs sm:text-sm font-bold leading-snug ${
                    task.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {task.title}
                </h4>

                {/* Note */}
                {task.note && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {task.note}
                  </p>
                )}

                {/* Due Date String */}
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                  {task.completedAt && (
                    <span>
                      • Xong ngày {new Date(task.completedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex items-center gap-1">
                <button
                  onClick={(e) => handleDelete(task.id, task.title, e)}
                  className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all"
                  title="Xóa deadline này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Deadline Modal */}
      <AddDeadlineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        treeData={treeData}
        onAdded={() => {
          refreshDeadlines();
          if (onActivityLogged) onActivityLogged();
        }}
      />
    </div>
  );
};
