import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Check,
} from 'lucide-react';
import { DeadlineTask } from '../../lib/deadline-types';
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

  return (
    <div className="w-full max-w-full overflow-hidden p-4 sm:p-5 rounded-xs bg-theme-surface border border-theme-border shadow-[2px_2px_0px_var(--theme-border-strong)] text-left relative font-sans">
      {/* Toast Notification khi xóa thành công */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 px-4 rounded-xs bg-theme-border-strong text-theme-surface text-xs font-mono shadow-2xl border border-theme-border flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-theme-success shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme-border mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-theme-text text-sm sm:text-base">
              Hạn chót & Kỳ thi
            </h3>
            {stats.overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-xs bg-theme-warning text-white text-[10px] font-mono">
                {stats.overdueCount} quá hạn!
              </span>
            )}
          </div>
          <p className="text-[11px] text-theme-muted mt-0.5">
            Lịch đếm ngược bài tập theo tuần & chứng chỉ
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-theme-accent hover:bg-theme-accent-hover text-white font-semibold text-xs border border-theme-border-strong shadow-[1px_1px_0px_var(--theme-border-strong)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm hạn chót</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        {/* Filter Tab buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-theme-subtle rounded-xs self-start sm:self-auto text-xs font-mono">
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-2.5 py-1 rounded-xs transition-all ${
              filterTab === 'upcoming'
                ? 'bg-theme-surface text-theme-text font-bold shadow-xs'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            Sắp tới ({stats.uncompleted})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-2.5 py-1 rounded-xs transition-all ${
              filterTab === 'completed'
                ? 'bg-theme-surface text-theme-text font-bold shadow-xs'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            Đã xong ({stats.completedCount})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-2.5 py-1 rounded-xs transition-all ${
              filterTab === 'all'
                ? 'bg-theme-surface text-theme-text font-bold shadow-xs'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            Tất cả ({stats.total})
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[11px] text-theme-muted">Lọc:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2 py-0.5 rounded-xs border border-theme-border bg-theme-surface text-xs text-theme-text focus:outline-none"
          >
            <option value="all">Mọi mức độ</option>
            <option value="high">Ưu tiên cao</option>
            <option value="medium">Ưu tiên vừa</option>
            <option value="low">Bình thường</option>
          </select>
        </div>
      </div>

      {/* Task List: Vertical tear-off paper calendar timeline */}
      {filteredTasks.length === 0 ? (
        <div className="py-8 text-center rounded-xs border border-dashed border-theme-border bg-theme-surface/50 p-4">
          <CheckCircle2 className="w-8 h-8 mx-auto text-theme-muted mb-1.5" />
          <p className="text-xs font-serif font-bold text-theme-text">
            {filterTab === 'upcoming'
              ? 'Không có deadline nào cần gấp.'
              : 'Chưa có nhiệm vụ nào trong mục này.'}
          </p>
          <p className="text-[11px] text-theme-muted mt-0.5">
            Bấm "Thêm hạn chót" để đặt lịch ôn tập.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(({ task, remaining }) => {
            const dateObj = new Date(task.dueDate);
            const monthStr = `Thg ${dateObj.getMonth() + 1}`;
            const dayStr = dateObj.getDate();

            return (
              <div
                key={task.id}
                onClick={() => handleToggle(task.id)}
                className={`p-2.5 rounded-xs border transition-all cursor-pointer flex items-center gap-3 group ${
                  task.completed
                    ? 'bg-theme-subtle/40 border-theme-border/60 opacity-60'
                    : remaining.isOverdue
                    ? 'bg-theme-surface border-theme-warning hover:border-theme-border-strong'
                    : remaining.isUrgent
                    ? 'bg-theme-surface border-theme-warning hover:border-theme-border-strong'
                    : 'bg-theme-surface border-theme-border hover:border-theme-border-strong'
                }`}
              >
                {/* Physical Tear-off Paper Calendar Block */}
                <div className="shrink-0 w-11 text-center border border-theme-border rounded-xs bg-theme-surface shadow-[1px_1px_0px_rgba(0,0,0,0.06)] overflow-hidden">
                  <div className={`text-[9px] font-mono uppercase tracking-wider py-0.5 text-white ${
                    task.completed
                      ? 'bg-theme-muted'
                      : remaining.isOverdue
                      ? 'bg-theme-warning'
                      : remaining.isUrgent
                      ? 'bg-theme-warning'
                      : 'bg-theme-border-strong'
                  }`}>
                    {monthStr}
                  </div>
                  <div className="text-base font-serif font-bold text-theme-text py-0.5 leading-none">
                    {dayStr}
                  </div>
                </div>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {/* Remaining countdown */}
                    <span className="font-mono text-[10px] text-theme-warning font-semibold">
                      {task.completed ? 'Đã xong' : remaining.label}
                    </span>

                    {task.subjectName && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-theme-subtle text-theme-muted font-mono">
                        {task.subjectName}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4
                    className={`text-xs font-serif font-semibold leading-snug truncate ${
                      task.completed
                        ? 'line-through text-theme-muted'
                        : 'text-theme-text'
                    }`}
                  >
                    {task.title}
                  </h4>

                  {task.note && (
                    <p className="text-[11px] text-theme-muted truncate">
                      {task.note}
                    </p>
                  )}
                </div>

                {/* Action Buttons: Checkbox & Delete */}
                <div className="shrink-0 flex items-center gap-1.5">
                  <div className="pt-0.5">
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-theme-success" />
                    ) : (
                      <Circle className="w-4 h-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDelete(task.id, task.title, e)}
                    className="p-1 rounded-xs text-theme-muted hover:text-theme-warning opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all"
                    title="Xóa deadline này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
