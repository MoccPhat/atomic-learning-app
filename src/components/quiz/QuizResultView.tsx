import React, { useEffect } from 'react';
import { Award, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizProgress, QuizSet } from '../../lib/quiz-types';

interface QuizResultViewProps {
  quiz: QuizSet;
  progress: QuizProgress;
  onRedoWrong: () => void;
  onRedoAll: () => void;
  onExit: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  quiz,
  progress,
  onRedoWrong,
  onRedoAll,
  onExit,
}) => {
  const total = progress.order.length;
  const firstTryCount = progress.order.filter((idx) => progress.firstTry[idx] === true).length;
  const wrongCount = Object.keys(progress.wrong).length;
  const percent = Math.round((firstTryCount / total) * 100);

  useEffect(() => {
    if (percent >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.log('Confetti error:', e);
      }
    }
  }, [percent]);

  return (
    <div className="max-w-md mx-auto py-10 px-4 text-center animate-fade-in">
      {/* Icon Badge */}
      <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/20">
        <Award className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Hoàn thành bài thi!</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium truncate">{quiz.name}</p>

      {/* Score Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md mb-6 space-y-4">
        <div>
          <span className="block text-4xl font-black text-brand-600 dark:text-brand-400 tracking-tight">
            {percent}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mt-1">
            Đúng {firstTryCount} / {total} câu ngay lần đầu
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <span className="block text-lg font-black text-slate-800 dark:text-slate-100">{firstTryCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Đúng tuyệt đối</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900">
            <span className="block text-lg font-black text-rose-600 dark:text-rose-400">{wrongCount}</span>
            <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">Câu cần ôn lại</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        {wrongCount > 0 && (
          <button
            onClick={onRedoWrong}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Chỉ luyện lại {wrongCount} câu đã sai</span>
          </button>
        )}

        <button
          onClick={onRedoAll}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Làm lại từ đầu (Toàn bộ {total} câu)</span>
        </button>

        <button
          onClick={onExit}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trở về danh sách bộ đề</span>
        </button>
      </div>
    </div>
  );
};
