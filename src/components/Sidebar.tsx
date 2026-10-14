import React, { useState } from 'react';
import {
  Home,
  BookOpen,
  BarChart3,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  X,
  FileText,
  Network,
  Lightbulb,
  Layers,
  ScanText,
  Clock,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Settings,
  Trophy,
  Trash2,
  HeartHandshake,
  Wand2,
  Compass,
} from 'lucide-react';
import { Category } from '../lib/types';
import { KaiLogo } from './KaiLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  selectedCategory: Category | 'all';
  onSelectCategory: (cat: Category | 'all') => void;
  cardCounts: Record<Category | 'all', number>;
  quizCount: number;
  totalTreeFiles: number;
  dueCount: number;
  dueCountsByCategory?: Record<Category | 'all', number>;
  streak: number;
  onStartReview: (category?: Category | 'all') => void;
  onOpenQuickCapture: () => void;
  onOpenSettings: () => void;
  onOpenDeleteCategory?: () => void;
  onOpenAchievements?: () => void;
  onOpenMistakes?: () => void;
  onOpenCardGenerator?: () => void;
  onOpenFeedback?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenDeleteCategory,
  onOpenAchievements,
  onOpenMistakes,
  onOpenCardGenerator,
  onOpenFeedback,
  quizCount,
  totalTreeFiles,
}) => {
  const isStudioActive = [
    'cornell',
    'mindmap',
    'feynman',
    'cheatsheet',
    'scanner',
    'pomodoro',
    'quiz',
  ].includes(activeTab);

  const [isStudiosExpanded, setIsStudiosExpanded] = useState<boolean>(isStudioActive);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (Learnly Style: Fixed left, clean white / dark slate, soft border) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out select-none font-sans ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand Header & Navigation List */}
        <div className="p-5 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Brand Logo: Learnly */}
          <div className="flex items-center justify-between pb-5">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => {
                onSelectTab('cards');
                if (window.innerWidth < 1024) onClose();
              }}
            >
              <KaiLogo size={32} />
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
                Learnly
              </span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Menu Items */}
          <nav className="space-y-1">
            {/* 1. Tổng quan (Dashboard) */}
            <button
              onClick={() => {
                onSelectTab('cards');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-[#E6F4EA] dark:bg-[#0D6E4F]/20 text-[#0D6E4F] dark:text-[#34D399]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Tổng quan</span>
            </button>

            {/* 2. Trợ lý lộ trình (Advisor & Roadmap) */}
            <button
              onClick={() => {
                onSelectTab('advisor');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'advisor'
                  ? 'bg-[#E6F4EA] dark:bg-[#0D6E4F]/20 text-[#0D6E4F] dark:text-[#34D399]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Trợ lý lộ trình</span>
            </button>

            {/* 3. Thư viện (Vault / Tree) */}
            <button
              onClick={() => {
                onSelectTab('tree');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tree'
                  ? 'bg-[#E6F4EA] dark:bg-[#0D6E4F]/20 text-[#0D6E4F] dark:text-[#34D399]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" />
                <span>Thư viện</span>
              </div>
              {totalTreeFiles > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                  {totalTreeFiles}
                </span>
              )}
            </button>

            {/* 3. Tiến độ (Heatmap & Analytics) */}
            <button
              onClick={() => {
                onSelectTab('heatmap');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'heatmap'
                  ? 'bg-[#E6F4EA] dark:bg-[#0D6E4F]/20 text-[#0D6E4F] dark:text-[#34D399]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tiến độ & Nhiệt</span>
            </button>

            {/* 4. Lịch học (Deadlines & Calendar) */}
            <button
              onClick={() => {
                onSelectTab('deadlines');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'deadlines'
                  ? 'bg-[#E6F4EA] dark:bg-[#0D6E4F]/20 text-[#0D6E4F] dark:text-[#34D399]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch & Deadline</span>
            </button>
          </nav>

          {/* Section: Không gian học chuyên sâu (Studios) */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setIsStudiosExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-wider"
            >
              <span>Không gian học</span>
              {isStudiosExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {isStudiosExpanded && (
              <div className="space-y-0.5 mt-1 animate-fade-in">
                {/* Cornell */}
                <button
                  onClick={() => {
                    onSelectTab('cornell');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'cornell'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ghi chú Cornell</span>
                </button>

                {/* Mindmap */}
                <button
                  onClick={() => {
                    onSelectTab('mindmap');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'mindmap'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sơ đồ tư duy</span>
                </button>

                {/* Feynman */}
                <button
                  onClick={() => {
                    onSelectTab('feynman');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'feynman'
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                  <span>Kỹ thuật Feynman</span>
                </button>

                {/* CheatSheet */}
                <button
                  onClick={() => {
                    onSelectTab('cheatsheet');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'cheatsheet'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sổ tay tổng hợp</span>
                </button>

                {/* Pomodoro */}
                <button
                  onClick={() => {
                    onSelectTab('pomodoro');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'pomodoro'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Đồng hồ Pomodoro</span>
                </button>

                {/* Scanner OCR */}
                <button
                  onClick={() => {
                    onSelectTab('scanner');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'scanner'
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <ScanText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Quét OCR tài liệu</span>
                </button>

                {/* Quiz Master */}
                <button
                  onClick={() => {
                    onSelectTab('quiz');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'quiz'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bộ đề thi trắc nghiệm</span>
                  </div>
                  {quizCount > 0 && (
                    <span className="text-[10px] px-1 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-mono">
                      {quizCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Hệ thống & Tiện ích */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 relative">
          {/* Backdrop for Popover */}
          {isProfileMenuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsProfileMenuOpen(false)}
            />
          )}

          {/* User Options Popover Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-14 right-3 left-3 z-50 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 space-y-0.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
              {onOpenAchievements && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenAchievements();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Cột mốc & Thành tựu</span>
                </button>
              )}

              {onOpenMistakes && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenMistakes();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Sổ tay câu sai</span>
                </button>
              )}

              {onOpenCardGenerator && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenCardGenerator();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-amber-500" />
                  <span>Tạo thẻ & Quiz AI</span>
                </button>
              )}

              {onOpenDeleteCategory && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenDeleteCategory();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Quản lý & Dọn dẹp thẻ</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Cài đặt & Giao diện</span>
              </button>

              {onOpenFeedback && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenFeedback();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-400" />
                  <span>Đánh giá & Báo lỗi</span>
                </button>
              )}
            </div>
          )}

          {/* Quick System Actions Row */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              onClick={onOpenSettings}
              className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              title="Mở Cài đặt hệ thống & Giao diện"
            >
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">Cài đặt hệ thống</span>
            </button>

            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isProfileMenuOpen
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Tiện ích mở rộng & Tùy chọn"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
