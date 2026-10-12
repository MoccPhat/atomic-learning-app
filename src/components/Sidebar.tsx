import React from 'react';
import {
  Layers,
  Code,
  Globe,
  BookOpen,
  Award,
  Plus,
  Play,
  Settings,
  Flame,
  ChevronLeft,
  X,
  GraduationCap,
  FolderTree,
  Clock,
  Trash2,
  ScanText,
  FileText,
  Compass,
  Lightbulb,
  Bookmark,
  Trophy,
  Network,
  Target,
  Sparkles,
  HeartHandshake,
  BookMarked,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { Category } from '../lib/types';
import { KaiLogo } from './KaiLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner' | 'cornell' | 'advisor' | 'feynman' | 'cheatsheet' | 'mindmap';
  onSelectTab: (tab: 'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner' | 'cornell' | 'advisor' | 'feynman' | 'cheatsheet' | 'mindmap') => void;
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

const CATEGORIES: { key: Category | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', label: 'Tất cả thẻ', icon: <Layers className="w-4 h-4" />, color: 'text-slate-600 dark:text-slate-400' },
  { key: 'code', label: 'Lập trình', icon: <Code className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'english', label: 'Ngoại ngữ', icon: <Globe className="w-4 h-4" />, color: 'text-sky-600 dark:text-sky-400' },
  { key: 'book', label: 'Đọc sách', icon: <BookOpen className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'exam', label: 'Ôn thi chứng chỉ', icon: <Award className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  selectedCategory,
  onSelectCategory,
  cardCounts,
  quizCount,
  totalTreeFiles,
  dueCount,
  dueCountsByCategory,
  streak,
  onStartReview,
  onOpenQuickCapture,
  onOpenSettings,
  onOpenDeleteCategory,
  onOpenAchievements,
  onOpenMistakes,
  onOpenCardGenerator,
  onOpenFeedback,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - Glassmorphic Spatial Style */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <KaiLogo size={36} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight block">
                  Auto Learning
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-brand-500 to-indigo-500 text-white uppercase tracking-wider font-mono shadow-xs">
                  PRO
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                Workspace Tổng Hợp
              </span>
            </div>
          </div>

          {/* Nút đóng / thu gọn */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Thu gọn menu"
          >
            <ChevronLeft className="w-5 h-5 hidden lg:block" />
            <X className="w-5 h-5 lg:hidden" />
          </button>
        </div>

        {/* Quick Action Primary Button */}
        <div className="p-3.5 space-y-2">
          {dueCount > 0 ? (
            <button
              onClick={() => {
                onStartReview(selectedCategory);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 active:scale-98 text-white font-black text-xs shadow-md shadow-brand-500/25 transition-all group"
              title={selectedCategory !== 'all' ? `Ôn tập thẻ mục ${selectedCategory}` : 'Ôn tập tất cả thẻ'}
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                <span>
                  {selectedCategory !== 'all' && CATEGORIES.find((c) => c.key === selectedCategory)?.label
                    ? `Ôn ${CATEGORIES.find((c) => c.key === selectedCategory)?.label}`
                    : 'Ôn tập ngay'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[11px] font-mono font-black shadow-xs">
                {selectedCategory !== 'all' && dueCountsByCategory
                  ? dueCountsByCategory[selectedCategory] || 0
                  : dueCount}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenQuickCapture();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-750 active:scale-98 text-white font-bold text-xs shadow-sm transition-all border border-slate-700/50"
            >
              <Plus className="w-4 h-4 text-brand-400" />
              <span>Thêm thẻ mới (Ctrl+K)</span>
            </button>
          )}
        </div>

        {/* Navigation Section: Tổ chức theo 3 Không Gian Chuẩn Quốc Tế */}
        <div className="flex-1 px-3 py-1 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* KHÔNG GIAN 1: REMNOTE SPACE (GHI NHỚ & TÀI LIỆU) */}
          <div className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5" />
                <span>Ghi Nhớ & Đọc (RemNote)</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                SRS & Vault
              </span>
            </div>

            {/* Thẻ Flashcard & Categories */}
            <div className="space-y-0.5 pt-0.5">
              {CATEGORIES.map((cat) => {
                const isSelected = activeTab === 'cards' && selectedCategory === cat.key;
                const count = cardCounts[cat.key] || 0;
                const catDue = dueCountsByCategory ? dueCountsByCategory[cat.key] || 0 : 0;

                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      onSelectTab('cards');
                      onSelectCategory(cat.key);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : cat.color}>
                        {cat.icon}
                      </span>
                      <span className="truncate">{cat.label}</span>
                    </div>

                    {catDue > 0 ? (
                      <span
                        className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-brand-500 text-slate-950 font-mono shadow-xs"
                        title={`${catDue} thẻ đến hạn cần ôn (tổng ${count} thẻ)`}
                      >
                        {catDue}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        0
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Cây Lưu Trữ Tài Liệu Vault */}
              <button
                onClick={() => {
                  onSelectTab('tree');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'tree'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'tree' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-500'}>
                    <FolderTree className="w-4 h-4" />
                  </span>
                  <span>Cây tài liệu (Vault)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {totalTreeFiles} file
                </span>
              </button>

              {/* Ghi chú Cornell */}
              <button
                onClick={() => {
                  onSelectTab('cornell');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'cornell'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'cornell' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-500'}>
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>Ghi chú Cornell (3 Vùng)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100/80 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                  Notes
                </span>
              </button>

              {/* Quét tài liệu OCR Scanner */}
              <button
                onClick={() => {
                  onSelectTab('scanner');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'scanner'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'scanner' ? 'text-indigo-600 dark:text-indigo-400' : 'text-sky-500'}>
                    <ScanText className="w-4 h-4" />
                  </span>
                  <span>Quét tài liệu (OCR)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100/80 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
                  Vision
                </span>
              </button>
            </div>
          </div>

          {/* KHÔNG GIAN 2: HEPTABASE SPACE (TƯ DUY KHÔNG GIAN & BẢN ĐỒ) */}
          <div className="space-y-1 pt-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Tư Duy Không Gian (Heptabase)</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                Visual
              </span>
            </div>

            <div className="space-y-0.5 pt-0.5">
              {/* Sơ đồ tư duy MindMap Studio */}
              <button
                onClick={() => {
                  onSelectTab('mindmap');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'mindmap'
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'mindmap' ? 'text-teal-600 dark:text-teal-400' : 'text-teal-500'}>
                    <Network className="w-4 h-4" />
                  </span>
                  <span>Sơ đồ tư duy (Mindmap)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-100/80 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono">
                  Canvas
                </span>
              </button>

              {/* Phản biện Feynman Studio */}
              <button
                onClick={() => {
                  onSelectTab('feynman');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'feynman'
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'feynman' ? 'text-teal-600 dark:text-teal-400' : 'text-purple-500'}>
                    <Lightbulb className="w-4 h-4" />
                  </span>
                  <span>Phản biện Feynman</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100/80 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                  Socratic
                </span>
              </button>

              {/* Sổ tay công thức CheatSheet */}
              <button
                onClick={() => {
                  onSelectTab('cheatsheet');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'cheatsheet'
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'cheatsheet' ? 'text-teal-600 dark:text-teal-400' : 'text-emerald-500'}>
                    <Bookmark className="w-4 h-4" />
                  </span>
                  <span>Sổ tay công thức & Lệnh</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                  Tra cứu
                </span>
              </button>
            </div>
          </div>

          {/* KHÔNG GIAN 3: BRILLIANT SPACE (LUYỆN TẬP & PHẢN XẠ) */}
          <div className="space-y-1 pt-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Luyện Tập & Thói Quen (Brilliant)</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Practice
              </span>
            </div>

            <div className="space-y-0.5 pt-0.5">
              {/* Bộ đề trắc nghiệm */}
              <button
                onClick={() => {
                  onSelectTab('quiz');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'quiz' ? 'text-amber-600 dark:text-amber-400' : 'text-purple-500'}>
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <span>Phòng thi trắc nghiệm</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {quizCount} đề
                </span>
              </button>

              {/* Sổ tay lỗi sai */}
              {onOpenMistakes && (
                <button
                  onClick={() => {
                    onOpenMistakes();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60"
                  title="Xem sổ tay tổng hợp các câu làm sai và ôn tập phục thù"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-500" />
                    <span>Sổ lỗi sai phục thù</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100/80 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                    Smart
                  </span>
                </button>
              )}

              {/* Đồng hồ Pomodoro & Focus Pet */}
              <button
                onClick={() => {
                  onSelectTab('pomodoro');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'pomodoro'
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'pomodoro' ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500'}>
                    <Clock className="w-4 h-4" />
                  </span>
                  <span>Đồng hồ Pomodoro</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100/80 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                  Focus
                </span>
              </button>

              {/* Lộ trình & Cảnh báo Study Advisor */}
              <button
                onClick={() => {
                  onSelectTab('advisor');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'advisor'
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeTab === 'advisor' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-500'}>
                    <Compass className="w-4 h-4" />
                  </span>
                  <span>Trợ lý lộ trình & Thói quen</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                  Advisor
                </span>
              </button>
            </div>
          </div>

          {/* Section: TIỆN ÍCH HỆ THỐNG */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Hệ thống</span>
            </div>

            <nav className="space-y-0.5">
              {onOpenCardGenerator && (
                <button
                  onClick={() => {
                    onOpenCardGenerator();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  title="Biến tài liệu thô thành Flashcards và đề Quiz nhanh chóng"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>1-Click Tạo thẻ & Quiz AI</span>
                </button>
              )}

              {onOpenDeleteCategory && (
                <button
                  onClick={() => {
                    onOpenDeleteCategory();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Xóa theo 1 danh mục hoặc xóa tất cả thẻ"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Quản lý & Dọn dẹp thẻ</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenSettings();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Cài đặt & Giao diện</span>
              </button>

              {onOpenFeedback && (
                <button
                  onClick={() => {
                    onOpenFeedback();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                  title="Gửi đánh giá trải nghiệm hoặc báo cáo lỗi trực tiếp cho tác giả"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>Đánh giá & Báo lỗi</span>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Streak & Thành Tích (Brilliant Gamification) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block leading-tight">Chuỗi học tập</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">{streak} ngày liên tục</span>
              </div>
            </div>
            {onOpenAchievements && (
              <button
                onClick={() => {
                  onOpenAchievements();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all active:scale-95"
                title="Xem Cột Mốc Thành Tựu & Huy Hiệu Vinh Danh"
              >
                <Trophy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
