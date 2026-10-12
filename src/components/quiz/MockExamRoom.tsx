import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { QuizSet } from '../../lib/quiz-types';
import {
  ExamQuestionState,
  prepareExamQuestions,
  gradeMockExam,
  MockExamResult,
} from '../../lib/mock-exam-service';

interface MockExamRoomProps {
  quiz: QuizSet;
  durationMinutes: number;
  onFinish: (result: MockExamResult) => void;
  onExit: () => void;
}

export const MockExamRoom: React.FC<MockExamRoomProps> = ({
  quiz,
  durationMinutes,
  onFinish,
  onExit,
}) => {
  const [questions, setQuestions] = useState<ExamQuestionState[]>(() =>
    prepareExamQuestions(quiz, true, true)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const durationSeconds = durationMinutes * 60;
  const timeSpentSeconds = durationSeconds - secondsRemaining;

  const currentQ = questions[currentIndex];
  const total = questions.length;

  const answeredCount = questions.filter((q) => q.chosenKey !== undefined).length;
  const flaggedCount = questions.filter((q) => q.flagged).length;

  // Thực hiện nộp bài thi
  const handleSubmitExam = useCallback(() => {
    const result = gradeMockExam(quiz, questions, durationSeconds, timeSpentSeconds);
    onFinish(result);
  }, [quiz, questions, durationSeconds, timeSpentSeconds, onFinish]);

  // Bộ đếm lùi thời gian thi
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmitExam]);

  // Hỗ trợ phím tắt chọn đáp án (A, B, C, D hoặc 1, 2, 3, 4) và mũi tên
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showConfirmModal || showExitConfirm) return;

      if (e.key === 'ArrowRight' && currentIndex + 1 < total) {
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFlagCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, total, showConfirmModal, showExitConfirm]);

  const handleSelectChoice = (key: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === currentIndex ? { ...q, chosenKey: key } : q))
    );
  };

  const toggleFlagCurrent = () => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === currentIndex ? { ...q, flagged: !q.flagged } : q))
    );
  };

  // Định dạng thời gian mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = secondsRemaining <= 180; // Dưới 3 phút

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-[90vh]">
      {/* HEADER PHÒNG THI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Thoát phòng thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                Mock Exam
              </span>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                {quiz.name}
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Đã làm: <b className="text-slate-700 dark:text-slate-200">{answeredCount}/{total}</b> câu
            </span>
          </div>
        </div>

        {/* ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN THI */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl font-mono font-bold text-sm shadow-sm transition-all ${
              isTimeCritical
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30 ring-2 ring-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-white' : 'text-brand-600 dark:text-brand-400'}`} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* NỘI DUNG CÂU HỎI CHÍNH (8 CỘT) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div>
            {/* Thanh tiêu đề câu hỏi & Nút Đánh dấu phân vân */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Câu hỏi {currentIndex + 1} / {total}
              </span>

              <button
                onClick={toggleFlagCurrent}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  currentQ.flagged
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Đánh dấu câu hỏi để xem lại (Phím F)"
              >
                <Flag className={`w-3.5 h-3.5 ${currentQ.flagged ? 'fill-current' : ''}`} />
                <span>{currentQ.flagged ? 'Đã ghim xem lại' : 'Ghim câu hỏi'}</span>
              </button>
            </div>

            {/* Văn bản câu hỏi */}
            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-6">
              {currentQ.question.stem}
            </p>

            {/* Danh sách 4 lựa chọn (Ẩn kết quả đúng sai - chỉ chọn) */}
            <div className="space-y-3">
              {currentQ.shuffledChoices.map((choice, i) => {
                const label = String.fromCharCode(65 + i); // A, B, C, D
                const isSelected = currentQ.chosenKey === choice.key;

                return (
                  <button
                    key={choice.key}
                    onClick={() => handleSelectChoice(choice.key)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 active:scale-99 ${
                      isSelected
                        ? 'bg-brand-50/80 dark:bg-brand-950/60 border-brand-500 dark:border-brand-500 shadow-sm shadow-brand-500/10'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-sm ${
                        isSelected
                          ? 'font-bold text-brand-950 dark:text-brand-100'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {choice.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* THANH ĐIỀU HƯỚNG CÂU HỎI TRƯỚC / SAU */}
          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <span className="text-xs font-semibold text-slate-400">
              {currentIndex + 1} / {total}
            </span>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
              disabled={currentIndex === total - 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs disabled:opacity-40 disabled:pointer-events-none shadow-sm"
            >
              <span>Câu sau</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LƯỚI ĐIỀU HƯỚNG CÂU HỎI (QUESTION GRID 4 CỘT) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bảng Câu Hỏi
            </h4>
            {flaggedCount > 0 && (
              <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                <Flag className="w-3 h-3 fill-current" /> {flaggedCount} câu cần xem lại
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = q.chosenKey !== undefined;
              const isFlagged = q.flagged;

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl font-mono text-xs font-bold transition-all relative flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-brand-500 bg-brand-600 text-white shadow-md'
                      : isFlagged
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-400'
                      : isAnswered
                      ? 'bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                  title={`Câu ${idx + 1}${isAnswered ? ' (Đã chọn)' : ' (Chưa làm)'}${isFlagged ? ' - Cần xem lại' : ''}`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-brand-100 dark:bg-brand-950 border border-brand-300" />
              <span>Đã làm ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-950 border border-amber-400" />
              <span>Ghim xem lại ({flaggedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300" />
              <span>Chưa làm ({total - answeredCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN NỘP BÀI THI */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
              Xác nhận nộp bài thi?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bạn đã hoàn thành <b className="text-slate-700 dark:text-slate-200">{answeredCount}/{total}</b> câu hỏi.
              {total - answeredCount > 0 && (
                <span className="block mt-1 text-rose-500 font-bold">
                  ⚠️ Còn {total - answeredCount} câu chưa trả lời!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Làm tiếp
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmitExam();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/25"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY / THOÁT PHÒNG THI */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
              Thoát khỏi phòng thi?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bài thi chưa được nộp. Nếu bạn thoát bây giờ, toàn bộ kết quả đang làm sẽ bị hủy.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Tiếp tục thi
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/25"
              >
                Rời phòng thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
