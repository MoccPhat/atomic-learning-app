import React, { useState, useEffect } from 'react';
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
import { Heart, Utensils, MessageCircle, Award } from 'lucide-react';

interface FocusPetCompanionProps {
  isTimerRunning: boolean;
  timerMode: 'focus' | 'shortBreak' | 'longBreak';
  onOpenPetHouse?: () => void;
  className?: string;
}

export const FocusPetCompanion: React.FC<FocusPetCompanionProps> = ({
  isTimerRunning,
  timerMode,
  onOpenPetHouse,
  className = '',
}) => {
  const [petState, setPetState] = useState(getFocusPetState());
  const [quote, setQuote] = useState<string>('');
  const [isInteracting, setIsInteracting] = useState(false);
  const [feedNotification, setFeedNotification] = useState<string | null>(null);

  const activeSpecies = petState.activeSpecies;
  const currentPet: PetData = petState.pets[activeSpecies];
  const config = PET_SPECIES_CONFIG[activeSpecies];

  // Xác định tâm trạng của Pet theo trạng thái Pomodoro
  const mood: PetMood = isInteracting
    ? 'happy'
    : currentPet.hunger < 30
    ? 'hungry'
    : isTimerRunning && timerMode === 'focus'
    ? 'focusing'
    : timerMode !== 'focus'
    ? 'resting'
    : 'idle';

  // Cập nhật câu nói của Pet
  useEffect(() => {
    setQuote(getRandomQuote(activeSpecies, mood));
  }, [activeSpecies, mood]);

  // Lắng nghe cập nhật thời gian thực từ các nơi khác (sân chơi, cho ăn, tiến hóa)
  useEffect(() => {
    const handleUpdate = () => {
      setPetState(getFocusPetState());
    };
    window.addEventListener('focus-pet-updated', handleUpdate);
    return () => {
      window.removeEventListener('focus-pet-updated', handleUpdate);
    };
  }, []);

  // Làm mới state khi có thay đổi
  const reloadState = () => {
    setPetState(getFocusPetState());
  };

  // Tương tác chạm vào Pet
  const handlePetClick = () => {
    setIsInteracting(true);
    setQuote(
      mood === 'focusing'
        ? 'Em vẫn đang chăm chú học cùng bạn nè! Cố lên nhé! ✨'
        : 'Cảm ơn bạn đã xoa đầu em! Bạn là người tuyệt vời nhất! ❤️'
    );
    setTimeout(() => {
      setIsInteracting(false);
    }, 2500);
  };

  // Cho ăn nhanh
  const handleQuickFeed = () => {
    const res = feedPet(activeSpecies);
    reloadState();
    setFeedNotification(res.message);
    setIsInteracting(true);
    setTimeout(() => {
      setFeedNotification(null);
      setIsInteracting(false);
    }, 2800);
  };

  return (
    <div
      className={`relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} shadow-xs backdrop-blur-xs transition-all duration-300 ${className}`}
    >
      {/* Header nhỏ: Tên Pet, Cấp độ, Túi Hạt Thưởng */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl" role="img" aria-label={config.name}>
            {config.emoji}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight truncate max-w-[130px] sm:max-w-[160px]">
                {currentPet.name}
              </h3>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-white/80 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-200/60 dark:border-slate-700">
                Lv.{currentPet.level}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {getStageTitle(currentPet.stage)}
            </p>
          </div>
        </div>

        {/* Nút xem Chuồng thú / Chi tiết */}
        {onOpenPetHouse && (
          <button
            onClick={onOpenPetHouse}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all shadow-xs"
            title="Đổi pet hoặc quản lý thú cưng"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Phòng Pet</span>
          </button>
        )}
      </div>

      {/* Vùng tương tác chính: SVG Pet Avatar + Bong bóng hội thoại */}
      <div className="flex items-center gap-4 my-2">
        {/* SVG Avatar Container */}
        <div
          onClick={handlePetClick}
          className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center cursor-pointer group select-none"
          title="Bấm vào để tương tác và âu yếm pet!"
        >
          {/* Vòng hào quang tương tác */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isInteracting
                ? 'scale-110 bg-rose-400/20 blur-sm'
                : 'group-hover:scale-105 bg-slate-300/10 dark:bg-slate-700/20'
            }`}
          />

          {/* Hiển thị SVG Pet đặc thù theo loài */}
          <PetSvgVisual species={activeSpecies} mood={mood} isInteracting={isInteracting} />

          {/* Hiệu ứng tim bay khi tương tác */}
          {isInteracting && (
            <div className="absolute -top-2 right-1 animate-bounce text-rose-500 drop-shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
          )}
        </div>

        {/* Bong bóng hội thoại (Speech Bubble) */}
        <div className="flex-1 min-w-0">
          <div className="relative p-2.5 sm:p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Mũi tên bong bóng thoại */}
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white/95 dark:bg-slate-900/95 border-l border-b border-slate-200/80 dark:border-slate-800 rotate-45" />

            <div className="flex items-start gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">
                "{quote}"
              </p>
            </div>

            {/* Thanh EXP nhỏ dưới bong bóng */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((currentPet.exp / currentPet.maxExp) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400">
                {currentPet.exp}/{currentPet.maxExp} EXP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo cho ăn tạm thời */}
      {feedNotification && (
        <div className="mt-2 p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 text-center animate-fade-in">
          {feedNotification}
        </div>
      )}

      {/* Thanh công cụ chân Widget: Trạng thái đói / vui & Nút cho ăn nhanh */}
      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        {/* Chỉ số Đói & Vui */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title={`Độ no: ${currentPet.hunger}%`}>
            <span className="text-xs">🍖</span>
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentPet.hunger < 30 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${currentPet.hunger}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1" title={`Độ hạnh phúc: ${currentPet.happiness}%`}>
            <span className="text-xs">💖</span>
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${currentPet.happiness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nút cho ăn nhanh (Ăn 1 hạt) */}
        <button
          onClick={handleQuickFeed}
          disabled={petState.treats <= 0}
          className={`flex items-center gap-1.5 px-3 py-1.2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
            petState.treats > 0
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title="Cho pet ăn 1 hạt dinh dưỡng để hồi phục độ no và nhận thêm EXP"
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Cho ăn</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
            {petState.treats} hạt
          </span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT VẼ SVG CHO TỪNG LOÀI THÚ CƯNG (PURE REACT SVG ZERO-DEPENDENCY)
// ============================================================================

interface PetSvgVisualProps {
  species: PetSpecies;
  mood: PetMood;
  isInteracting: boolean;
}

export const PetSvgVisual: React.FC<PetSvgVisualProps> = ({ species, mood, isInteracting }) => {
  const isFocusing = mood === 'focusing';
  const isHappy = mood === 'happy' || isInteracting;

  switch (species) {
    // ----------------------------------------------------
    // 1. CAPYBARA (ĐIỀM TĨNH VỚI QUẢ CAM TRÊN ĐẦU)
    // ----------------------------------------------------
    case 'capybara':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm transition-transform duration-300">
          {/* Thân Capybara */}
          <rect x="22" y="38" width="56" height="46" rx="20" fill="#92623B" />
          <rect x="25" y="42" width="50" height="40" rx="16" fill="#A77247" />

          {/* Mõm vuông tròn đặc trưng */}
          <rect x="28" y="52" width="44" height="28" rx="12" fill="#784E2A" />
          {/* Mũi & Miệng */}
          <ellipse cx="50" cy="58" rx="4" ry="2.5" fill="#3D2412" />
          <path d="M 47 62 Q 50 64 53 62" stroke="#3D2412" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Mắt thư thái (nhắm hờ hoặc chớp) */}
          {isFocusing ? (
            <g stroke="#3D2412" strokeWidth="2.5" strokeLinecap="round">
              <line x1="36" y1="46" x2="42" y2="46" />
              <line x1="58" y1="46" x2="64" y2="46" />
            </g>
          ) : isHappy ? (
            <g stroke="#3D2412" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 35 47 Q 39 42 43 47" />
              <path d="M 57 47 Q 61 42 65 47" />
            </g>
          ) : (
            <g fill="#3D2412">
              <circle cx="39" cy="46" r="3" />
              <circle cx="61" cy="46" r="3" />
              <circle cx="40" cy="45" r="1" fill="#FFFFFF" />
              <circle cx="62" cy="45" r="1" fill="#FFFFFF" />
            </g>
          )}

          {/* Tai tròn nhỏ */}
          <circle cx="25" cy="36" r="6" fill="#784E2A" />
          <circle cx="75" cy="36" r="6" fill="#784E2A" />

          {/* Quả cam 🍊 trên đầu Capybara */}
          <g className={isHappy ? 'animate-bounce' : ''}>
            <circle cx="50" cy="24" r="11" fill="#F97316" />
            <circle cx="47" cy="22" r="3" fill="#FB923C" />
            {/* Cuống và lá xanh */}
            <path d="M 50 13 Q 53 8 57 10 Q 54 14 50 13" fill="#22C55E" />
            <line x1="50" y1="13" x2="50" y2="10" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Má hồng phúng phính */}
          <ellipse cx="32" cy="54" rx="4" ry="2.5" fill="#F43F5E" opacity="0.4" />
          <ellipse cx="68" cy="54" rx="4" ry="2.5" fill="#F43F5E" opacity="0.4" />
        </svg>
      );

    // ----------------------------------------------------
    // 2. DOG (SHIBA TRUNG THÀNH)
    // ----------------------------------------------------
    case 'dog':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm transition-transform duration-300">
          {/* Tai Shiba */}
          <polygon points="20,40 32,14 44,38" fill="#D97706" />
          <polygon points="25,38 33,20 40,36" fill="#FDE68A" />
          <polygon points="56,38 68,14 80,40" fill="#D97706" />
          <polygon points="60,36 67,20 75,38" fill="#FDE68A" />

          {/* Đầu tròn Shiba */}
          <circle cx="50" cy="52" r="34" fill="#F59E0B" />
          {/* Mảng lông trắng chữ U */}
          <path d="M 28 52 C 28 74 72 74 72 52 C 72 44 64 40 50 48 C 36 40 28 44 28 52 Z" fill="#FEF3C7" />

          {/* Mũi & Miệng */}
          <ellipse cx="50" cy="58" rx="4.5" ry="3.5" fill="#1E293B" />
          <path d="M 46 63 Q 50 67 54 63" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Mắt */}
          {isFocusing ? (
            <g stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 36 50 Q 40 45 44 50" />
              <path d="M 56 50 Q 60 45 64 50" />
            </g>
          ) : isHappy ? (
            <g stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 36 51 Q 40 46 44 51" />
              <path d="M 56 51 Q 60 46 64 51" />
              {/* Lưỡi thè ra vui vẻ */}
              <ellipse cx="50" cy="68" rx="3.5" ry="4" fill="#F43F5E" />
            </g>
          ) : (
            <g fill="#1E293B">
              <circle cx="40" cy="48" r="3.5" />
              <circle cx="60" cy="48" r="3.5" />
              <circle cx="41.5" cy="46.5" r="1.2" fill="#FFFFFF" />
              <circle cx="61.5" cy="46.5" r="1.2" fill="#FFFFFF" />
            </g>
          )}

          {/* Khăn quàng cổ học sinh đỏ */}
          <path d="M 32 78 Q 50 86 68 78 L 50 92 Z" fill="#EF4444" />
          <circle cx="50" cy="84" r="3" fill="#FBBF24" />

          {/* Đốm lông trắng trên mắt */}
          <circle cx="38" cy="38" r="2.5" fill="#FEF3C7" />
          <circle cx="62" cy="38" r="2.5" fill="#FEF3C7" />
        </svg>
      );

    // ----------------------------------------------------
    // 3. CAT (MÈO CALICO ẤM ÁP)
    // ----------------------------------------------------
    case 'cat':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm transition-transform duration-300">
          {/* Tai Mèo */}
          <polygon points="22,42 30,16 45,36" fill="#F43F5E" />
          <polygon points="27,38 32,24 40,36" fill="#FED7AA" />
          <polygon points="55,36 70,16 78,42" fill="#EA580C" />
          <polygon points="60,36 68,24 73,38" fill="#FED7AA" />

          {/* Đầu tròn Mèo */}
          <circle cx="50" cy="54" r="32" fill="#FFFBEB" />
          {/* Đốm màu Calico */}
          <path d="M 24 45 C 24 35 40 32 40 45 C 40 55 24 55 24 45 Z" fill="#F97316" opacity="0.8" />
          <path d="M 62 40 C 62 30 76 34 76 46 C 76 56 64 54 62 40 Z" fill="#475569" opacity="0.7" />

          {/* Mũi hồng & Miệng meo */}
          <polygon points="48,60 52,60 50,63" fill="#FB7185" />
          <path d="M 46 64 Q 50 67 54 64" stroke="#475569" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* Râu mèo */}
          <line x1="22" y1="58" x2="36" y2="60" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="64" x2="36" y2="63" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="64" y1="60" x2="78" y2="58" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="64" y1="63" x2="78" y2="64" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Mắt mèo */}
          {isFocusing ? (
            <g stroke="#334155" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M 37 53 Q 41 57 45 53" />
              <path d="M 55 53 Q 59 57 63 53" />
            </g>
          ) : isHappy ? (
            <g stroke="#334155" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M 36 54 Q 40 48 44 54" />
              <path d="M 56 54 Q 60 48 64 54" />
            </g>
          ) : (
            <g fill="#10B981">
              <circle cx="41" cy="51" r="4" />
              <circle cx="59" cy="51" r="4" />
              <ellipse cx="41" cy="51" rx="1.5" ry="3.5" fill="#0F172A" />
              <ellipse cx="59" cy="51" rx="1.5" ry="3.5" fill="#0F172A" />
              <circle cx="42" cy="49" r="1.2" fill="#FFFFFF" />
              <circle cx="60" cy="49" r="1.2" fill="#FFFFFF" />
            </g>
          )}

          {/* Chuông vàng đeo cổ */}
          <circle cx="50" cy="84" r="5" fill="#FBBF24" />
          <circle cx="50" cy="84" r="1.5" fill="#78350F" />
        </svg>
      );

    // ----------------------------------------------------
    // 4. TURTLE (RÙA THÔNG THÁI)
    // ----------------------------------------------------
    case 'turtle':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm transition-transform duration-300">
          {/* Chân rùa */}
          <ellipse cx="28" cy="74" rx="8" ry="6" fill="#10B981" />
          <ellipse cx="72" cy="74" rx="8" ry="6" fill="#10B981" />
          <ellipse cx="26" cy="46" rx="7" ry="5" fill="#10B981" />
          <ellipse cx="74" cy="46" rx="7" ry="5" fill="#10B981" />

          {/* Đầu rùa */}
          <circle cx="50" cy="34" r="16" fill="#34D399" />

          {/* Mai rùa lớn */}
          <ellipse cx="50" cy="62" rx="30" ry="24" fill="#059669" />
          <ellipse cx="50" cy="62" rx="26" ry="20" fill="#10B981" />

          {/* Hoa văn hình lục giác trên mai rùa */}
          <polygon points="50,50 58,55 58,65 50,70 42,65 42,55" fill="#047857" stroke="#34D399" strokeWidth="1" />
          <line x1="50" y1="50" x2="50" y2="42" stroke="#047857" strokeWidth="1.5" />
          <line x1="58" y1="55" x2="68" y2="52" stroke="#047857" strokeWidth="1.5" />
          <line x1="58" y1="65" x2="68" y2="68" stroke="#047857" strokeWidth="1.5" />
          <line x1="50" y1="70" x2="50" y2="80" stroke="#047857" strokeWidth="1.5" />
          <line x1="42" y1="65" x2="32" y2="68" stroke="#047857" strokeWidth="1.5" />
          <line x1="42" y1="55" x2="32" y2="52" stroke="#047857" strokeWidth="1.5" />

          {/* Mắt rùa thông thái (đeo kính tròn ngố) */}
          <g fill="none" stroke="#047857" strokeWidth="1.5">
            <circle cx="43" cy="34" r="4.5" />
            <circle cx="57" cy="34" r="4.5" />
            <line x1="47.5" y1="34" x2="52.5" y2="34" />
          </g>
          {isFocusing ? (
            <g stroke="#065F46" strokeWidth="1.8" strokeLinecap="round">
              <line x1="41" y1="34" x2="45" y2="34" />
              <line x1="55" y1="34" x2="59" y2="34" />
            </g>
          ) : (
            <g fill="#065F46">
              <circle cx="43" cy="34" r="2" />
              <circle cx="57" cy="34" r="2" />
              <circle cx="44" cy="33.5" r="0.7" fill="#FFFFFF" />
              <circle cx="58" cy="33.5" r="0.7" fill="#FFFFFF" />
            </g>
          )}

          {/* Mũ cử nhân tốt nghiệp mini trên đầu */}
          <g>
            <polygon points="50,15 62,20 50,25 38,20" fill="#1E293B" />
            <rect x="47" y="23" width="6" height="4" fill="#0F172A" />
            <line x1="50" y1="20" x2="60" y2="24" stroke="#F59E0B" strokeWidth="1.2" />
            <circle cx="60" cy="24" r="1.5" fill="#F59E0B" />
          </g>
        </svg>
      );

    // ----------------------------------------------------
    // 5. FISH (CÁ VÀNG TRONG BỂ KÍNH)
    // ----------------------------------------------------
    case 'fish':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm transition-transform duration-300">
          {/* Bể thủy tinh tròn */}
          <circle cx="50" cy="54" r="38" fill="#E0F2FE" opacity="0.6" stroke="#38BDF8" strokeWidth="2.5" />
          <ellipse cx="50" cy="22" rx="24" ry="7" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="2" />
          {/* Lớp nước trong bể */}
          <path d="M 18 50 Q 50 46 82 50 C 82 78 18 78 18 50 Z" fill="#0284C7" opacity="0.15" />

          {/* Bọt khí nổi lên */}
          <circle cx="42" cy="38" r="2" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
          <circle cx="62" cy="32" r="2.8" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
          <circle cx="36" cy="46" r="1.5" fill="#FFFFFF" opacity="0.8" />

          {/* Thân Cá Vàng */}
          <g className={isHappy ? 'animate-bounce' : ''}>
            {/* Đuôi cá vẫy lụa */}
            <path d="M 68 56 Q 84 46 80 58 Q 84 70 68 62 Z" fill="#F97316" />
            <path d="M 66 57 Q 78 50 76 58 Q 78 66 66 61 Z" fill="#FDBA74" />

            {/* Vây trên và vây dưới */}
            <path d="M 48 44 Q 56 36 60 48 Z" fill="#FB923C" />
            <path d="M 50 68 Q 54 74 58 66 Z" fill="#FB923C" />

            {/* Mình cá tròn mập */}
            <ellipse cx="50" cy="56" rx="20" ry="14" fill="#F97316" />
            <ellipse cx="46" cy="56" rx="15" ry="11" fill="#FB923C" />

            {/* Mắt cá tròn xoe */}
            <circle cx="38" cy="53" r="5" fill="#FFFFFF" />
            <circle cx="37" cy="53" r="3" fill="#0F172A" />
            <circle cx="38" cy="52" r="1.2" fill="#FFFFFF" />

            {/* Miệng bong bóng ục ục */}
            <circle cx="28" cy="56" r="2" fill="#F97316" />
            <circle cx="24" cy="54" r="1.5" fill="#FFFFFF" opacity="0.7" />
          </g>
        </svg>
      );

    // ----------------------------------------------------
    // 6. HAMSTER / CHUỘT LANG (MÁ PHÍNH HẠT HƯỚNG DƯƠNG)
    // ----------------------------------------------------
    case 'hamster':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm transition-transform duration-300">
          {/* Tai tròn */}
          <circle cx="28" cy="28" r="9" fill="#FB923C" />
          <circle cx="28" cy="28" r="5" fill="#FED7AA" />
          <circle cx="72" cy="28" r="9" fill="#FB923C" />
          <circle cx="72" cy="28" r="5" fill="#FED7AA" />

          {/* Thân tròn mập mạp */}
          <ellipse cx="50" cy="62" rx="32" ry="26" fill="#F97316" />
          <ellipse cx="50" cy="64" rx="24" ry="20" fill="#FFF7ED" />

          {/* Đầu và Hai má phúng phính phồng to */}
          <circle cx="50" cy="46" r="24" fill="#F97316" />
          {/* Má trái và má phải to tròn phúng phính */}
          <circle cx="34" cy="54" r="12" fill="#FED7AA" />
          <circle cx="66" cy="54" r="12" fill="#FED7AA" />
          <circle cx="50" cy="50" r="16" fill="#FFF7ED" />

          {/* Má hồng hào */}
          <circle cx="30" cy="56" r="4" fill="#FB7185" opacity="0.6" />
          <circle cx="70" cy="56" r="4" fill="#FB7185" opacity="0.6" />

          {/* Mũi hồng và Miệng chúm chím */}
          <ellipse cx="50" cy="48" rx="2.5" ry="2" fill="#F43F5E" />
          <path d="M 47 52 Q 50 54 53 52" stroke="#431407" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Mắt tròn long lanh */}
          {isFocusing ? (
            <g stroke="#431407" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M 38 43 Q 42 39 46 43" />
              <path d="M 54 43 Q 58 39 62 43" />
            </g>
          ) : isHappy ? (
            <g stroke="#431407" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M 38 44 Q 42 38 46 44" />
              <path d="M 54 44 Q 58 38 62 44" />
            </g>
          ) : (
            <g fill="#431407">
              <circle cx="41" cy="42" r="3.5" />
              <circle cx="59" cy="42" r="3.5" />
              <circle cx="42.5" cy="40.5" r="1.2" fill="#FFFFFF" />
              <circle cx="60.5" cy="40.5" r="1.2" fill="#FFFFFF" />
            </g>
          )}

          {/* Hai bàn tay ôm hạt hướng dương 🌻 */}
          <ellipse cx="44" cy="68" rx="4" ry="5" fill="#FED7AA" />
          <ellipse cx="56" cy="68" rx="4" ry="5" fill="#FED7AA" />
          {/* Hạt hướng dương */}
          <path d="M 50 60 C 46 66 48 74 50 75 C 52 74 54 66 50 60 Z" fill="#3B2615" stroke="#EAB308" strokeWidth="1" />
          <line x1="50" y1="62" x2="50" y2="73" stroke="#EAB308" strokeWidth="0.8" />
        </svg>
      );
  }
};
