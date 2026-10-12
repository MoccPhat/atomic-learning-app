import React from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  Code2,
  Globe,
  BookOpen,
  Award,
} from 'lucide-react';
import { Card, Category } from '../../lib/types';
import { deleteCardsByCategory, deleteAllCards } from '../../lib/storage';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onDeleted: (message: string) => void;
}

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  code: {
    label: 'Lập trình',
    icon: <Code2 className="w-4 h-4" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
  },
  english: {
    label: 'Ngoại ngữ',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
  },
  book: {
    label: 'Đọc sách',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  exam: {
    label: 'Ôn thi cử',
    icon: <Award className="w-4 h-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
  },
};

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  onClose,
  cards,
  onDeleted,
}) => {
  if (!isOpen) return null;

  const totalCards = cards.length;

  const handleDeleteSingleCategory = (category: Category) => {
    const config = CATEGORY_CONFIG[category];
    const count = deleteCardsByCategory(category);
    onClose();
    onDeleted(`Đã xóa toàn bộ ${count} thẻ thuộc danh mục "${config.label}" thành công!`);
  };

  const handleDeleteAll = () => {
    const count = deleteAllCards();
    onClose();
    onDeleted(`Đã xóa toàn bộ ${count} thẻ học tập trong hệ thống thành công!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Xóa thẻ theo Danh mục hoặc Xóa tất cả
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Làm sạch từng danh mục kiến thức hoặc dọn sạch toàn bộ thẻ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Lựa chọn 1: Chọn 1 danh mục cụ thể cần xóa */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Chọn 1 danh mục cần xóa
              </span>
              <span className="text-[11px] text-slate-400">
                Chỉ xóa các thẻ trong danh mục được chọn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['code', 'english', 'book', 'exam'] as Category[]).map((catKey) => {
                const config = CATEGORY_CONFIG[catKey];
                const count = cards.filter((c) => c.category === catKey).length;

                return (
                  <div
                    key={catKey}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      count > 0
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-rose-300 dark:hover:border-rose-900/60'
                        : 'border-slate-100 dark:border-slate-800/30 bg-slate-50/20 dark:bg-slate-900/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                        {config.icon}
                      </span>
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          {config.label}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {count} thẻ
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSingleCategory(catKey)}
                      disabled={count === 0}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        count > 0
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white active:scale-95 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                      title={count > 0 ? `Xóa toàn bộ ${count} thẻ của mục ${config.label}` : 'Mục này đang trống'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Đường phân cách */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase">Hoặc</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Lựa chọn 2: Xóa tất cả các thẻ */}
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500 text-white mt-0.5 shrink-0 shadow-sm shadow-rose-500/25">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    2. Xóa tất cả thẻ ({totalCards} thẻ)
                  </h4>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                    Xóa sạch toàn bộ tất cả thẻ học tập trong 4 danh mục để làm mới hệ thống từ đầu.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDeleteAll}
                disabled={totalCards === 0}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 shadow-md ${
                  totalCards > 0
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-rose-600/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa tất cả</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ⚡ Thao tác thực hiện tức thì, có thông báo xác nhận thành công
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
