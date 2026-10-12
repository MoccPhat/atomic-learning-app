import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Swords,
  Filter,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { MistakeItem, MistakeReason, MISTAKE_REASONS } from '../../lib/mistakes-types';
import {
  getMistakes,
  updateMistakeReason,
  markMistakeMastered,
  deleteMistake,
  clearAllMistakes,
} from '../../lib/mistakes-storage';

interface MistakeNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRevengeQuiz?: (mistakes: MistakeItem[]) => void;
}

export const MistakeNotebookModal: React.FC<MistakeNotebookModalProps> = ({
  isOpen,
  onClose,
  onStartRevengeQuiz,
}) => {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered'>('unmastered');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [revengeSuccessMsg, setRevengeSuccessMsg] = useState<string | null>(null);

  // Load danh sách lỗi
  const reloadData = () => {
    setMistakes(getMistakes());
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
    }
  }, [isOpen]);

  // Lắng nghe cập nhật từ storage
  useEffect(() => {
    const handleUpdate = () => {
      reloadData();
    };
    window.addEventListener('mistakes-updated', handleUpdate);
    return () => {
      window.removeEventListener('mistakes-updated', handleUpdate);
    };
  }, []);

  // Danh sách danh mục
  const categories = useMemo(() => {
    const set = new Set<string>();
    mistakes.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [mistakes]);

  // Lọc dữ liệu
  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      if (filterStatus === 'unmastered' && m.mastered) return false;
      if (filterStatus === 'mastered' && !m.mastered) return false;
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      return true;
    });
  }, [mistakes, filterStatus, selectedCategory]);

  // Thống kê
  const totalCount = mistakes.length;
  const unmasteredCount = mistakes.filter((m) => !m.mastered).length;
  const masteredCount = mistakes.filter((m) => m.mastered).length;
  const masteryRate = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  // Cập nhật lý do làm sai
  const handleReasonChange = (id: string, reason: MistakeReason) => {
    updateMistakeReason(id, reason);
    reloadData();
  };

  // Lưu ghi chú kinh nghiệm
  const handleSaveNote = (id: string) => {
    updateMistakeReason(id, mistakes.find((m) => m.id === id)?.reason || 'unknown', noteDraft);
    setEditingNoteId(null);
    setNoteDraft('');
    reloadData();
  };

  // Đánh dấu đã làm chủ thủ công
  const handleToggleMastered = (id: string) => {
    const res = markMistakeMastered(id);
    if (res.success) {
      setRevengeSuccessMsg('Đã đánh dấu làm chủ câu hỏi và tặng 1 Hạt dinh dưỡng cho Pet! 🌰✨');
      setTimeout(() => setRevengeSuccessMsg(null), 3500);
      reloadData();
    }
  };

  // Xóa câu
  const handleDelete = (id: string) => {
    deleteMistake(id);
    reloadData();
  };

  // Bắt đầu sát hạch phục thù
  const handleStartRevenge = () => {
    const toTest = mistakes.filter((m) => !m.mastered);
    if (toTest.length === 0) return;
    if (onStartRevengeQuiz) {
      onStartRevengeQuiz(toTest);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* ========================================================= */}
        {/* 1. HEADER MODAL SỔ TAY LỖI SAI */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Sổ Tay Lỗi Sai Thông Minh
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {unmasteredCount} câu cần phục thù
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gom nhặt mọi sai sót, phân tích nguyên nhân và luyện tập đến khi thuần thục.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Sát Hạch Phục Thù */}
            {unmasteredCount > 0 && (
              <button
                type="button"
                onClick={handleStartRevenge}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                title="Tạo đề thi giải lại toàn bộ các câu bạn đã từng làm sai"
              >
                <Swords className="w-4 h-4" />
                <span>Sát Hạch Phục Thù ({unmasteredCount} câu)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo thưởng phục thù */}
        {revengeSuccessMsg && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{revengeSuccessMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. THANH THỐNG KÊ & BỘ LỌC */}
        {/* ========================================================= */}
        <div className="p-4 px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tabs trạng thái */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('unmastered')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'unmastered'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Cần khắc phục ({unmasteredCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('mastered')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'mastered'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Đã làm chủ ({masteredCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất cả ({totalCount})
            </button>
          </div>

          {/* Bộ lọc danh mục & Thống kê % làm chủ */}
          <div className="flex items-center gap-3">
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="all">Tất cả môn học</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-medium">Tỷ lệ làm chủ:</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                {masteryRate}%
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. DANH SÁCH CÂU HỎI LỖI SAI */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredMistakes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {filterStatus === 'unmastered'
                  ? 'Tuyệt vời! Hiện không còn câu hỏi nào cần phục thù.'
                  : 'Chưa có câu hỏi nào trong danh sách này.'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Khi bạn làm sai bất kỳ câu hỏi nào trong Quiz hoặc đánh giá quên thẻ Flashcard, hệ thống sẽ tự động lưu vào đây để bạn ôn luyện.
              </p>
            </div>
          ) : (
            filteredMistakes.map((item, index) => {
              const reasonConfig = MISTAKE_REASONS[item.reason || 'unknown'];
              const isEditingNote = editingNoteId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    item.mastered
                      ? 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Header thẻ lỗi: Nguồn + Lần sai + Trạng thái */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{index + 1}
                      </span>
                      {item.category && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          {item.category}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        (Sai {item.failCount} lần)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.mastered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã làm chủ</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleMastered(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl transition-all"
                          title="Đánh dấu bạn đã hiểu rõ và làm chủ câu này"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã khắc phục</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        title="Xóa câu hỏi khỏi sổ lỗi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 leading-relaxed">
                    {item.question}
                  </div>

                  {/* Đáp án đã chọn (Sai) vs Đáp án Đúng */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 text-xs">
                    {item.userChoice && (
                      <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                        <span className="font-bold text-rose-500 block mb-1">
                          Lựa chọn sai của bạn:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.userChoice}
                        </span>
                      </div>
                    )}
                    <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                        Đáp án chính xác:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">
                        {item.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Giải thích nếu có */}
                  {item.explanation && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <span className="font-bold text-slate-500 block mb-0.5">💡 Giải thích:</span>
                      {item.explanation}
                    </div>
                  )}

                  {/* Footer mục lỗi: Chọn nguyên nhân & Ghi chú kinh nghiệm */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* Bộ chọn lý do làm sai */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px] font-bold">Nguyên nhân sai:</span>
                      <select
                        value={item.reason}
                        onChange={(e) => handleReasonChange(item.id, e.target.value as MistakeReason)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border outline-none ${reasonConfig.color}`}
                      >
                        {(Object.keys(MISTAKE_REASONS) as MistakeReason[]).map((r) => (
                          <option key={r} value={r}>
                            {MISTAKE_REASONS[r].emoji} {MISTAKE_REASONS[r].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ghi chú cá nhân */}
                    <div className="flex-1 min-w-[200px] flex items-center justify-end gap-2">
                      {isEditingNote ? (
                        <div className="flex items-center gap-1.5 w-full max-w-sm">
                          <input
                            type="text"
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Ghi chú kinh nghiệm rút ra..."
                            className="flex-1 px-2.5 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveNote(item.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded-xl bg-brand-600 text-white"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(item.id);
                            setNoteDraft(item.userNote || '');
                          }}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.userNote ? `Lưu ý: "${item.userNote}"` : '+ Thêm ghi chú kinh nghiệm'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer nút xóa toàn bộ */}
        {mistakes.length > 0 && (
          <div className="p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Mẹo: Các câu hỏi đã đánh dấu làm chủ vẫn được giữ lại để bạn tra cứu lịch sử tiến bộ.
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa sạch toàn bộ Sổ lỗi sai không?')) {
                  clearAllMistakes();
                  reloadData();
                }
              }}
              className="text-slate-400 hover:text-rose-500 font-bold transition-colors"
            >
              Dọn sạch sổ lỗi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
