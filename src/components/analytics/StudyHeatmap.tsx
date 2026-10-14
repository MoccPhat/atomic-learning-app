import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Flame, Award, Zap, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
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

  // Cấp độ màu chuẩn hóa theo Semantic Heatmap Tokens
  const getCellColor = (count: number, isFuture: boolean, isToday: boolean) => {
    if (isFuture) {
      return 'bg-theme-subtle/30 border-dashed border-theme-border/40 opacity-25 cursor-not-allowed text-theme-muted';
    }
    if (count === 0) {
      return isToday
        ? 'bg-heatmap-0 border-2 border-theme-accent text-theme-accent'
        : 'bg-heatmap-0 border border-theme-border/60 hover:border-theme-border-strong text-theme-muted';
    }
    if (count <= 2) {
      return 'bg-heatmap-1 border border-heatmap-2 text-theme-text hover:scale-115';
    }
    if (count <= 5) {
      return 'bg-heatmap-2 border border-heatmap-3 text-white hover:scale-115';
    }
    if (count <= 8) {
      return 'bg-heatmap-3 border border-heatmap-4 text-white hover:scale-115';
    }
    return 'bg-heatmap-4 border border-theme-border-strong text-white font-bold hover:scale-115 ring-1 ring-theme-accent';
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
    <div className="w-full max-w-full p-4 sm:p-5 rounded-xs bg-theme-surface border border-theme-border shadow-[2px_2px_0px_var(--theme-border-strong)] text-left select-none relative overflow-hidden animate-fade-in font-sans">
      
      {/* Top Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme-border mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-theme-text text-sm sm:text-base tracking-tight">
              Bản đồ chăm chỉ (Study Heatmap)
            </h3>
          </div>
          <p className="text-[11px] text-theme-muted mt-0.5">
            {rangeMonths === 1
              ? 'Tổng kết 30 ngày (1 tháng) nỗ lực học tập'
              : rangeMonths === 6
              ? 'Tổng kết 180 ngày (6 tháng) nỗ lực học tập'
              : 'Tổng kết 365 ngày (12 tháng / 1 năm) nỗ lực học tập'}
          </p>
        </div>

        {/* Range Buttons & Quick Add */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Control: 1 tháng | 6 tháng | 12 tháng */}
          <div className="flex items-center p-0.5 bg-theme-subtle rounded-xs text-xs font-mono border border-theme-border">
            <button
              type="button"
              onClick={() => setRangeMonths(1)}
              className={`px-2.5 py-1 rounded-xs transition-all ${
                rangeMonths === 1
                  ? 'bg-theme-surface text-theme-text font-bold shadow-xs'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              1 tháng
            </button>
            <button
              type="button"
              onClick={() => setRangeMonths(6)}
              className={`px-2.5 py-1 rounded-xs transition-all ${
                rangeMonths === 6
                  ? 'bg-theme-surface text-theme-text font-bold shadow-xs'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              6 tháng
            </button>
            <button
              type="button"
              onClick={() => setRangeMonths(12)}
              className={`px-2.5 py-1 rounded-xs transition-all ${
                rangeMonths === 12
                  ? 'bg-theme-surface text-theme-text font-bold shadow-xs'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              12 tháng
            </button>
          </div>

          <button
            type="button"
            onClick={handleQuickAddToday}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-theme-accent hover:bg-theme-accent-hover text-white font-semibold text-xs border border-theme-border-strong shadow-[1px_1px_0px_var(--theme-border-strong)] transition-all cursor-pointer"
            title="Ghi nhận ngay 1 lượt học tập hôm nay"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+1 Hoạt động</span>
          </button>
        </div>
      </div>

      {/* 4 Chỉ số KPI Thống kê tối giản */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 relative z-10">
        <div className="p-2.5 rounded-xs bg-theme-subtle/50 border border-theme-border flex items-center gap-2.5">
          <div className="p-2 rounded-xs bg-theme-surface text-theme-accent shrink-0 border border-theme-border">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-theme-muted font-mono uppercase tracking-wider block">
              Streak liên tục
            </span>
            <span className="text-sm font-serif font-bold text-theme-text truncate block">
              {streak} ngày
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xs bg-theme-subtle/50 border border-theme-border flex items-center gap-2.5">
          <div className="p-2 rounded-xs bg-theme-surface text-theme-success shrink-0 border border-theme-border">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-theme-muted font-mono uppercase tracking-wider block">
              Tổng lượt học
            </span>
            <span className="text-sm font-serif font-bold text-theme-text truncate block">
              {stats.totalActivities} lượt
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xs bg-theme-subtle/50 border border-theme-border flex items-center gap-2.5">
          <div className="p-2 rounded-xs bg-theme-surface text-theme-muted shrink-0 border border-theme-border">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-theme-muted font-mono uppercase tracking-wider block">
              Ngày tích cực
            </span>
            <span className="text-sm font-serif font-bold text-theme-text truncate block">
              {stats.totalActiveDays} ngày
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xs bg-theme-subtle/50 border border-theme-border flex items-center gap-2.5">
          <div className="p-2 rounded-xs bg-theme-surface text-theme-muted shrink-0 border border-theme-border">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] text-theme-muted font-mono uppercase tracking-wider block">
              Kỷ lục ngày
            </span>
            <span className="text-sm font-serif font-bold text-theme-text truncate block">
              {stats.maxDayCount} bài / ngày
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-theme-border text-[11px] text-theme-muted relative z-10 font-mono">
        <div className="flex items-center gap-2 min-h-[28px]">
          {hoveredDay ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-theme-subtle text-theme-text border border-theme-border shadow-xs animate-fade-in font-medium">
              <span className="font-bold text-theme-text font-serif">
                {hoveredDay.dayOfWeekName}, {new Date(hoveredDay.dateStr).toLocaleDateString('vi-VN')}
              </span>
              <span>•</span>
              {hoveredDay.isFuture ? (
                <span className="text-theme-muted">(Ngày tương lai)</span>
              ) : hoveredDay.count > 0 ? (
                <span className="text-theme-accent font-bold flex items-center gap-1">
                  {hoveredDay.count} hoạt động
                </span>
              ) : (
                <span className="text-theme-muted">Chưa có hoạt động</span>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1.5 text-theme-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-theme-success shrink-0" />
              <span>Chạm vào ô để xem chi tiết hoạt động</span>
            </span>
          )}
        </div>

        {/* Chú giải cấp độ màu 5 bậc Semantic Heatmap */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto font-medium text-xs">
          <span className="text-[10px] text-theme-muted">Ít</span>
          <div
            className="w-3 h-3 rounded-xs bg-heatmap-0 border border-theme-border/60"
            title="0 hoạt động"
          />
          <div
            className="w-3 h-3 rounded-xs bg-heatmap-1 border border-heatmap-2"
            title="1 - 2 hoạt động"
          />
          <div
            className="w-3 h-3 rounded-xs bg-heatmap-2 border border-heatmap-3"
            title="3 - 5 hoạt động"
          />
          <div
            className="w-3 h-3 rounded-xs bg-heatmap-3 border border-heatmap-4"
            title="6 - 8 hoạt động"
          />
          <div
            className="w-3 h-3 rounded-xs bg-heatmap-4 border border-theme-border-strong"
            title="9+ hoạt động"
          />
          <span className="text-[10px] text-theme-muted">Nhiều</span>
        </div>
      </div>
    </div>
  );
};
