import React, { useState } from 'react';
import { X, Calendar, Clock, Plus } from 'lucide-react';
import { DeadlinePriority, DeadlineTask } from '../../lib/deadline-types';
import { TreeData } from '../../lib/tree-types';
import { addDeadline } from '../../lib/deadline-storage';

interface AddDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeData?: TreeData;
  initialSubjectId?: string;
  initialWeekId?: string;
  onAdded: (newTask: DeadlineTask) => void;
}

export const AddDeadlineModal: React.FC<AddDeadlineModalProps> = ({
  isOpen,
  onClose,
  treeData,
  initialSubjectId,
  initialWeekId,
  onAdded,
}) => {
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
  const [selectedWeekId, setSelectedWeekId] = useState(initialWeekId || '');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [priority, setPriority] = useState<DeadlinePriority>('high');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  // Lấy danh sách tất cả môn học từ treeData
  const allSubjects = treeData
    ? treeData.groups.flatMap((g) => g.subjects)
    : [];

  const currentSubject = allSubjects.find((s) => s.id === selectedSubjectId);
  const availableWeeks = currentSubject?.weeks || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const subjectObj = allSubjects.find((s) => s.id === selectedSubjectId);
    const weekObj = availableWeeks.find((w) => w.id === selectedWeekId);

    const newTask = addDeadline({
      title: title.trim(),
      subjectId: selectedSubjectId || undefined,
      subjectName: subjectObj?.name,
      weekId: selectedWeekId || undefined,
      weekTitle: weekObj?.title,
      dueDate,
      priority,
      note: note.trim() || undefined,
    });

    onAdded(newTask);
    setTitle('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Thêm Deadline & Ngày Thi
              </h3>
              <p className="text-[11px] text-slate-400">
                Nhắc nhở đếm ngược hạn chót bài tập và kỳ thi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nội dung nhiệm vụ / Kỳ thi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Nộp bài tập lớn Xử lý ảnh, Thi giữa kỳ Toán..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          {/* Ngày đến hạn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hạn chót (Deadline Date) *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          {/* Mức độ ưu tiên */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mức độ ưu tiên
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  priority === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🔴 Cao
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  priority === 'medium'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🟠 Trung bình
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  priority === 'low'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🟢 Thấp
              </button>
            </div>
          </div>

          {/* Liên kết Môn học (Tùy chọn) */}
          {allSubjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Môn học liên quan
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedWeekId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  <option value="">(Không chọn môn)</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {availableWeeks.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tuần học
                  </label>
                  <select
                    value={selectedWeekId}
                    onChange={(e) => setSelectedWeekId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  >
                    <option value="">(Không chọn tuần)</option>
                    {availableWeeks.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Nộp qua Google Classroom trước 23h59"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !dueDate}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 active:scale-95 rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Deadline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
