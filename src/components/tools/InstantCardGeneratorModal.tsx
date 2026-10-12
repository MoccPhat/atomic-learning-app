import React, { useState, useEffect } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  Layers,
  GraduationCap,
  Check,
  CheckCircle2,
  Save,
  Cpu,
} from 'lucide-react';
import {
  autoGenerateCardsAndQuizzes,
  saveExtractedCardsAndQuizzes,
  ExtractionResult,
} from '../../lib/auto-card-generator';
import { Category } from '../../lib/types';

interface InstantCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  sourceDocTitle?: string;
  onSuccess?: (cardsSaved: number, quizzesSaved: number) => void;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'code', label: 'Lập trình' },
  { key: 'english', label: 'Ngoại ngữ' },
  { key: 'book', label: 'Đọc sách' },
  { key: 'exam', label: 'Ôn thi chứng chỉ' },
];

export const InstantCardGeneratorModal: React.FC<InstantCardGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  sourceDocTitle,
  onSuccess,
}) => {
  const [inputText, setInputText] = useState<string>(initialText);
  const [targetCategory, setTargetCategory] = useState<Category>('code');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await autoGenerateCardsAndQuizzes(inputText);
      setResult(res);
    } catch (e) {
      console.error('Lỗi trích xuất thẻ:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCard = (index: number) => {
    if (!result) return;
    const newCards = [...result.flashcards];
    newCards[index].selected = !newCards[index].selected;
    setResult({ ...result, flashcards: newCards });
  };

  const handleToggleQuiz = (index: number) => {
    if (!result) return;
    const newQuizzes = [...result.quizzes];
    newQuizzes[index].selected = !newQuizzes[index].selected;
    setResult({ ...result, quizzes: newQuizzes });
  };

  const handleSave = () => {
    if (!result) return;
    const res = saveExtractedCardsAndQuizzes(
      result,
      targetCategory,
      sourceDocTitle ? `Đề trắc nghiệm: ${sourceDocTitle}` : undefined
    );

    if (onSuccess) {
      onSuccess(res.cardsSaved, res.quizzesSaved);
    }

    setSaveSuccessMsg(`Đã lưu thành công ${res.cardsSaved} thẻ Flashcard và ${res.quizzesSaved} câu Quiz! 🎉`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
      onClose();
    }, 2000);
  };

  const selectedCardsCount = result?.flashcards.filter((f) => f.selected).length || 0;
  const selectedQuizzesCount = result?.quizzes.filter((q) => q.selected).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>1-Click Rút Trích Thẻ Học & Quiz</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  AI & Heuristic
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động bóc tách khái niệm, công thức và tạo câu hỏi trắc nghiệm từ tài liệu chỉ với 1 chạm.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo thành công */}
        {saveSuccessMsg && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Ô nhập văn bản nếu chưa có kết quả */}
          {!result && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Dán đoạn văn bản / ghi chú cần bóc tách (hoặc tài liệu học tập):
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Dán bài giảng, định nghĩa, nội dung ôn thi hoặc công thức vào đây..."
                  rows={8}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Lưu vào môn học:
                  </span>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value as Category)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isProcessing || !inputText.trim()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg shadow-brand-500/20 transition-all ${
                    isProcessing || !inputText.trim()
                      ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-700 active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang bóc tách ý chính...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Rút Trích Thẻ & Quiz Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Hiển thị kết quả đã trích xuất */}
          {result && (
            <div className="space-y-6">
              {/* Badge thông tin phương thức trích xuất */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center gap-2">
                  {result.engineUsed === 'gemini' ? (
                    <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Đã trích xuất bằng Gemini AI</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400">
                      <Cpu className="w-4 h-4" />
                      <span>Đã trích xuất bằng Bộ Phân Tích Heuristic Offline</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold"
                >
                  Nhập văn bản khác
                </button>
              </div>

              {/* Phần 1: Flashcards trích xuất */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-500" />
                    <span>Thẻ Flashcards Gợi Ý ({selectedCardsCount}/{result.flashcards.length})</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.flashcards.map((f, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleCard(idx)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        f.selected
                          ? 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-500/40 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-extrabold text-xs text-brand-600 dark:text-brand-400">
                          {f.title}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                            f.selected ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {f.selected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {f.front}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">
                        {f.back}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phần 2: Câu hỏi Quiz trích xuất */}
              {result.quizzes.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-purple-500" />
                      <span>Câu Hỏi Trắc Nghiệm ({selectedQuizzesCount}/{result.quizzes.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {result.quizzes.map((q, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleQuiz(idx)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          q.selected
                            ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-500/40 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            Câu {idx + 1}: {q.question}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-lg shrink-0 flex items-center justify-center transition-colors ${
                              q.selected ? 'bg-purple-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {q.selected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-2 text-[11px]">
                          {q.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-xl border ${
                                opt.key === q.answer
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {opt.key}. {opt.text}
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer lưu kết quả */}
        {result && (
          <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Đã chọn: <span className="font-bold text-brand-600">{selectedCardsCount}</span> thẻ Flashcard và{' '}
              <span className="font-bold text-purple-600">{selectedQuizzesCount}</span> câu Quiz.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={selectedCardsCount === 0 && selectedQuizzesCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Vào Hệ Thống Ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
