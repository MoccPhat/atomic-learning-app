import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Sparkles,
  Settings2,
} from 'lucide-react';
import { Card } from '../../lib/types';
import { speakText, stopSpeaking, detectLanguage } from '../../lib/speech-service';
import { recordReview } from '../../lib/storage';
import { recordMistake } from '../../lib/mistakes-storage';
import { getFocusPetState } from '../../lib/focus-pet-storage';
import { PetSvgVisual } from '../pomodoro/FocusPetCompanion';

interface AudioFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onFinish?: () => void;
}

export const AudioFlashcardModal: React.FC<AudioFlashcardModalProps> = ({
  isOpen,
  onClose,
  cards,
  onFinish,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playStep, setPlayStep] = useState<'reading_front' | 'thinking' | 'reading_back' | 'idle'>('idle');
  const [countdown, setCountdown] = useState<number>(4);
  const [thinkTimeSetting, setThinkTimeSetting] = useState<number>(4); // Giây
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [petState] = useState(getFocusPetState());

  const timerRef = useRef<any>(null);
  const currentCard = cards[currentIndex];

  // Dừng đọc khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setIsPlaying(false);
      setPlayStep('idle');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // VÒNG ĐIỀU PHỐI PHÁT ÂM THANH PODCAST
  useEffect(() => {
    if (!isOpen || !isPlaying || !currentCard) return;

    if (playStep === 'reading_front') {
      const textToRead = `${currentCard.title ? currentCard.title + '. ' : ''}${currentCard.front}`;
      const lang = detectLanguage(textToRead);

      speakText(textToRead, {
        lang,
        rate: speechRate,
        onEnd: () => {
          if (!isPlaying) return;
          // Chuyển sang bước đếm ngược suy nghĩ
          setPlayStep('thinking');
          setCountdown(thinkTimeSetting);
        },
        onError: () => {
          setPlayStep('thinking');
          setCountdown(thinkTimeSetting);
        },
      });
    } else if (playStep === 'thinking') {
      let secondsLeft = countdown;
      timerRef.current = setInterval(() => {
        secondsLeft -= 1;
        setCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(timerRef.current);
          if (isPlaying) {
            setPlayStep('reading_back');
          }
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else if (playStep === 'reading_back') {
      const textToRead = `Đáp án là: ${currentCard.back}`;
      const lang = detectLanguage(textToRead);

      speakText(textToRead, {
        lang,
        rate: speechRate,
        onEnd: () => {
          if (!isPlaying) return;
          // Tự động sang thẻ kế tiếp
          handleNextCard(true);
        },
        onError: () => {
          handleNextCard(true);
        },
      });
    }
  }, [isOpen, isPlaying, playStep, currentCard, speechRate, thinkTimeSetting]);

  if (!isOpen || !cards.length) return null;

  // Bắt đầu / Tạm dừng
  const togglePlay = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setPlayStep('idle');
    } else {
      setIsPlaying(true);
      setPlayStep('reading_front');
    }
  };

  // Sang thẻ tiếp theo
  const handleNextCard = (auto: boolean = false) => {
    stopSpeaking();
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      if (isPlaying || auto) {
        setPlayStep('reading_front');
      } else {
        setPlayStep('idle');
      }
    } else {
      // Đã hết thẻ
      setIsPlaying(false);
      setPlayStep('idle');
      if (onFinish) onFinish();
    }
  };

  // Quay lại thẻ trước
  const handlePrevCard = () => {
    stopSpeaking();
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setPlayStep(isPlaying ? 'reading_front' : 'idle');
    }
  };

  // Đánh dấu "Đã thuộc" (Grade 3)
  const handleMarkMastered = () => {
    recordReview(currentCard.id, 3);
    handleNextCard(false);
  };

  // Đánh dấu "Cần ôn lại" (Grade 1 - Again) -> Ghi vào sổ lỗi
  const handleMarkNeedReview = () => {
    recordReview(currentCard.id, 1);
    recordMistake({
      sourceType: 'flashcard',
      sourceId: currentCard.id,
      sourceName: currentCard.category,
      question: `${currentCard.title ? currentCard.title + ': ' : ''}${currentCard.front}`,
      correctAnswer: currentCard.back,
      category: currentCard.category,
      reason: 'forgot_concept',
    });
    handleNextCard(false);
  };

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col text-slate-100 relative overflow-hidden select-none">
        {/* Nền ánh sáng lung linh */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Headphones className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-100 flex items-center gap-2">
                <span>Podcast Ôn Bài Rảnh Tay</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Audio Mode
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Thẻ {currentIndex + 1} / {cards.length} ({progressPercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Cài đặt nhịp đọc"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cài đặt tốc độ và thời gian chờ */}
        {showSettings && (
          <div className="relative z-20 mb-4 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold">Thời gian suy nghĩ giữa câu:</span>
              <div className="flex items-center gap-1.5 font-bold">
                {[3, 4, 6, 8].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setThinkTimeSetting(sec)}
                    className={`px-2.5 py-1 rounded-lg ${
                      thinkTimeSetting === sec
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold">Tốc độ đọc giọng AI:</span>
              <div className="flex items-center gap-1.5 font-bold">
                {[0.8, 1.0, 1.2].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSpeechRate(r)}
                    className={`px-2.5 py-1 rounded-lg ${
                      speechRate === r
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* KHU VỰC TRUNG TÂM: PET ĐỒNG HÀNH & SÓNG ÂM THANH */}
        {/* ========================================================= */}
        <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
          {/* Bé Pet đeo tai nghe */}
          <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
            {/* Vòng hào quang phát thanh */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700 ${
                isPlaying
                  ? 'scale-125 bg-brand-500/20 blur-md animate-pulse'
                  : 'bg-transparent'
              }`}
            />
            <div className="relative z-10 w-24 h-24">
              <PetSvgVisual
                species={petState.activeSpecies}
                mood={isPlaying ? 'focusing' : 'idle'}
                isInteracting={isPlaying}
              />
            </div>
            {/* Icon tai nghe trên Pet */}
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-brand-500 text-white shadow-lg animate-bounce">
              <Headphones className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Trạng thái hoạt động */}
          <div className="mb-4">
            {playStep === 'reading_front' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Đang đọc câu hỏi...</span>
              </span>
            )}
            {playStep === 'thinking' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Tự nhẩm câu trả lời ({countdown}s)...</span>
              </span>
            )}
            {playStep === 'reading_back' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đang đọc câu trả lời...</span>
              </span>
            )}
            {playStep === 'idle' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                <span>Bấm nút Phát bên dưới để bắt đầu</span>
              </span>
            )}
          </div>

          {/* Nội dung câu hỏi và câu trả lời hiện tại */}
          <div className="w-full max-w-md min-h-[90px] p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-center">
            <h4 className="text-sm font-extrabold text-slate-100 mb-1 leading-relaxed">
              {currentCard.front}
            </h4>
            {(playStep === 'reading_back' || !isPlaying) && (
              <p className="text-xs text-emerald-400 font-bold mt-2 pt-2 border-t border-slate-700/60 animate-fade-in">
                {currentCard.back}
              </p>
            )}
          </div>
        </div>

        {/* Thanh tiến trình phát */}
        <div className="relative z-10 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ========================================================= */}
        {/* NÚT ĐIỀU KHIỂN TO BẢN THÂN THIỆN RẢNH TAY */}
        {/* ========================================================= */}
        <div className="relative z-10 flex flex-col gap-4">
          {/* Cụm nút Play / Pause / Tua */}
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={currentIndex === 0}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-all active:scale-95"
              title="Thẻ trước"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-brand-500/30 active:scale-95 transition-all"
              title={isPlaying ? 'Tạm dừng' : 'Bắt đầu phát'}
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => handleNextCard(false)}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
              title="Bỏ qua sang thẻ sau"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Hai nút đánh giá nhanh kết quả */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleMarkNeedReview}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Chưa thuộc (Lưu sổ lỗi)</span>
            </button>

            <button
              type="button"
              onClick={handleMarkMastered}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã thuộc lòng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
