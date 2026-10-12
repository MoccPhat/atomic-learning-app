import React, { useState } from 'react';
import {
  PetSpecies,
  PET_SPECIES_CONFIG,
  PetData,
} from '../../lib/focus-pet-types';
import {
  getFocusPetState,
  setActivePet,
  renamePet,
  feedPet,
  getStageTitle,
} from '../../lib/focus-pet-storage';
import { PetSvgVisual } from './FocusPetCompanion';
import {
  Utensils,
  Edit2,
  Check,
  CheckCircle,
  Clock,
  Award,
  Zap,
} from 'lucide-react';

interface FocusPetHouseProps {
  onBackToTimer?: () => void;
}

export const FocusPetHouse: React.FC<FocusPetHouseProps> = ({ onBackToTimer }) => {
  const [petState, setPetState] = useState(getFocusPetState());
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>(petState.activeSpecies);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const reloadState = () => {
    setPetState(getFocusPetState());
  };

  const currentPet: PetData = petState.pets[selectedSpecies];
  const config = PET_SPECIES_CONFIG[selectedSpecies];
  const isCompanion = petState.activeSpecies === selectedSpecies;

  // Chọn pet làm đồng hành
  const handleSetCompanion = (sp: PetSpecies) => {
    const updated = setActivePet(sp);
    setPetState(updated);
    setSelectedSpecies(sp);
    showToast(`Đã chọn ${updated.pets[sp].name} làm bạn đồng hành tập trung! 🐾`);
  };

  // Bắt đầu đổi tên
  const handleStartRename = () => {
    setEditNameInput(currentPet.name);
    setIsEditingName(true);
  };

  // Lưu tên mới
  const handleSaveRename = () => {
    if (editNameInput.trim().length > 0) {
      const updated = renamePet(selectedSpecies, editNameInput.trim());
      setPetState(updated);
      setIsEditingName(false);
      showToast(`Đã đổi tên thú cưng thành: "${editNameInput.trim()}"! ✨`);
    }
  };

  // Cho ăn
  const handleFeed = () => {
    const res = feedPet(selectedSpecies);
    reloadState();
    showToast(res.message);
  };

  return (
    <div className="space-y-6">
      {/* Banner Tiêu Đề & Kho Thức Ăn */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-200/60 dark:border-amber-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🐾</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Phòng Thú Cưng Học Tập
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              6 Loài Pet
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Mỗi phút bạn tập trung sẽ trở thành điểm kinh nghiệm và hạt thức ăn nuôi lớn người bạn đồng hành!
          </p>
        </div>

        {/* Túi Thức Ăn (Treats Inventory) */}
        <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            🍪
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hạt Dinh Dưỡng</p>
            <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {petState.treats} <span className="text-xs font-semibold text-slate-400">hạt</span>
            </p>
          </div>
        </div>
      </div>

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-xs font-bold text-brand-700 dark:text-brand-300 text-center animate-fade-in shadow-xs">
          {toastMessage}
        </div>
      )}

      {/* Main Grid: Cột trái (Chi tiết Pet đang chọn) & Cột phải (Danh sách 6 loài) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* CỘT TRÁI (COL 7) - CHI TIẾT & CHĂM SÓC PET ĐANG CHỌN */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          {/* Header Pet */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameInput}
                    onChange={(e) => setEditNameInput(e.target.value)}
                    maxLength={30}
                    className="px-3 py-1.5 rounded-xl border border-brand-500 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Nhập tên mới..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRename}
                    className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentPet.name}
                  </h3>
                  <button
                    onClick={handleStartRename}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Đổi tên thú cưng"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {config.vietnameseName} • {config.trait}
              </p>
            </div>

            {/* Huy hiệu Đồng hành */}
            {isCompanion ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Đang đồng hành</span>
              </span>
            ) : (
              <button
                onClick={() => handleSetCompanion(selectedSpecies)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 text-brand-600 dark:text-brand-400 text-xs font-bold border border-brand-200 dark:border-brand-800 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Chọn làm đồng hành</span>
              </button>
            )}
          </div>

          {/* Vùng Render Avatar SVG Lớn */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
            <div className="w-36 h-36 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center p-2 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800">
              <PetSvgVisual species={selectedSpecies} mood="happy" isInteracting={false} />
            </div>

            <div className="flex-1 space-y-4 w-full">
              {/* Cấp độ & Giai đoạn tiến hóa */}
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                  <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Cấp độ {currentPet.level}
                  </span>
                  <span className="text-brand-600 dark:text-brand-400 font-mono">
                    {currentPet.exp} / {currentPet.maxExp} EXP
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((currentPet.exp / currentPet.maxExp) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Giai đoạn: <strong className="text-slate-700 dark:text-slate-200">{getStageTitle(currentPet.stage)}</strong>
                </p>
              </div>

              {/* Chỉ số Độ no & Hạnh phúc */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    <span>Độ no nê</span>
                    <span className="font-mono">{currentPet.hunger}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        currentPet.hunger < 30 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${currentPet.hunger}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    <span>Hạnh phúc</span>
                    <span className="font-mono">{currentPet.happiness}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${currentPet.happiness}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tổng thời gian đã học */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Đã đồng hành học: </span>
                <strong className="text-slate-900 dark:text-white font-mono">
                  {currentPet.totalFocusMinutes} phút
                </strong>
              </div>
            </div>
          </div>

          {/* Mô tả tính cách & Món ăn ưa thích */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              💡 <strong>Tính cách:</strong> {config.description}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              🍴 <strong>Món khoái khẩu:</strong> {config.favoriteFood} {config.foodEmoji}
            </p>
          </div>

          {/* Nút Cho Ăn Lớn */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleFeed}
              disabled={petState.treats <= 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 ${
                petState.treats > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Cho {currentPet.name} ăn (Tiêu hao 1 hạt)</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI (COL 5) - DANH SÁCH 6 LOÀI PET CHỌN LỰA */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chọn loài bạn muốn nuôi dưỡng
            </h4>
            <span className="text-[11px] font-mono text-slate-400">6 loài có sẵn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {(Object.keys(PET_SPECIES_CONFIG) as PetSpecies[]).map((sp) => {
              const spConfig = PET_SPECIES_CONFIG[sp];
              const petData = petState.pets[sp];
              const isSelected = selectedSpecies === sp;
              const isActiveCompanion = petState.activeSpecies === sp;

              return (
                <div
                  key={sp}
                  onClick={() => setSelectedSpecies(sp)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center p-1">
                      <PetSvgVisual species={sp} mood="idle" isInteracting={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {petData?.name || spConfig.name}
                        </h5>
                        {isActiveCompanion && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                            Đồng hành
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Lv.{petData?.level || 1} • {getStageTitle(petData?.stage || 'baby')}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-lg">{spConfig.emoji}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút Quay Lại Đồng Hồ Tập Trung */}
          {onBackToTimer && (
            <button
              onClick={onBackToTimer}
              className="w-full mt-4 py-2.5 px-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center"
            >
              ← Quay lại Đồng hồ Tập trung
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
