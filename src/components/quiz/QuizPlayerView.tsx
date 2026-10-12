import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sparkles, BookOpen, Shuffle } from 'lucide-react';
import { QuizProgress, QuizSet, QuizOption } from '../../lib/quiz-types';
import { saveQuizProgress } from '../../lib/quiz-storage';
import { recordMistake } from '../../lib/mistakes-storage';

interface QuizPlayerViewProps {
  quiz: QuizSet;
  initialMode: 'all' | 'wrong';
  onFinish: (progress: QuizProgress) => void;
  onExit: () => void;
}

export const QuizPlayerView: React.FC<QuizPlayerViewProps> = ({
  quiz,
  initialMode,
  onFinish,
  onExit,
}) => {
  // Trạng thái bật/tắt xáo trộn đáp án ngẫu nhiên
  const [shuffleChoices, setShuffleChoices] = useState<boolean>(true);

  // Khởi tạo thứ tự câu hỏi (trộn ngẫu nhiên)
  const [progress, setProgress] = useState<QuizProgress>(() => {
    let order = quiz.questions.map((_, i) => i);
    // Shuffle questions
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    return {
      order,
      pos: 0,
      firstTry: {},
      wrong: {},
      mode: initialMode,
      done: false,
    };
  });

  // Bản đồ lưu trữ các phương án đã xáo trộn cho từng câu hỏi (cố định trong phiên)
  const [shuffledOptionsMap] = useState<Record<number, QuizOption[]>>(() => {
    const map: Record<number, QuizOption[]> = {};
    quiz.questions.forEach((q, idx) => {
      const arr = [...q.options];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      map[idx] = arr;
    });
    return map;
  });

  const [answered, setAnswered] = useState(false);
  const [wrongThisQ, setWrongThisQ] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'ok' | 'bad' } | null>(null);

  const currentQIndex = progress.order[progress.pos];
  const question = quiz.questions[currentQIndex];
  const total = progress.order.length;
  const progressPercent = Math.round((progress.pos / total) * 100);
  const wrongCount = Object.keys(progress.wrong).length;

  // Danh sách phương án hiển thị theo trạng thái xáo trộn
  const displayedOptions = useMemo<QuizOption[]>(() => {
    if (!question) return [];
    if (shuffleChoices && shuffledOptionsMap[currentQIndex]) {
      return shuffledOptionsMap[currentQIndex];
    }
    return question.options;
  }, [question, shuffleChoices, shuffledOptionsMap, currentQIndex]);

  const handleNext = useCallback(() => {
    if (progress.pos + 1 >= total) {
      const completedProgress: QuizProgress = {
        ...progress,
        done: true,
      };
      saveQuizProgress(quiz.id, completedProgress);
      onFinish(completedProgress);
    } else {
      const nextProgress: QuizProgress = {
        ...progress,
        pos: progress.pos + 1,
      };
      setProgress(nextProgress);
      saveQuizProgress(quiz.id, nextProgress);
      setAnswered(false);
      setWrongThisQ([]);
      setFeedback(null);
    }
  }, [progress, total, quiz.id, onFinish]);

  const handleChoose = useCallback((chosenOpt: QuizOption) => {
    if (answered || wrongThisQ.includes(chosenOpt.key)) return;

    if (chosenOpt.key === question.answer) {
      // Đúng!
      const isFirst = wrongThisQ.length === 0;
      const updatedFirstTry = { ...progress.firstTry };
      if (!(currentQIndex in updatedFirstTry)) {
        updatedFirstTry[currentQIndex] = isFirst;
      }

      setAnswered(true);
      setFeedback({
        text: wrongThisQ.length > 0 ? `Chính xác (sau ${wrongThisQ.length} lần thử)!` : 'Chính xác ngay lần đầu! ✨',
        type: 'ok',
      });

      const updatedProgress: QuizProgress = {
        ...progress,
        firstTry: updatedFirstTry,
      };
      setProgress(updatedProgress);
      saveQuizProgress(quiz.id, updatedProgress);
    } else {
      // Sai!
      const newWrongs = [...wrongThisQ, chosenOpt.key];
      setWrongThisQ(newWrongs);
      setFeedback({ text: 'Chưa đúng, hãy thử lại đáp án khác!', type: 'bad' });

      // Tự động ghi vào Sổ Tay Lỗi Sai
      const correctOpt = question.options.find((o) => o.key === question.answer);
      recordMistake({
        sourceType: 'quiz',
        sourceId: quiz.id,
        sourceName: quiz.name,
        question: question.stem,
        userChoice: `${chosenOpt.key}. ${chosenOpt.text}`,
        correctAnswer: correctOpt ? `${correctOpt.key}. ${correctOpt.text}` : question.answer,
        options: question.options.map((o) => `${o.key}. ${o.text}`),
        explanation: question.explain,
        category: quiz.name,
        reason: 'unknown',
      });

      const updatedWrong = {
        ...progress.wrong,
        [currentQIndex]: (progress.wrong[currentQIndex] || 0) + 1,
      };
      const updatedFirstTry = { ...progress.firstTry };
      if (!(currentQIndex in updatedFirstTry)) {
        updatedFirstTry[currentQIndex] = false;
      }

      const updatedProgress: QuizProgress = {
        ...progress,
        wrong: updatedWrong,
        firstTry: updatedFirstTry,
      };
      setProgress(updatedProgress);
      saveQuizProgress(quiz.id, updatedProgress);
    }
  }, [answered, wrongThisQ, question, currentQIndex, progress, quiz.id]);

  // Phím tắt bàn phím: 1-4 hoặc A-D chọn theo thứ tự hiển thị trên màn hình
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (answered && e.key === 'Enter') {
        e.preventDefault();
        handleNext();
        return;
      }

      const keyUpper = e.key.toUpperCase();
      let targetIdx = -1;
      if (['A', 'B', 'C', 'D'].includes(keyUpper)) {
        targetIdx = keyUpper.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        targetIdx = parseInt(e.key, 10) - 1;
      }

      if (targetIdx >= 0 && targetIdx < displayedOptions.length) {
        handleChoose(displayedOptions[targetIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, displayedOptions, handleChoose, handleNext]);

  if (!question) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 flex flex-col min-h-[85vh] text-left animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          onClick={onExit}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Thoát bài thi"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 mx-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <span className="truncate max-w-[200px] font-bold text-slate-700 dark:text-slate-200">{quiz.name}</span>
            <span>Câu {progress.pos + 1}/{total}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Nút Toggle đảo đáp án ngẫu nhiên */}
        <button
          onClick={() => setShuffleChoices((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
            shuffleChoices
              ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-300 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
          title={shuffleChoices ? 'Đang bật xáo trộn ngẫu nhiên đáp án (Bấm để tắt)' : 'Đang giữ nguyên thứ tự đáp án gốc (Bấm để bật)'}
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{shuffleChoices ? 'Đảo đáp án' : 'Gốc'}</span>
        </button>

        {wrongCount > 0 && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            Sai {wrongCount}
          </span>
        )}
      </div>

      {/* Main Question Card */}
      <div className="flex-1 flex flex-col justify-between p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden select-text">
        <div>
          {/* Chapter badge */}
          {question.chapter && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{question.chapter}</span>
            </div>
          )}

          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-semibold mb-1.5">
            Câu gốc số {question.n}
          </div>

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-5">
            {question.stem}
          </h3>

          {/* Options List */}
          <div className="space-y-2.5">
            {displayedOptions.map((opt, i) => {
              const displayLabel = String.fromCharCode(65 + i); // A, B, C, D
              const isWrong = wrongThisQ.includes(opt.key);
              const isRight = answered && opt.key === question.answer;

              return (
                <button
                  key={`${opt.key}-${i}`}
                  disabled={answered || isWrong}
                  onClick={() => handleChoose(opt)}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 active:scale-98 ${
                    isRight
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                      : isWrong
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-400 line-through opacity-70 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isRight
                        ? 'bg-emerald-600 text-white'
                        : isWrong
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {displayLabel}
                  </span>
                  <span className="text-xs sm:text-sm pt-0.5 leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {feedback && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
              <div
                className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${
                  feedback.type === 'ok' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {feedback.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.text}</span>
              </div>

              {answered && question.explain && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Lời giải thích:
                  </span>
                  <p className="whitespace-pre-line">{question.explain}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info & next button */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            Phím 1-4 hoặc A-D để chọn · Enter câu tiếp
          </span>

          <button
            onClick={handleNext}
            disabled={!answered}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 ${
              answered
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <span>{progress.pos + 1 === total ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
