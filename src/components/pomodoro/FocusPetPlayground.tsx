import React, { useState, useEffect, useRef } from 'react';
import {
  PetSpecies,
  PetMood,
  PetData,
  PET_SPECIES_CONFIG,
} from '../../lib/focus-pet-types';
import {
  getFocusPetState,
  feedPet,
  getRandomQuote,
  getStageTitle,
} from '../../lib/focus-pet-storage';
import { PetSvgVisual } from './FocusPetCompanion';
import {
  Heart,
  Sparkles,
  Award,
  Headphones,
  Coffee,
  Moon,
  Smile,
  Footprints,
} from 'lucide-react';

interface FocusPetPlaygroundProps {
  isTimerRunning: boolean;
  timerMode: 'focus' | 'shortBreak' | 'longBreak';
  onOpenPetHouse?: () => void;
  className?: string;
}

// Vật phẩm trang trí tương tác đặc trưng theo từng loài
const SPECIES_ITEMS: Record<
  PetSpecies,
  { emoji: string; name: string; desc: string }
> = {
  capybara: { emoji: '🍊', name: 'Quả cam vàng', desc: 'Cam ngọt thơm ngát' },
  dog: { emoji: '🦴', name: 'Khúc xương gặm', desc: 'Đồ chơi khoái khẩu' },
  cat: { emoji: '🧶', name: 'Cuộn len hồng', desc: 'Đồ chơi cuộn len mềm' },
  turtle: { emoji: '🪨', name: 'Tảng đá rêu', desc: 'Chỗ tắm nắng ưa thích' },
  fish: { emoji: '🫧', name: 'Bọt nước óng ánh', desc: 'Bọt khí oxy trong veo' },
  hamster: { emoji: '🌻', name: 'Hạt hướng dương', desc: 'Món gặm giòn rụm' },
};

export const FocusPetPlayground: React.FC<FocusPetPlaygroundProps> = ({
  isTimerRunning,
  timerMode,
  onOpenPetHouse,
  className = '',
}) => {
  const [petState, setPetState] = useState(getFocusPetState());
  const [quote, setQuote] = useState<string>('');
  const [isInteracting, setIsInteracting] = useState(false);
  const [heartParticles, setHeartParticles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const [feedNotification, setFeedNotification] = useState<string | null>(null);

  // =========================================================================
  // HỆ THỐNG DI CHUYỂN TỰ DO CỦA THÚ CƯNG (AUTONOMOUS PET ROAMING SYSTEM)
  // =========================================================================
  const [positionX, setPositionX] = useState<number>(0); // Tọa độ ngang (-65px đến +65px)
  const [facingDirection, setFacingDirection] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const activeSpecies = petState.activeSpecies;
  const currentPet: PetData = petState.pets[activeSpecies];
  const config = PET_SPECIES_CONFIG[activeSpecies];
  const itemConfig = SPECIES_ITEMS[activeSpecies];

  // Xác định tâm trạng của Pet theo Pomodoro
  const mood: PetMood = isInteracting
    ? 'happy'
    : currentPet.hunger < 30
    ? 'hungry'
    : isTimerRunning && timerMode === 'focus'
    ? 'focusing'
    : timerMode !== 'focus'
    ? 'resting'
    : 'idle';

  // Lắng nghe cập nhật dữ liệu Pet thời gian thực từ storage/các component khác
  useEffect(() => {
    const handleUpdate = () => {
      setPetState(getFocusPetState());
    };
    window.addEventListener('focus-pet-updated', handleUpdate);
    return () => {
      window.removeEventListener('focus-pet-updated', handleUpdate);
    };
  }, []);

  // Cập nhật câu nói của Pet
  useEffect(() => {
    setQuote(getRandomQuote(activeSpecies, mood));
  }, [activeSpecies, mood]);

  // Vòng lặp hành vi tự do di chuyển (AI Roaming Cycle)
  useEffect(() => {
    if (isInteracting) return;

    // Khoảng thời gian giữa các lần di chuyển
    // Khi đang tập trung học: di chuyển ít hơn (8-12s) và chậm rãi để tránh xao nhãng
    // Khi rảnh rỗi hoặc giải lao: năng động hơn (3.5-6s)
    const delay =
      isTimerRunning && timerMode === 'focus'
        ? Math.floor(Math.random() * 4000) + 8000
        : Math.floor(Math.random() * 2500) + 3500;

    const timer = setTimeout(() => {
      // 30% khả năng đứng yên ngắm cảnh hoặc ngủ nghỉ
      if (Math.random() < 0.3) {
        setIsMoving(false);
        return;
      }

      // Các điểm đến thú vị trên sân chơi:
      // -55px: thăm đồ chơi bên trái
      // -25px: bước nhẹ sang trái
      // 0px: trở về trung tâm đệm nằm
      // +25px: bước nhẹ sang phải
      // +55px: ghé thăm bát thức ăn bên phải
      const targets = [-55, -25, 0, 25, 55];
      const nextTarget = targets[Math.floor(Math.random() * targets.length)];

      if (nextTarget !== positionX) {
        setFacingDirection(nextTarget > positionX ? 'right' : 'left');
        setIsMoving(true);
        setPositionX(nextTarget);

        setTimeout(() => {
          setIsMoving(false);
        }, 1100);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [positionX, isMoving, isInteracting, isTimerRunning, timerMode]);

  // Click vào vùng sân khấu để gọi Pet bước tới vị trí đó
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const relativeX = e.clientX - (rect.left + rect.width / 2);

    // Giới hạn biên độ di chuyển trong khoảng an toàn [-65, 65]
    const clampedTarget = Math.max(-65, Math.min(65, Math.round(relativeX * 0.75)));

    if (Math.abs(clampedTarget - positionX) > 8) {
      setFacingDirection(clampedTarget > positionX ? 'right' : 'left');
      setIsMoving(true);
      setPositionX(clampedTarget);

      setTimeout(() => {
        setIsMoving(false);
      }, 1100);
    }
  };

  // Click vào Pet để âu yếm & thả tim
  const handlePetPet = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện click vào sàn
    setIsInteracting(true);
    setIsMoving(false); // Dừng lại để nhận âu yếm

    // Tạo hiệu ứng tim bay ngẫu nhiên
    const newHearts = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -20 - Math.random() * 40,
    }));
    setHeartParticles((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setHeartParticles((prev) =>
        prev.filter((h) => !newHearts.some((nh) => nh.id === h.id))
      );
    }, 1200);

    setTimeout(() => {
      setIsInteracting(false);
    }, 1500);
  };

  // Tương tác với Đồ chơi bên trái
  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Pet quay mặt và bước sang thăm đồ chơi
    setFacingDirection('left');
    setIsMoving(true);
    setPositionX(-55);
    setTimeout(() => {
      setIsMoving(false);
      setIsInteracting(true);
      setFeedNotification(`Bé ${currentPet.name} thích thú chơi với ${itemConfig.name}! ✨`);
      setTimeout(() => {
        setFeedNotification(null);
        setIsInteracting(false);
      }, 2000);
    }, 1100);
  };

  // Cho ăn nhanh
  const handleFeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = feedPet(activeSpecies);
    setPetState(getFocusPetState());
    setFeedNotification(res.message);

    // Pet quay mặt và bước sang bát thức ăn để ăn hạt
    setFacingDirection('right');
    setIsMoving(true);
    setPositionX(50);

    setTimeout(() => {
      setIsMoving(false);
      setIsInteracting(true);
      setTimeout(() => {
        setFeedNotification(null);
        setIsInteracting(false);
      }, 2500);
    }, 1000);
  };

  return (
    <div
      className={`relative rounded-3xl p-5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-xs transition-all duration-300 space-y-4 overflow-hidden ${className}`}
    >
      {/* ========================================================= */}
      {/* 1. HEADER KHU SINH HOẠT THÚ CƯNG */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl" role="img" aria-label={config.name}>
            {config.emoji}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                {currentPet.name}
              </h4>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Lv.{currentPet.level}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {getStageTitle(currentPet.stage)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Badge trạng thái học tập của Pet */}
          {isTimerRunning && timerMode === 'focus' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 animate-pulse">
              <Headphones className="w-3.5 h-3.5" />
              <span>Đang cùng học</span>
            </span>
          ) : timerMode !== 'focus' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
              <Coffee className="w-3.5 h-3.5" />
              <span>Đang nghỉ ngơi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              <span>Sẵn sàng</span>
            </span>
          )}

          {/* Nút Phòng Pet */}
          {onOpenPetHouse && (
            <button
              onClick={onOpenPetHouse}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all shadow-xs"
              title="Đổi pet hoặc quản lý thú cưng"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Phòng Pet</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SÂN CHƠI THÚ CƯNG TRỰC QUAN (PET HABITAT & PLAYGROUND) */}
      {/* ========================================================= */}
      <div
        ref={stageRef}
        onClick={handleStageClick}
        className="relative rounded-2xl p-6 bg-gradient-to-b from-slate-100/80 to-slate-200/40 dark:from-slate-900/80 dark:to-slate-950/80 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center min-h-[230px] select-none overflow-hidden cursor-crosshair group"
        title="Bấm vào bất kỳ đâu trên sân để gọi bé pet bước tới!"
      >
        {/* Ánh sáng nền lung linh mờ ảo */}
        <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Bong bóng suy nghĩ / Lời nói của Pet */}
        <div className="relative z-20 max-w-sm mb-4 animate-fade-in text-center pointer-events-none">
          <div className="inline-block relative px-4 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-md">
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium italic leading-relaxed">
              "{feedNotification || quote}"
            </p>
            {/* Đuôi bong bóng suy nghĩ */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 dark:bg-slate-900/95 border-r border-b border-slate-200/80 dark:border-slate-800 rotate-45" />
          </div>
        </div>

        {/* Khu vực sân khấu thú cưng */}
        <div className="relative flex items-center justify-center w-full max-w-xs min-h-[120px]">
          {/* Vật phẩm đặc trưng bên trái */}
          <div
            onClick={handleItemClick}
            className="absolute left-3 bottom-1 z-10 flex flex-col items-center cursor-pointer transition-transform hover:scale-125"
            title={`${itemConfig.name}: ${itemConfig.desc} (Bấm để gọi pet lại chơi)`}
          >
            <span className="text-2xl drop-shadow-sm filter">
              {itemConfig.emoji}
            </span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
              {itemConfig.name}
            </span>
          </div>

          {/* Thảm nằm trung tâm (Tổ của Pet) */}
          <div className="absolute w-36 h-10 rounded-full bg-slate-300/30 dark:bg-slate-800/40 border border-slate-300/40 dark:border-slate-700/40 blur-[1px] pointer-events-none" />

          {/* ======================================================= */}
          {/* CỤM THÚ CƯNG + BÓNG ĐỔ DI CHUYỂN TỰ DO QUA LẠI */}
          {/* ======================================================= */}
          <div
            className="relative flex flex-col items-center z-10 transition-transform duration-1000 ease-in-out"
            style={{
              transform: `translateX(${positionX}px)`,
            }}
          >
            {/* Vòng hào quang tương tác khi click */}
            <div
              className={`absolute -inset-4 rounded-full transition-all duration-500 ${
                isInteracting
                  ? 'scale-125 bg-rose-500/20 blur-md'
                  : 'bg-transparent'
              }`}
            />

            {/* Bóng đổ 3D dưới chân Pet (di chuyển nhịp nhàng cùng Pet) */}
            <div
              className={`absolute bottom-0 h-5 bg-slate-900/20 dark:bg-black/50 rounded-full blur-xs transition-all duration-300 ${
                isMoving ? 'w-24 scale-95 opacity-70' : 'w-28 opacity-100'
              }`}
            />

            {/* Nhân vật Pet to rõ nét */}
            <div
              onClick={handlePetPet}
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isInteracting
                  ? 'scale-110 -translate-y-2'
                  : isMoving
                  ? 'animate-[bounce_0.6s_infinite] -translate-y-1'
                  : isTimerRunning && timerMode === 'focus'
                  ? 'hover:scale-105'
                  : 'hover:scale-105 animate-[bounce_4s_infinite]'
              }`}
              title="Nhấn vào bé pet để xoa đầu & vuốt ve!"
            >
              {/* Lớp SVG được lật theo hướng quay mặt */}
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-300"
                style={{
                  transform: `scaleX(${facingDirection === 'left' ? -1 : 1})`,
                }}
              >
                <PetSvgVisual
                  species={activeSpecies}
                  mood={mood}
                  isInteracting={isInteracting}
                />
              </div>

              {/* Biểu tượng ngủ khi nghỉ ngơi (giữ nguyên không bị lật ngược chữ) */}
              {timerMode !== 'focus' && !isInteracting && (
                <div className="absolute -top-1 -right-1 flex items-center gap-0.5 text-indigo-400 font-black text-xs animate-bounce pointer-events-none">
                  <Moon className="w-3.5 h-3.5" />
                  <span>Zzz...</span>
                </div>
              )}

              {/* Biểu tượng tai nghe/tập trung khi đang học */}
              {isTimerRunning && timerMode === 'focus' && !isInteracting && (
                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse pointer-events-none">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Các hạt tim bay bổng khi vuốt ve */}
              {heartParticles.map((hp) => (
                <div
                  key={hp.id}
                  className="absolute pointer-events-none text-rose-500 animate-ping"
                  style={{
                    transform: `translate(${hp.x}px, ${hp.y}px)`,
                  }}
                >
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Bát đựng hạt thức ăn bên phải */}
          <div
            onClick={handleFeed}
            className={`absolute right-3 bottom-1 z-10 flex flex-col items-center cursor-pointer transition-all hover:scale-110 active:scale-95 p-1.5 rounded-xl ${
              petState.treats > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                : 'opacity-50 cursor-not-allowed'
            }`}
            title={
              petState.treats > 0
                ? `Nhấn vào bát để cho ăn (còn ${petState.treats} hạt)`
                : 'Đã hết hạt, hãy hoàn thành phiên Pomodoro để nhận thêm!'
            }
          >
            <span className="text-xl">🥣</span>
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
              {petState.treats} hạt
            </span>
          </div>
        </div>

        {/* Hướng dẫn tương tác nhỏ dưới đáy sân khấu */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <Footprints className="w-3 h-3 text-brand-500" />
          <span>Bé thú cưng tự do dạo chơi hoặc đi tới điểm bạn nhấn trên sàn</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. THANH TIẾN TRÌNH & CHỈ SỐ SINH HOẠT */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
        {/* Thanh Độ No */}
        <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span>🍗</span>
            <span className="text-[11px] font-bold">Độ no</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentPet.hunger > 50
                    ? 'bg-amber-500'
                    : currentPet.hunger > 20
                    ? 'bg-orange-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${currentPet.hunger}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {currentPet.hunger}%
            </span>
          </div>
        </div>

        {/* Thanh Độ Hạnh Phúc */}
        <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span>💖</span>
            <span className="text-[11px] font-bold">Hạnh phúc</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${currentPet.happiness}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {currentPet.happiness}%
            </span>
          </div>
        </div>

        {/* Thanh EXP Cấp Độ */}
        <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-[11px] font-bold">Kinh nghiệm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((currentPet.exp / currentPet.maxExp) * 100)
                  )}%`,
                }}
              />
            </div>
            <span className="font-mono text-[10px] font-bold text-slate-500">
              {currentPet.exp}/{currentPet.maxExp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
