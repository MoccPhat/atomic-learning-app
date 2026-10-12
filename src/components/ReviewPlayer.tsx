import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Flame,
  Sparkles,
  Headphones,
  Play,
  Pause,
  SkipForward,
  Settings2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, ReviewGrade } from '../lib/types';
import { recordReview } from '../lib/storage';
import { CodeCardView } from './CodeCardView';
import { speakText, stopSpeaking, detectLanguage } from '../lib/speech-service';
import { ambientAudio, AmbientSoundType } from '../lib/ambient-audio';
import { recordMistake } from '../lib/mistakes-storage';

interface ReviewPlayerProps {
  cards: Card[];
  onFinish: () => void;
  onExit: () => void;
}

export const ReviewPlayer: React.FC<ReviewPlayerProps> = ({ cards, onFinish, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);

  // === CHẾ ĐỘ AUDIO HANDS-FREE ===
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [handsFreePaused, setHandsFreePaused] = useState(false);
  const [pauseDurationSeconds, setPauseDurationSeconds] = useState(3); // Thời gian suy nghĩ trước khi lật (3s / 5s / 8s)
  const [remainingThinkSeconds, setRemainingThinkSeconds] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.2);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex) / cards.length) * 100);

  // Kích hoạt pháo hoa chúc mừng khi hoàn thành phiên
  useEffect(() => {
    if (completed) {
      stopSpeaking();
      ambientAudio.stop();
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
  }, [completed]);

  // Dọn dẹp âm thanh khi unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      ambientAudio.stop();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
  }, []);

  // Xử lý thay đổi Ambient Sound
  const handleAmbientChange = (type: AmbientSoundType) => {
    setAmbientType(type);
    if (type === 'none') {
      ambientAudio.stop();
    } else {
      ambientAudio.play(type, ambientVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    ambientAudio.setVolume(vol);
  };

  const handleGrade = useCallback((grade: ReviewGrade) => {
    if (!currentCard) return;

    recordReview(currentCard.id, grade);
    setSessionReviewedCount((prev) => prev + 1);

    // Tự động ghi vào Sổ Lỗi Sai nếu đánh giá quên (1 - Again) hoặc khó (2 - Hard)
    if (grade === 1 || grade === 2) {
      recordMistake({
        sourceType: 'flashcard',
        sourceId: currentCard.id,
        sourceName: currentCard.category,
        question: `${currentCard.title ? currentCard.title + ': ' : ''}${currentCard.front}`,
        correctAnswer: currentCard.back,
        explanation: currentCard.codeSnippet || undefined,
        category: currentCard.category,
        reason: 'forgot_concept',
      });
    }

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    setRemainingThinkSeconds(null);

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
      setIsHandsFree(false);
    }
  }, [currentCard, currentIndex, cards.length]);

  // VÒNG LẶP CHẾ ĐỘ RẢNH TAY (HANDS-FREE STEPPER)
  useEffect(() => {
    if (!isHandsFree || handsFreePaused || completed || !currentCard) return;

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);

    if (!isFlipped) {
      // BƯỚC 1: Đọc mặt trước (câu hỏi / khái niệm)
      const textToRead = `${currentCard.title ? currentCard.title + '. ' : ''}${currentCard.front}`;
      const lang = detectLanguage(textToRead);

      speakText(textToRead, {
        lang,
        rate: speechRate,
        onEnd: () => {
          // BƯỚC 2: Đọc xong mặt trước -> Bắt đầu đếm ngược thời gian suy nghĩ
          let timeLeft = pauseDurationSeconds;
          setRemainingThinkSeconds(timeLeft);

          countdownTimerRef.current = setInterval(() => {
            timeLeft -= 1;
            if (timeLeft <= 0) {
              if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
              setRemainingThinkSeconds(null);
              // Tự động lật thẻ
              setIsFlipped(true);
            } else {
              setRemainingThinkSeconds(timeLeft);
            }
          }, 1000);
        },
      });
    } else {
      // BƯỚC 3: Đã lật thẻ -> Đọc mặt sau (lời giải / đáp án)
      const textToRead = currentCard.back;
      const lang = detectLanguage(textToRead);

      speakText(textToRead, {
        lang,
        rate: speechRate,
        onEnd: () => {
          // BƯỚC 4: Chờ 2.5 giây cho người học tiếp thu rồi tự động sang thẻ tiếp theo (Good grade = 3)
          autoNextTimerRef.current = setTimeout(() => {
            handleGrade(3);
          }, 2500);
        },
      });
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
  }, [isHandsFree, handsFreePaused, isFlipped, currentIndex, currentCard, completed, pauseDurationSeconds, speechRate, handleGrade]);

  // Hỗ trợ phím tắt trên PC: Space để lật thẻ/Pause rảnh tay, phím 1-4 để chấm điểm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isHandsFree) {
          setHandsFreePaused((prev) => !prev);
        } else {
          setIsFlipped((prev) => !prev);
        }
      } else if (e.key === 'Escape' && isHandsFree) {
        setIsHandsFree(false);
        stopSpeaking();
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1);
        if (e.key === '2') handleGrade(2);
        if (e.key === '3') handleGrade(3);
        if (e.key === '4') handleGrade(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, completed, isHandsFree, handleGrade]);

  const handleSpeakManual = (text: string) => {
    const lang = detectLanguage(text);
    speakText(text, { lang, rate: speechRate });
  };

  const toggleHandsFree = () => {
    if (!isHandsFree) {
      setIsHandsFree(true);
      setHandsFreePaused(false);
    } else {
      setIsHandsFree(false);
      setHandsFreePaused(false);
      stopSpeaking();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
      setRemainingThinkSeconds(null);
    }
  };

  if (completed) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6 shadow-lg shadow-brand-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Tuyệt vời! Hoàn thành ôn tập</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Bạn vừa củng cố <span className="font-bold text-slate-800 dark:text-slate-200">{sessionReviewedCount} thẻ kiến thức</span> vào trí nhớ dài hạn.
        </p>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex items-center justify-around">
          <div className="text-center">
            <span className="block text-2xl font-black text-brand-600 dark:text-brand-400">{sessionReviewedCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thẻ đã ôn</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <Flame className="w-5 h-5 fill-amber-500" />
              <span className="text-2xl font-black">Streak +1</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thói quen giữ vững</span>
          </div>
        </div>

        <button
          onClick={onFinish}
          className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-brand-500/30 transition-all"
        >
          Trở về Trang chủ
        </button>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-[85vh]">
      {/* Top Header: Navigation & Progress */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={() => {
            stopSpeaking();
            ambientAudio.stop();
            onExit();
          }}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Thoát phiên ôn tập"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 mx-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <span>Tiến độ: {currentIndex + 1} / {cards.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Nút kích hoạt chế độ Hands-Free Audio */}
        <button
          onClick={toggleHandsFree}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isHandsFree
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/25 ring-2 ring-purple-400/40 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
          }`}
          title="Ôn tập rảnh tay bằng giọng nói"
        >
          <Headphones className="w-4 h-4" />
          <span className="hidden sm:inline">{isHandsFree ? 'Đang Rảnh Tay' : 'Rảnh Tay'}</span>
        </button>

        <span className="text-xs font-mono font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          SRS {currentCard.interval}d
        </span>
      </div>

      {/* THANH ĐIỀU KHIỂN HANDS-FREE AUDIO PLAYER */}
      {isHandsFree && (
        <div className="mb-4 p-4 rounded-3xl bg-gradient-to-r from-purple-900/90 to-indigo-900/90 text-white shadow-xl backdrop-blur-md border border-purple-500/30 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHandsFreePaused((prev) => !prev)}
                className="w-10 h-10 rounded-2xl bg-white text-purple-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                title={handsFreePaused ? 'Tiếp tục phát' : 'Tạm dừng'}
              >
                {handsFreePaused ? <Play className="w-5 h-5 fill-current ml-0.5" /> : <Pause className="w-5 h-5 fill-current" />}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                    {handsFreePaused ? 'Đã tạm dừng' : isFlipped ? 'Đang đọc lời giải' : 'Đang đọc câu hỏi'}
                  </span>
                  {!handsFreePaused && (
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-1 bg-purple-300 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 bg-purple-300 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 bg-purple-300 rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                {/* Đếm ngược thời gian suy nghĩ */}
                {remainingThinkSeconds !== null && (
                  <p className="text-[11px] text-purple-200 font-medium">
                    Thời gian tự nhớ: <span className="font-bold text-amber-300 text-sm">{remainingThinkSeconds}s</span> trước khi lật đáp án...
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGrade(3)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-bold flex items-center gap-1"
                title="Bỏ qua sang thẻ kế tiếp"
              >
                <SkipForward className="w-4 h-4" />
                <span className="hidden sm:inline">Kế tiếp</span>
              </button>

              <button
                onClick={() => setShowAudioSettings((prev) => !prev)}
                className={`p-2 rounded-xl transition-all ${
                  showAudioSettings ? 'bg-white text-purple-950 font-bold' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Cài đặt giọng đọc & nhạc nền"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Menu cài đặt Audio mở rộng */}
          {showAudioSettings && (
            <div className="mt-3 pt-3 border-t border-purple-400/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-purple-300 font-semibold mb-1">Thời gian suy nghĩ:</label>
                <select
                  value={pauseDurationSeconds}
                  onChange={(e) => setPauseDurationSeconds(Number(e.target.value))}
                  className="w-full bg-purple-950/80 border border-purple-500/40 rounded-xl px-2 py-1.5 text-white"
                >
                  <option value={2}>2 giây (Phản xạ nhanh)</option>
                  <option value={3}>3 giây (Tiêu chuẩn)</option>
                  <option value={5}>5 giây (Thoải mái)</option>
                  <option value={8}>8 giây (Suy ngẫm sâu)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-purple-300 font-semibold mb-1">Tốc độ đọc:</label>
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="w-full bg-purple-950/80 border border-purple-500/40 rounded-xl px-2 py-1.5 text-white"
                >
                  <option value={0.85}>0.85x (Chậm rãi)</option>
                  <option value={1.0}>1.0x (Chuẩn tự nhiên)</option>
                  <option value={1.2}>1.2x (Học nhanh)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-purple-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Nhạc nền Ambient:</span>
                  {ambientType !== 'none' && <span>{Math.round(ambientVolume * 100)}%</span>}
                </label>
                <div className="flex gap-1.5 items-center">
                  <select
                    value={ambientType}
                    onChange={(e) => handleAmbientChange(e.target.value as AmbientSoundType)}
                    className="flex-1 bg-purple-950/80 border border-purple-500/40 rounded-xl px-2 py-1.5 text-white"
                  >
                    <option value="none">Tắt nhạc nền</option>
                    <option value="brown-noise">Brown Noise (Ấm êm)</option>
                    <option value="rain">Tiếng mưa nhẹ</option>
                    <option value="binaural-alpha">Sóng Alpha (10Hz Focus)</option>
                    <option value="binaural-gamma">Sóng Gamma (40Hz Siêu nhớ)</option>
                  </select>

                  {ambientType !== 'none' && (
                    <input
                      type="range"
                      min={0.05}
                      max={0.8}
                      step={0.05}
                      value={ambientVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 accent-amber-400 cursor-pointer"
                      title="Âm lượng nhạc nền"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Flashcard Component */}
      <div
        onClick={() => !isFlipped && setIsFlipped(true)}
        className={`flex-1 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all cursor-pointer relative overflow-hidden select-text ${
          !isFlipped ? 'hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-2xl' : ''
        }`}
      >
        {/* Card Badge & Category */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
              currentCard.category === 'code' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' :
              currentCard.category === 'english' ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300' :
              currentCard.category === 'book' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
              'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
            }`}>
              {currentCard.category}
            </span>

            {currentCard.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeakManual(isFlipped ? currentCard.back : currentCard.front);
              }}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Đọc nội dung này bằng giọng nói"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="my-auto text-left">
          {currentCard.title && (
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {currentCard.title}
            </h3>
          )}

          {/* FRONT */}
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug whitespace-pre-line mb-6">
            {currentCard.front}
          </div>

          {/* BACK (Revealed on flip) */}
          {isFlipped ? (
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 animate-fade-in text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Lời giải / Kiến thức cốt lõi:
              </span>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {currentCard.back}
              </p>

              {/* Code Snippet if exists */}
              {currentCard.codeSnippet && (
                <CodeCardView code={currentCard.codeSnippet} language={currentCard.codeLanguage} />
              )}
            </div>
          ) : (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
                <RotateCcw className="w-3.5 h-3.5" /> Chạm hoặc ấn Phím Cách (Space) để lật thẻ
              </span>
            </div>
          )}
        </div>

        {/* Bottom helper tip */}
        <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-2">
          <span>Tạo lúc: {new Date(currentCard.createdAt).toLocaleDateString('vi-VN')}</span>
          <span>•</span>
          <span>Đã nhớ: {currentCard.repetitions} lần</span>
        </div>
      </div>

      {/* Action Grading Buttons */}
      <div className="mt-4">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-black text-sm tracking-wide shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Lật xem đáp án
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
            <button
              onClick={() => handleGrade(1)}
              className="py-3 px-1 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-[11px] font-mono text-rose-400">1</span>
              <span>Quên</span>
              <span className="text-[10px] font-normal text-rose-500 dark:text-rose-400 mt-0.5">1 ngày</span>
            </button>

            <button
              onClick={() => handleGrade(2)}
              className="py-3 px-1 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-[11px] font-mono text-amber-400">2</span>
              <span>Khó</span>
              <span className="text-[10px] font-normal text-amber-500 dark:text-amber-400 mt-0.5">2 ngày</span>
            </button>

            <button
              onClick={() => handleGrade(3)}
              className="py-3 px-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-[11px] font-mono text-emerald-400">3</span>
              <span>Nhớ</span>
              <span className="text-[10px] font-normal text-emerald-500 dark:text-emerald-400 mt-0.5">Chuẩn</span>
            </button>

            <button
              onClick={() => handleGrade(4)}
              className="py-3 px-1 rounded-2xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-[11px] font-mono text-sky-400">4</span>
              <span>Dễ</span>
              <span className="text-[10px] font-normal text-sky-500 dark:text-sky-400 mt-0.5">Tăng tốc</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
