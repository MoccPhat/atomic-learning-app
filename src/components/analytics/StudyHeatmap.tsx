import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Flame, Calendar, Award, Zap, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
import { recordGeneralActivity } from '../../lib/storage';

interface StudyHeatmapProps {
  historyMap: Record<string, number>;
  streak: number;
  onActivityLogged?: () => void;
}

export type HeatmapRangeMonths = 1 | 6 | 12;

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({
  historyMap,
  streak,
  onActivityLogged,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    count: number;
    dayOfWeekName: string;
    dayOfMonth: number;
    isFuture: boolean;
  } | null>(null);

  // Bộ lọc thời gian: 1 tháng, 6 tháng hoặc 12 tháng (mặc định 1 tháng trên mobile, 12 tháng trên desktop)
  const [rangeMonths, setRangeMonths] = useState<HeatmapRangeMonths>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 1;
    }
    return 12;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Chuyển đổi số tháng sang số tuần tương ứng
  const rangeWeeks = useMemo(() => {
    switch (rangeMonths) {
      case 1:
        return 5; // 5 tuần (~35 ngày) cho chế độ 1 tháng
      case 6:
        return 26; // 26 tuần (~6 tháng)
      case 12:
      default:
        return 52; // 52 tuần (~12 tháng / 1 năm)
    }
  }, [rangeMonths]);

  // Tự động cuộn đến tuần hiện tại trên thiết bị có bề ngang nhỏ
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [rangeWeeks]);

  // Cấu hình kích thước ô và khoảng cách theo chế độ xem
  const layoutConfig = useMemo(() => {
    switch (rangeMonths) {
      case 1:
        // Chế độ 1 tháng: Ô to rõ nét, có thể hiển thị ngày số bên trong
        return { cellSize: 34, gap: 6, showDayNumber: true, isCentered: true };
      case 6:
        // Chế độ 6 tháng: Ô kích thước vừa vặn, bố cục thoáng đãng
        return { cellSize: 18, gap: 4, showDayNumber: false, isCentered: false };
      case 12:
      default:
        // Chế độ 12 tháng (cả năm): Chuẩn mật độ GitHub pro
        return { cellSize: 13, gap: 3, showDayNumber: false, isCentered: false };
    }
  }, [rangeMonths]);

  // Tạo cấu trúc dữ liệu ma trận tuần (Thứ 2 -> Chủ Nhật)
  const { weeks, monthMarkers, stats, totalGridWidth } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tính ngày bắt đầu: Thứ 2 của (rangeWeeks - 1) tuần trước
    const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const daysSinceMonday = (currentDayOfWeek + 6) % 7;
    const startMonday = new Date(today);
    startMonday.setDate(today.getDate() - daysSinceMonday - (rangeWeeks - 1) * 7);

    const resultWeeks: Array<{
      weekIndex: number;
      weekLabel?: string;
      days: Array<{
        dateStr: string;
        dateObj: Date;
        dayOfMonth: number;
        count: number;
        dayOfWeek: number;
        isToday: boolean;
        isFuture: boolean;
      }>;
    }> = [];

    const rawMonthMarkers: Array<{ weekIndex: number; monthNum: number; leftPx: number }> = [];
    let lastMonthSeen = -1;

    let totalActiveDays = 0;
    let totalActivities = 0;
    let maxDayCount = 0;
    let bestDate = '';

    const { cellSize, gap } = layoutConfig;

    for (let w = 0; w < rangeWeeks; w++) {
      const weekDays = [];
      let weekMondayDate: Date | null = null;

      for (let d = 0; d < 7; d++) {
        const curr = new Date(startMonday);
        curr.setDate(startMonday.getDate() + w * 7 + d);
        if (d === 0) weekMondayDate = curr;

        const dateStr = curr.toISOString().slice(0, 10);
        const isFuture = curr.getTime() > today.getTime();
        const isToday = dateStr === todayStr;
        const count = isFuture ? 0 : historyMap[dateStr] || 0;

        if (!isFuture && count > 0) {
          totalActiveDays++;
          totalActivities += count;
          if (count > maxDayCount) {
            maxDayCount = count;
            bestDate = dateStr;
          }
        }

        weekDays.push({
          dateStr,
          dateObj: curr,
          dayOfMonth: curr.getDate(),
          count,
          dayOfWeek: curr.getDay(),
          isToday,
          isFuture,
        });
      }

      // Đánh dấu nhãn tháng hoặc nhãn tuần
      if (weekMondayDate) {
        const m = weekMondayDate.getMonth();
        if (m !== lastMonthSeen) {
          rawMonthMarkers.push({
            weekIndex: w,
            monthNum: m + 1,
            leftPx: w * (cellSize + gap),
          });
          lastMonthSeen = m;
        }
      }

      resultWeeks.push({
        weekIndex: w,
        weekLabel: rangeMonths === 1 && weekMondayDate ? `${weekMondayDate.getDate()}/${weekMondayDate.getMonth() + 1}` : undefined,
        days: weekDays
      });
    }

    // Lọc nhãn tháng để tuyệt đối không bị đè nhau
    const minDistanceWeeks = rangeMonths === 12 ? 3 : rangeMonths === 6 ? 2 : 1;
    const filteredMonthMarkers: Array<{ label: string; leftPx: number }> = [];
    let lastPlacedWeek = -99;

    if (rangeMonths === 1) {
      // Trong chế độ 1 tháng: hiển thị ngày đầu của từng tuần
      for (let i = 0; i < resultWeeks.length; i++) {
        const firstDay = resultWeeks[i].days[0];
        filteredMonthMarkers.push({
          label: `${firstDay.dayOfMonth}/${firstDay.dateObj.getMonth() + 1}`,
          leftPx: i * (cellSize + gap),
        });
      }
    } else {
      for (let i = 0; i < rawMonthMarkers.length; i++) {
        const marker = rawMonthMarkers[i];
        if (marker.weekIndex === 0 && rawMonthMarkers.length > 1 && rawMonthMarkers[1].weekIndex <= 2) {
          continue;
        }
        if (marker.weekIndex - lastPlacedWeek >= minDistanceWeeks) {
          filteredMonthMarkers.push({
            label: `Thg ${marker.monthNum}`,
            leftPx: marker.leftPx,
          });
          lastPlacedWeek = marker.weekIndex;
        }
      }
    }

    const totalWidth = rangeWeeks * (cellSize + gap) - gap;

    return {
      weeks: resultWeeks,
      monthMarkers: filteredMonthMarkers,
      stats: {
        totalActiveDays,
        totalActivities,
        maxDayCount,
        bestDate,
        consistencyRate: Math.round((totalActiveDays / (rangeWeeks * 7)) * 100),
      },
      totalGridWidth: totalWidth,
    };
  }, [historyMap, rangeWeeks, rangeMonths, layoutConfig, todayStr]);

  // Cấp độ màu phong cách Emerald / Cyan Neon Pro
  const getCellColor = (count: number, isFuture: boolean, isToday: boolean) => {
    if (isFuture) {
      return 'bg-slate-800/10 dark:bg-slate-800/20 border-dashed border-slate-700/30 opacity-25 cursor-not-allowed text-slate-600';
    }
    if (count === 0) {
      return isToday
        ? 'bg-slate-800/90 dark:bg-slate-800/90 border-emerald-400 ring-2 ring-emerald-400/80 text-emerald-300'
        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 hover:border-slate-400 dark:hover:border-slate-500 text-slate-400 dark:text-slate-500';
    }
    if (count <= 2) {
      return 'bg-[#0e4429] border border-[#1b6a38] text-emerald-200 hover:scale-115 shadow-xs shadow-emerald-950/30';
    }
    if (count <= 5) {
      return 'bg-[#006d32] border border-[#26a641] text-emerald-100 hover:scale-115 shadow-xs shadow-emerald-900/30';
    }
    if (count <= 8) {
      return 'bg-[#26a641] border border-[#39d353] text-white hover:scale-115 shadow-sm shadow-emerald-500/40';
    }
    return 'bg-[#39d353] border border-[#7ee787] text-slate-950 font-black hover:scale-115 shadow-md shadow-emerald-400/60 ring-1 ring-emerald-300';
  };

  const dayLabels = [
    { row: 0, text: 'T2' },
    { row: 1, text: 'T3' },
    { row: 2, text: 'T4' },
    { row: 3, text: 'T5' },
    { row: 4, text: 'T6' },
    { row: 5, text: 'T7' },
    { row: 6, text: 'CN' },
  ];

  const visibleDayLabels = useMemo(() => {
    if (rangeMonths === 1) {
      // Ở 1 tháng: hiển thị đầy đủ T2 đến CN
      return dayLabels;
    }
    // Ở 6 hoặc 12 tháng: hiển thị xen kẽ T2, T4, T6, CN cho gọn gàng
    return [
      { row: 0, text: 'T2' },
      { row: 2, text: 'T4' },
      { row: 4, text: 'T6' },
      { row: 6, text: 'CN' },
    ];
  }, [rangeMonths]);

  const dayFullNames = [
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
    'Chủ Nhật',
  ];

  // Nút nhanh tự ghi nhận +1 hoạt động học tập hôm nay
  const handleQuickAddToday = () => {
    recordGeneralActivity(1);
    if (onActivityLogged) onActivityLogged();
  };

  return (
    <div className="w-full max-w-full p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm text-left select-none relative overflow-hidden animate-fade-in">
      {/* Background Subtle Emerald & Cyan Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm sm:text-base tracking-tight">
              Bản đồ nhiệt chăm chỉ (Study Heatmap)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {rangeMonths === 1
              ? 'Tổng kết 30 ngày (1 tháng) nỗ lực học tập của bạn'
              : rangeMonths === 6
              ? 'Tổng kết 180 ngày (6 tháng) nỗ lực học tập của bạn'
              : 'Tổng kết 365 ngày (12 tháng / 1 năm) nỗ lực học tập của bạn'}
          </p>
        </div>

        {/* Range Buttons & Quick Add */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Control: 1 tháng | 6 tháng | 12 tháng */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
            <button
              type="button"
              onClick={() => setRangeMonths(1)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                rangeMonths === 1
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              1 tháng
            </button>
            <button
              type="button"
              onClick={() => setRangeMonths(6)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                rangeMonths === 6
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              6 tháng
            </button>
            <button
              type="button"
              onClick={() => setRangeMonths(12)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                rangeMonths === 12
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              12 tháng
            </button>
          </div>

          <button
            type="button"
            onClick={handleQuickAddToday}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            title="Ghi nhận ngay 1 lượt học tập hôm nay"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+1 Hoạt động</span>
          </button>
        </div>
      </div>

      {/* 4 Chỉ số KPI Thống kê sống động - Glassmorphism sang trọng */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 dark:border-orange-500/25 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-orange-600/80 dark:text-orange-400/80 font-bold uppercase tracking-wider block">
              Streak liên tục
            </span>
            <span className="text-sm sm:text-base font-black text-orange-700 dark:text-orange-300 truncate block">
              {streak} ngày 🔥
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/25 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider block">
              Tổng lượt học ({rangeMonths === 1 ? '1 thg' : rangeMonths === 6 ? '6 thg' : '12 thg'})
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300 truncate block">
              {stats.totalActivities} lượt ⚡
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 dark:border-purple-500/25 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 font-bold uppercase tracking-wider block">
              Ngày học tích cực
            </span>
            <span className="text-sm sm:text-base font-black text-purple-700 dark:text-purple-300 truncate block">
              {stats.totalActiveDays} ngày 🎖️
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 dark:border-cyan-500/25 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-cyan-600/80 dark:text-cyan-400/80 font-bold uppercase tracking-wider block">
              Kỷ lục ngày cao nhất
            </span>
            <span className="text-sm sm:text-base font-black text-cyan-700 dark:text-cyan-300 truncate block">
              {stats.maxDayCount} bài / ngày ✨
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Matrix Container */}
      <div
        ref={scrollRef}
        className={`w-full max-w-full overflow-x-auto pb-3 pt-1 ${
          layoutConfig.isCentered ? 'flex justify-center' : ''
        }`}
      >
        <div
          className="inline-block"
          style={{ minWidth: `${totalGridWidth + 36}px` }}
        >
          {/* Hàng 1: Nhãn các Tháng / Tuần ở đỉnh (Căn chuẩn pixel) */}
          <div
            className="relative h-5 mb-1.5 ml-7 sm:ml-8"
            style={{ width: `${totalGridWidth}px` }}
          >
            {monthMarkers.map((marker, idx) => (
              <span
                key={idx}
                className="absolute text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap"
                style={{ left: `${marker.leftPx}px` }}
              >
                {marker.label}
              </span>
            ))}
          </div>

          {/* Lưới chính: Nhãn thứ bên trái + Các cột tuần */}
          <div className="flex gap-2.5 items-start">
            {/* Cột nhãn thứ (T2 -> CN) căn chuẩn pixel từng dòng */}
            <div
              className="relative shrink-0 w-5 sm:w-6 text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500"
              style={{ height: `${7 * (layoutConfig.cellSize + layoutConfig.gap) - layoutConfig.gap}px` }}
            >
              {visibleDayLabels.map((lbl) => (
                <span
                  key={lbl.row}
                  className="absolute right-1 leading-none flex items-center justify-end"
                  style={{
                    top: `${lbl.row * (layoutConfig.cellSize + layoutConfig.gap)}px`,
                    height: `${layoutConfig.cellSize}px`,
                  }}
                >
                  {lbl.text}
                </span>
              ))}
            </div>

            {/* Các cột tuần */}
            <div className="flex" style={{ gap: `${layoutConfig.gap}px` }}>
              {weeks.map((week) => (
                <div
                  key={week.weekIndex}
                  className="flex flex-col"
                  style={{ gap: `${layoutConfig.gap}px` }}
                >
                  {week.days.map((day) => (
                    <div
                      key={day.dateStr}
                      onMouseEnter={() =>
                        setHoveredDay({
                          dateStr: day.dateStr,
                          count: day.count,
                          dayOfWeekName: dayFullNames[(day.dayOfWeek + 6) % 7],
                          dayOfMonth: day.dayOfMonth,
                          isFuture: day.isFuture,
                        })
                      }
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() =>
                        setHoveredDay({
                          dateStr: day.dateStr,
                          count: day.count,
                          dayOfWeekName: dayFullNames[(day.dayOfWeek + 6) % 7],
                          dayOfMonth: day.dayOfMonth,
                          isFuture: day.isFuture,
                        })
                      }
                      style={{
                        width: `${layoutConfig.cellSize}px`,
                        height: `${layoutConfig.cellSize}px`,
                      }}
                      className={`rounded-lg border transition-all cursor-pointer flex items-center justify-center font-mono ${
                        layoutConfig.showDayNumber ? 'text-[11px] font-bold' : ''
                      } ${
                        day.isFuture
                          ? 'opacity-25 border-dashed border-slate-700 bg-transparent'
                          : 'hover:scale-120 hover:z-20'
                      } ${
                        day.isToday
                          ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900 shadow-md shadow-emerald-400/60 font-black'
                          : ''
                      } ${getCellColor(day.count, day.isFuture, day.isToday)}`}
                      title={`${day.dateStr}: ${day.count} hoạt động`}
                    >
                      {/* Hiển thị số ngày trong tháng nếu ở chế độ 1 tháng */}
                      {layoutConfig.showDayNumber && (
                        <span>{day.dayOfMonth}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info: Tooltip chi tiết ngày & Legend Chú giải */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 relative z-10">
        <div className="flex items-center gap-2 min-h-[28px]">
          {hoveredDay ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in font-medium">
              <span className="font-bold text-slate-900 dark:text-white">
                {hoveredDay.dayOfWeekName}, {new Date(hoveredDay.dateStr).toLocaleDateString('vi-VN')}
              </span>
              <span>•</span>
              {hoveredDay.isFuture ? (
                <span className="text-slate-400">(Ngày tương lai)</span>
              ) : hoveredDay.count > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  🔥 {hoveredDay.count} hoạt động học tập
                </span>
              ) : (
                <span className="text-slate-400">Chưa có hoạt động học</span>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Rê chuột hoặc chạm vào ô vuông để xem chi tiết hoạt động từng ngày</span>
            </span>
          )}
        </div>

        {/* Chú giải cấp độ màu GitHub Pro */}
        <div className="flex items-center gap-2 self-end sm:self-auto font-medium text-xs">
          <span className="text-[11px] text-slate-400">Ít</span>
          <div
            className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50"
            title="0 hoạt động"
          />
          <div
            className="w-3.5 h-3.5 rounded-md bg-[#0e4429] border border-[#1b6a38]"
            title="1 - 2 hoạt động"
          />
          <div
            className="w-3.5 h-3.5 rounded-md bg-[#006d32] border border-[#26a641]"
            title="3 - 5 hoạt động"
          />
          <div
            className="w-3.5 h-3.5 rounded-md bg-[#26a641] border border-[#39d353]"
            title="6 - 8 hoạt động"
          />
          <div
            className="w-3.5 h-3.5 rounded-md bg-[#39d353] border border-[#7ee787]"
            title="9+ hoạt động"
          />
          <span className="text-[11px] text-slate-400">Nhiều</span>
        </div>
      </div>
    </div>
  );
};
