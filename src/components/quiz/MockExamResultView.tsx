import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MockExamResult } from '../../lib/mock-exam-service';
import { WeaknessRadarChart } from './WeaknessRadarChart';
import { addCard } from '../../lib/storage';

interface MockExamResultViewProps {
  result: MockExamResult;
  onRetake: () => void;
  onExit: () => void;
}

export const MockExamResultView: React.FC<MockExamResultViewProps> = ({
  result,
  onRetake,
  onExit,
}) => {
  const [expandedWrongIndex, setExpandedWrongIndex] = useState<number | null>(null);
  const [createdCardsCount, setCreatedCardsCount] = useState<number | null>(null);

  // Kích hoạt pháo hoa chúc mừng nếu điểm cao >= 8.0
  React.useEffect(() => {
    if (result.scoreOutOf10 >= 8.0) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch (_) {}
    }
  }, [result.scoreOutOf10]);

  // Đổi kết quả sai thành Thẻ Flashcard ôn tập Spaced Repetition
  const handleCreateFlashcardsFromWrongs = () => {
    if (result.wrongQuestions.length === 0) return;

    let added = 0;
    result.wrongQuestions.forEach((wq) => {
      addCard({
        title: `Ôn thi: ${wq.questionText.slice(0, 35)}...`,
        front: wq.questionText,
        back: `Đáp án đúng: ${wq.correctText}\n\n${wq.explanation ? 'Giải thích: ' + wq.explanation : ''}`,
        category: 'exam',
        tags: ['mock-exam-wrong', 'review-needed'],
      });
      added += 1;
    });

    setCreatedCardsCount(added);
  };

  const getRankBadge = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất sắc', color: 'bg-emerald-500 text-white' };
    if (score >= 8.0) return { label: 'Giỏi', color: 'bg-indigo-500 text-white' };
    if (score >= 6.5) return { label: 'Khá', color: 'bg-blue-500 text-white' };
    if (score >= 5.0) return { label: 'Trung bình', color: 'bg-amber-500 text-white' };
    return { label: 'Cần nỗ lực hơn', color: 'bg-rose-500 text-white' };
  };

  const rank = getRankBadge(result.scoreOutOf10);
  const avgSecondsPerQ = Math.round(result.timeSpentSeconds / Math.max(1, result.totalQuestions));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fade-in space-y-6">
      {/* HEADER TỔNG KẾT BÀI THI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${rank.color}`}>
              {rank.label}
            </span>
            <span className="text-xs text-slate-400 font-medium">Hoàn thành lúc {new Date(result.submittedAt).toLocaleTimeString('vi-VN')}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {result.quizTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Đúng {result.correctCount}/{result.totalQuestions} câu hỏi • Tỷ lệ chính xác {result.percentage}%
          </p>
        </div>

        {/* ĐIỂM SỐ THANG 10 LỚN */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-brand-50 dark:bg-brand-950/70 border-2 border-brand-500/30 flex flex-col items-center justify-center shadow-lg shadow-brand-500/10">
            <span className="text-3xl font-black text-brand-600 dark:text-brand-400 leading-none">
              {result.scoreOutOf10}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Thang điểm 10
            </span>
          </div>
        </div>
      </div>

      {/* 3 THẺ THỐNG KÊ CHI TIẾT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-lg font-black text-slate-800 dark:text-slate-100">{result.correctCount} câu</span>
            <span className="text-[11px] text-slate-400 font-semibold">Trả lời đúng</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-lg font-black text-slate-800 dark:text-slate-100">{result.wrongQuestions.length} câu</span>
            <span className="text-[11px] text-slate-400 font-semibold">Trả lời sai / bỏ trống</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-lg font-black text-slate-800 dark:text-slate-100">{Math.round(result.timeSpentSeconds / 60)} phút</span>
            <span className="text-[11px] text-slate-400 font-semibold">Tốc độ TB: {avgSecondsPerQ}s / câu</span>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ RADAR PHÂN TÍCH ĐIỂM YẾU */}
      <WeaknessRadarChart
        dimensions={result.dimensions}
        weakestDimension={result.weakestDimension}
      />

      {/* DANH SÁCH CHI TIẾT CÂU TRẢ LỜI SAI & NÚT TẠO FLASHCARD */}
      {result.wrongQuestions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="text-rose-500">✕</span> Danh sách câu trả lời chưa chính xác ({result.wrongQuestions.length})
              </h3>
              <p className="text-xs text-slate-400">Xem lại phân tích chi tiết để khắc phục lỗ hổng tư duy.</p>
            </div>

            {/* NÚT TẠO FLASHCARD TỪ CÂU SAI */}
            {createdCardsCount !== null ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60">
                <CheckCircle2 className="w-4 h-4" /> Đã tạo {createdCardsCount} thẻ Flashcards!
              </span>
            ) : (
              <button
                onClick={handleCreateFlashcardsFromWrongs}
                className="px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/80 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tạo Flashcards từ câu sai</span>
              </button>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {result.wrongQuestions.map((wq, i) => {
              const isExpanded = expandedWrongIndex === i;
              return (
                <div
                  key={i}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedWrongIndex(isExpanded ? null : i)}
                    className="w-full text-left p-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      <b className="text-rose-500 mr-2">Câu {i + 1}:</b>
                      {wq.questionText}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2.5 animate-fade-in">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {wq.questionText}
                      </p>

                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
                        <span className="font-bold">Lựa chọn của bạn:</span>
                        <span>{wq.chosenKey ? `${wq.chosenKey}. ${wq.chosenText}` : '(Không chọn đáp án)'}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
                        <span className="font-bold">Đáp án chính xác:</span>
                        <span>{wq.correctKey}. {wq.correctText}</span>
                      </div>

                      {wq.explanation && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <span className="font-bold block text-slate-700 dark:text-slate-300 mb-0.5">Giải thích:</span>
                          {wq.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về danh sách đề</span>
        </button>

        <button
          onClick={onRetake}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Thi lại đề này</span>
        </button>
      </div>
    </div>
  );
};
