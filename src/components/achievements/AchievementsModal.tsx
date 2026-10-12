import React, { useState, useMemo } from 'react';
import {
  Award,
  Trophy,
  X,
  CheckCircle2,
  Lock,
  Star
} from 'lucide-react';
import {
  calculateUserAchievements,
  AchievementInputStats,
  AchievementBadge,
  BadgeTier
} from '../../lib/achievements-service';

interface AchievementsModalProps {
  stats: AchievementInputStats;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  stats,
  onClose
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const overview = useMemo(() => {
    return calculateUserAchievements(stats);
  }, [stats]);

  const filteredBadges = useMemo(() => {
    if (filter === 'unlocked') {
      return overview.achievements.filter((b) => b.unlocked);
    }
    if (filter === 'locked') {
      return overview.achievements.filter((b) => !b.unlocked);
    }
    return overview.achievements;
  }, [overview.achievements, filter]);

  const getTierBadgeStyle = (tier: BadgeTier | 'locked') => {
    switch (tier) {
      case 'gold':
        return {
          border: 'border-amber-400/50',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950',
          glow: 'shadow-amber-500/10'
        };
      case 'silver':
        return {
          border: 'border-slate-300 dark:border-slate-500/50',
          bg: 'bg-slate-400/10',
          text: 'text-slate-300',
          badgeBg: 'bg-gradient-to-r from-slate-300 to-slate-200 text-slate-900',
          glow: 'shadow-slate-400/10'
        };
      case 'bronze':
        return {
          border: 'border-amber-700/50',
          bg: 'bg-amber-700/10',
          text: 'text-amber-600 dark:text-amber-500',
          badgeBg: 'bg-gradient-to-r from-amber-700 to-amber-600 text-white',
          glow: 'shadow-amber-700/10'
        };
      default:
        return {
          border: 'border-slate-200 dark:border-slate-800',
          bg: 'bg-slate-100/50 dark:bg-slate-900/40',
          text: 'text-slate-400',
          badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-500',
          glow: ''
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-text">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-left">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400">
                  Kai's Honor Hall
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {overview.unlockedCount}/{overview.totalCount} Huy hiệu
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg sm:text-xl mt-0.5">
                Cột Mốc Thành Tựu & Huy Hiệu Vinh Danh
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tổng quan cấp bậc & Điểm danh dự */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Danh hiệu */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Danh Hiệu Hiện Tại
              </span>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                {overview.overallRank}
              </h4>
            </div>
          </div>

          {/* Card 2: Điểm danh dự */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Star className="w-6 h-6 fill-amber-400/20" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Tổng Điểm Danh Dự
              </span>
              <h4 className="font-extrabold text-amber-500 text-base sm:text-lg font-mono">
                {overview.totalHonorPoints} <span className="text-xs font-sans text-slate-400 font-normal">pts</span>
              </h4>
            </div>
          </div>

          {/* Card 3: Tỷ lệ mở khóa */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">Tiến Độ Mở Khóa</span>
              <span className="text-brand-500 font-mono font-bold">{overview.completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${overview.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bộ lọc filter */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất cả ({overview.totalCount})
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filter === 'unlocked'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Đã mở khóa ({overview.unlockedCount})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filter === 'locked'
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Đang phấn đấu ({overview.totalCount - overview.unlockedCount})
            </button>
          </div>
        </div>

        {/* Lưới danh sách huy hiệu */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 auto-rows-max">
            {filteredBadges.map((badge: AchievementBadge) => {
              const style = getTierBadgeStyle(badge.tier);

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[170px] ${style.border} ${style.bg} ${
                    badge.unlocked ? 'shadow-md ' + style.glow : 'opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl sm:text-3xl p-2 rounded-2xl bg-white/10 dark:bg-black/20 shrink-0">
                          {badge.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-1.5 flex-wrap">
                            <span>{badge.title}</span>
                            {badge.unlocked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 inline" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 inline" />
                            )}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase shrink-0 ${style.badgeBg}`}>
                        {badge.tierLabel}
                      </span>
                    </div>

                    {/* Thanh tiến độ */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                        <span>
                          Tiến độ: <strong className="text-slate-700 dark:text-slate-200 font-mono">{badge.currentValue}</strong>
                        </span>
                        <span>
                          Mục tiêu: <strong className="text-slate-700 dark:text-slate-200 font-mono">
                            {badge.targets.bronze} 🥉 · {badge.targets.silver} 🥈 · {badge.targets.gold} 🥇
                          </strong>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            badge.tier === 'gold'
                              ? 'bg-amber-400'
                              : badge.tier === 'silver'
                                ? 'bg-slate-300'
                                : badge.tier === 'bronze'
                                  ? 'bg-amber-600'
                                  : 'bg-slate-500'
                          }`}
                          style={{ width: `${badge.currentProgressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Điểm danh dự nhận được */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Phần thưởng:</span>
                    <span className="font-mono font-bold text-amber-500">
                      +{badge.honorPoints} Điểm Danh Dự
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/20 transition-all active:scale-95"
          >
            Tiếp tục học tập
          </button>
        </div>
      </div>
    </div>
  );
};
