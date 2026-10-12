import React, { useState, useEffect } from 'react';
import {
  TreePine,
  Award,
  Sun
} from 'lucide-react';
import {
  GardenTree,
  GardenStats,
  TreeSpecies,
  TREE_SPECIES_INFO,
} from '../../lib/focus-garden-types';
import {
  getGardenTrees,
  getGardenStats,
} from '../../lib/focus-garden-storage';

interface FocusGardenProps {
  currentProgress?: number; // 0 - 100% khi timer đang chạy
  isTimerRunning?: boolean;
  activeSubjectName?: string;
  selectedSpecies?: TreeSpecies;
  onSelectSpecies?: (species: TreeSpecies) => void;
}

export const FocusGarden: React.FC<FocusGardenProps> = ({
  currentProgress = 0,
  isTimerRunning: _isTimerRunning = false,
  activeSubjectName,
  selectedSpecies = 'oak',
  onSelectSpecies,
}) => {
  const [trees, setTrees] = useState<GardenTree[]>([]);
  const [stats, setStats] = useState<GardenStats>({
    totalHarvested: 0,
    totalWithered: 0,
    totalFocusMinutes: 0,
    gardenerLevel: 'Người Gieo Mầm (Level 1)',
    levelProgress: 0,
  });

  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week'>('all');

  const reloadGarden = () => {
    setTrees(getGardenTrees());
    setStats(getGardenStats());
  };

  useEffect(() => {
    reloadGarden();
  }, []);

  // Lọc cây theo thời gian
  const filteredTrees = trees.filter((tree) => {
    if (filterPeriod === 'all') return true;
    const treeDate = new Date(tree.plantedAt);
    const now = new Date();

    if (filterPeriod === 'today') {
      return (
        treeDate.getDate() === now.getDate() &&
        treeDate.getMonth() === now.getMonth() &&
        treeDate.getFullYear() === now.getFullYear()
      );
    }
    if (filterPeriod === 'week') {
      const diffDays = (now.getTime() - treeDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    return true;
  });

  // Hình thái cây đang sinh trưởng theo % đếm ngược Pomodoro
  const renderGrowingTreeVisual = (progress: number) => {
    if (progress < 25) {
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-3 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center border-4 border-amber-300 dark:border-amber-800 shadow-inner">
            <span className="text-3xl">🌱</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
              Giai đoạn 1: Hạt mầm nảy nở ({Math.round(progress)}%)
            </span>
            <span className="text-[11px] text-slate-400">
              Đất mẹ đang nuôi dưỡng mầm non, đừng rời mắt khỏi mục tiêu!
            </span>
          </div>
        </div>
      );
    } else if (progress < 60) {
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-3">
          <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center border-4 border-emerald-400 dark:border-emerald-700 shadow-md transform hover:scale-105 transition-transform">
            <span className="text-4xl">🌿</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
              Giai đoạn 2: Cây con vươn lá ({Math.round(progress)}%)
            </span>
            <span className="text-[11px] text-slate-400">
              Chồi non đang quang hợp mạnh mẽ với năng lượng tập trung cao độ.
            </span>
          </div>
        </div>
      );
    } else if (progress < 90) {
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-3">
          <div className="w-28 h-28 rounded-full bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center border-4 border-teal-400 dark:border-teal-700 shadow-lg animate-bounce">
            <span className="text-5xl">🪴</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block">
              Giai đoạn 3: Cây vươn cành kết nụ ({Math.round(progress)}%)
            </span>
            <span className="text-[11px] text-slate-400">
              Chỉ còn một chút nữa thôi, bông hoa trí tuệ sắp hé nở!
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-3">
          <div className="w-32 h-32 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center border-4 border-rose-400 dark:border-rose-700 shadow-xl scale-110 transition-all">
            <span className="text-6xl animate-pulse">
              {TREE_SPECIES_INFO[selectedSpecies].icon}
            </span>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              Giai đoạn 4: Đơm hoa kết trái ({Math.round(progress)}%)
            </span>
            <span className="text-[11px] text-slate-400">
              Tuyệt đỉnh! Cây sắp được đưa vào Khu Vườn Vinh Danh của bạn!
            </span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full space-y-6 text-left animate-fade-in">
      {/* 1. Dashboard Thống kê Khu Vườn & Cấp Bậc Làm Vườn */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <TreePine className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>Khu Vườn Tập Trung (Virtual Focus Garden)</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Kai's Garden
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mỗi chu kỳ Pomodoro hoàn thành sẽ ươm mầm một cây mới vào khu vườn tri thức
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cấp bậc người làm vườn
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {stats.gardenerLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Tiến độ thăng hạng</span>
            <span>{stats.levelProgress}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              style={{ width: `${stats.levelProgress}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* 4 Chỉ số KPI Sinh thái */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">CÂY NỞ HOA</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.totalHarvested} 🌳
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">GIỜ QUANG HỢP</span>
            <span className="text-lg font-black text-teal-600 dark:text-teal-400 font-mono">
              {(stats.totalFocusMinutes / 60).toFixed(1)} giờ
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">CÂY HÉO ÚA</span>
            <span className="text-lg font-black text-rose-500 font-mono">
              {stats.totalWithered} 🍂
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">TỔNG PHÚT</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono">
              {stats.totalFocusMinutes}p
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cây Non Đang Sinh Trưởng Trong Phiên Học Này */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500 animate-spin" />
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Cây Đang Được Tưới Tắm Bằng Sự Tập Trung
            </h4>
          </div>

          {activeSubjectName && (
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Môn: {activeSubjectName}
            </span>
          )}
        </div>

        {/* Trực quan hóa sinh trưởng */}
        {renderGrowingTreeVisual(currentProgress)}

        {/* Chọn loài cây muốn gieo trồng ở phiên này */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Chọn giống cây bạn muốn gieo trồng cho phiên này:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(Object.keys(TREE_SPECIES_INFO) as TreeSpecies[]).map((sp) => {
              const info = TREE_SPECIES_INFO[sp];
              const isSelected = selectedSpecies === sp;
              return (
                <button
                  key={sp}
                  type="button"
                  onClick={() => onSelectSpecies && onSelectSpecies(sp)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xs scale-102 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl block mb-1">{info.icon}</span>
                  <span className="text-[11px] text-slate-800 dark:text-slate-200 block truncate font-medium">
                    {info.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Lưới Các Cây Đã Thu Hoạch (The Harvested Forest Grid) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Khu Rừng Tri Thức Của Bạn ({filteredTrees.length} cây)
            </h4>
          </div>

          {/* Bộ lọc thời gian */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterPeriod === 'all'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterPeriod === 'today'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterPeriod === 'week'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              7 ngày qua
            </button>
          </div>
        </div>

        {filteredTrees.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <TreePine className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 opacity-60" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Chưa có cây nào trong mốc thời gian này
            </p>
            <p className="text-[11px] text-slate-400">
              Hãy hoàn thành một phiên Pomodoro 25 phút để gieo cây đầu tiên!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredTrees.map((tree) => {
              const info = TREE_SPECIES_INFO[tree.species];
              const isHarvested = tree.stage === 'blooming';

              return (
                <div
                  key={tree.id}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all hover:scale-103 ${
                    isHarvested
                      ? 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 opacity-70'
                  }`}
                >
                  <span className="text-3xl block my-1">
                    {isHarvested ? info.icon : '🍂'}
                  </span>
                  <div className="w-full mt-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                      {info.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {tree.subjectName || 'Tập trung'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                      {tree.focusMinutes} phút
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-2 font-mono">
                    {new Date(tree.plantedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
