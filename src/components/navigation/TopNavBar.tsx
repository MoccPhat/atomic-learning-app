import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Menu,
  FilePlus,
  Wand2,
  ScanText,
  CalendarPlus,
  ChevronDown,
} from 'lucide-react';

interface TopNavBarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  streak: number;
  dueCount: number;
  quizCount: number;
  onOpenQuickCapture: () => void;
  onOpenSettings: () => void;
  onOpenFeedback?: () => void;
  onOpenAchievements?: () => void;
  onOpenMistakes?: () => void;
  onOpenCardGenerator?: () => void;
  onOpenAudioFlashcard?: () => void;
  onOpenDeadlines?: () => void;
  onOpenScanner?: () => void;
  onToggleSidebar?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  dueCount,
  onOpenQuickCapture,
  onOpenAchievements,
  onOpenCardGenerator,
  onOpenScanner,
  onOpenDeadlines,
  onToggleSidebar,
  searchQuery = '',
  onSearchChange,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-8 h-16 flex items-center justify-between transition-colors select-none">
      
      {/* Left: Mobile Menu Toggle + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors cursor-pointer"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Pill Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm môn học, ghi chú, tài liệu..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-12 py-2 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0D6E4F] focus:border-[#0D6E4F] transition-all"
          />
          <div className="absolute right-3 top-2 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono font-medium text-slate-400">
            ⌘K
          </div>
        </div>
      </div>

      {/* Right: Notification Bell + Primary "+ Thêm mới" Button */}
      <div className="flex items-center gap-3">
        {/* Bell Notification */}
        <button
          onClick={onOpenAchievements}
          className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
          title={dueCount > 0 ? `${dueCount} thẻ cần ôn hôm nay (Bấm xem thành tựu)` : 'Thành tựu & Huy hiệu'}
        >
          <Bell className="w-4 h-4" />
          {dueCount > 0 ? (
            <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold font-mono flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {dueCount > 99 ? '99+' : dueCount}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#0D6E4F] absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* "+ Thêm mới" Dropdown Container */}
        <div className="relative" ref={addMenuRef}>
          <div className="inline-flex rounded-xl shadow-xs overflow-hidden">
            <button
              onClick={onOpenQuickCapture}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0D6E4F] hover:bg-[#0A573E] text-white transition-all active:scale-95 cursor-pointer"
              title="Thêm thẻ kiến thức mới (Ctrl + K)"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>
            <button
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
              className="px-2 py-2 bg-[#0D6E4F] hover:bg-[#0A573E] border-l border-emerald-800/40 text-white transition-colors cursor-pointer"
              title="Mở rộng tùy chọn thêm mới"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dropdown Menu */}
          {isAddMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 space-y-0.5 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onOpenQuickCapture();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
              >
                <FilePlus className="w-4 h-4 text-[#0D6E4F]" />
                <div className="text-left">
                  <div className="font-semibold">Thẻ ghi nhớ mới</div>
                  <div className="text-[10px] text-slate-400">Tạo thẻ thủ công (Ctrl + K)</div>
                </div>
              </button>

              {onOpenCardGenerator && (
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onOpenCardGenerator();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  <div className="text-left">
                    <div className="font-semibold">Sinh thẻ & Đề Quiz AI</div>
                    <div className="text-[10px] text-slate-400">Từ file văn bản hoặc ảnh</div>
                  </div>
                </button>
              )}

              {onOpenScanner && (
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onOpenScanner();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  <ScanText className="w-4 h-4 text-blue-500" />
                  <div className="text-left">
                    <div className="font-semibold">Quét OCR tài liệu</div>
                    <div className="text-[10px] text-slate-400">Bóc tách ảnh sách / đề thi</div>
                  </div>
                </button>
              )}

              {onOpenDeadlines && (
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onOpenDeadlines();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 text-rose-500" />
                  <div className="text-left">
                    <div className="font-semibold">Hạn nộp & Deadline</div>
                    <div className="text-[10px] text-slate-400">Tạo mốc thời gian bài tập</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
