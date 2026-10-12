import React, { useState } from 'react';
import { X, Plus, Code, BookOpen, Globe, Award, Sparkles } from 'lucide-react';
import { Category, Card } from '../lib/types';
import { addCard } from '../lib/storage';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardAdded: (newCard: Card) => void;
  defaultCategory?: Category;
}

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'code', label: 'Lập trình', icon: <Code className="w-4 h-4" />, color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  { key: 'english', label: 'Ngoại ngữ', icon: <Globe className="w-4 h-4" />, color: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  { key: 'book', label: 'Đọc sách', icon: <BookOpen className="w-4 h-4" />, color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { key: 'exam', label: 'Ôn thi cử', icon: <Award className="w-4 h-4" />, color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
];

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onCardAdded,
  defaultCategory = 'code',
}) => {
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [title, setTitle] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hasCode, setHasCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !front.trim() || !back.trim()) {
      setError('Vui lòng điền tiêu đề, mặt trước và mặt sau của thẻ');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newCard = addCard({
      category,
      title: title.trim(),
      front: front.trim(),
      back: back.trim(),
      codeSnippet: hasCode && codeSnippet.trim() ? codeSnippet.trim() : undefined,
      codeLanguage: hasCode ? codeLanguage : undefined,
      tags: tags.length > 0 ? tags : [category],
    });

    onCardAdded(newCard);
    // Reset form
    setTitle('');
    setFront('');
    setBack('');
    setCodeSnippet('');
    setHasCode(false);
    setTagsInput('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden transition-all transform"
        onKeyDown={handleKeyDown}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Thu thập kiến thức tức thì</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tạo thẻ nguyên tử mới (Ctrl + Enter để lưu)</p>
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-left">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Chọn lĩnh vực */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lĩnh vực học tập</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                    category === cat.key
                      ? `${cat.color} font-bold shadow-xs ring-2 ring-brand-500/30 border-transparent`
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tiêu đề ngắn gọn */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tiêu đề ngắn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Thuật toán QuickSort, Từ vựng Resilience..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              autoFocus
            />
          </div>

          {/* Mặt trước: Câu hỏi / Khái niệm */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Mặt trước (Câu hỏi / Khái niệm / Vấn đề) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Nội dung sẽ hiển thị đầu tiên để kích hoạt trí nhớ chủ động..."
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none"
            />
          </div>

          {/* Mặt sau: Lời giải thích / Đáp án */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Mặt sau (Giải thích / Định nghĩa / Đáp án) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Lời giải thích ngắn gọn, súc tích (Atomic unit)..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none"
            />
          </div>

          {/* Tùy chọn đoạn mã code */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setHasCode(!hasCode)}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              <Code className="w-3.5 h-3.5" />
              {hasCode ? '✕ Ẩn đoạn mã code' : '+ Đính kèm đoạn mã code (Snippet)'}
            </button>

            {hasCode && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Ngôn ngữ lập trình:</span>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none"
                  >
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="sql">SQL</option>
                    <option value="bash">Bash / Shell</option>
                    <option value="golang">Go</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  placeholder="// Nhập đoạn code ví dụ minh họa tại đây..."
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Thẻ phân loại */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Thẻ (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              placeholder="VD: react, hook, interview..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-md shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Lưu thẻ kiến thức
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
