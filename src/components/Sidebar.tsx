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
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden transition-opacity animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <KaiLogo size={36} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight block">
                  Auto Learning
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 uppercase tracking-wider font-mono">
                  KAI
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                Hệ thống học tập PWA
              </span>
            </div>
          </div>

          {/* Nút đóng / thu gọn */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Thu gọn menu"
          >
            <ChevronLeft className="w-5 h-5 hidden lg:block" />
            <X className="w-5 h-5 lg:hidden" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 space-y-2">
          {dueCount > 0 ? (
            <button
              onClick={() => {
                onStartReview(selectedCategory);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
              title={selectedCategory !== 'all' ? `Ôn tập thẻ mục ${selectedCategory}` : 'Ôn tập tất cả thẻ'}
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {selectedCategory !== 'all' && CATEGORIES.find((c) => c.key === selectedCategory)?.label
                    ? `Ôn ${CATEGORIES.find((c) => c.key === selectedCategory)?.label}`
                    : 'Ôn tập thẻ ngay'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-98 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm thẻ mới</span>
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-2 overflow-y-auto space-y-6">
          {/* Section 1: Danh mục Thẻ Nguyên Tử */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Thẻ học tập (Cards)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono">{cardCounts.all} thẻ</span>
                {onOpenDeleteCategory && (
                  <button
                    onClick={() => {
                      onOpenDeleteCategory();
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Xóa theo 1 danh mục hoặc xóa tất cả thẻ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <nav className="space-y-1">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isSelected ? 'text-brand-600 dark:text-brand-400' : cat.color}>
                        {cat.icon}
                      </span>
                      <span>{cat.label}</span>
                    </div>

                    {catDue > 0 ? (
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-500 text-slate-950 font-mono shadow-xs"
                        title={`${catDue} thẻ đến hạn cần ôn (tổng ${count} thẻ)`}
                      >
                        {catDue}
                      </span>
                    ) : (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 font-mono"
                        title={`0 thẻ cần ôn (tổng ${count} thẻ)`}
                      >
                        0
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: LUYỆN THI TRẮC NGHIỆM */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Luyện thi (Quiz)</span>
              <span className="text-[10px] font-mono">{quizCount} đề</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('quiz');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'quiz' ? 'text-brand-600 dark:text-brand-400' : 'text-purple-600 dark:text-purple-400'}>
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <span>Bộ đề trắc nghiệm</span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    activeTab === 'quiz'
                      ? 'bg-brand-200/70 dark:bg-brand-900/70 text-brand-800 dark:text-brand-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {quizCount}
                </span>
              </button>

              {onOpenMistakes && (
                <button
                  onClick={() => {
                    onOpenMistakes();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60"
                  title="Xem sổ tay tổng hợp các câu làm sai và ôn tập phục thù"
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="w-4 h-4 text-rose-500" />
                    <span>Sổ tay lỗi sai</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                    Smart
                  </span>
                </button>
              )}
            </nav>
          </div>

          {/* Section 3: CÂY LƯU TRỮ TÀI LIỆU HỌC TẬP */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Tài liệu (Vault)</span>
              <span className="text-[10px] font-mono">{totalTreeFiles} file</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('tree');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'tree'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'tree' ? 'text-brand-600 dark:text-brand-400' : 'text-amber-500 dark:text-amber-400'}>
                    <FolderTree className="w-4 h-4" />
                  </span>
                  <span>Cây lưu trữ tài liệu</span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    activeTab === 'tree'
                      ? 'bg-brand-200/70 dark:bg-brand-900/70 text-brand-800 dark:text-brand-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {totalTreeFiles}
                </span>
              </button>
            </nav>
          </div>

          {/* Section: ĐỒNG HỒ TẬP TRUNG POMODORO */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Tập trung (Focus)</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('pomodoro');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'pomodoro'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'pomodoro' ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500'}>
                    <Clock className="w-4 h-4" />
                  </span>
                  <span>Đồng hồ Pomodoro</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                  25p
                </span>
              </button>
            </nav>
          </div>

          {/* Section: QUÉT TÀI LIỆU SCANNER AI */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Công cụ AI (Scanner)</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('scanner');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'scanner'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'scanner' ? 'text-brand-600 dark:text-brand-400' : 'text-indigo-600 dark:text-indigo-400'}>
                    <ScanText className="w-4 h-4" />
                  </span>
                  <span>Quét tài liệu (Scanner)</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-mono">
                  Vision AI
                </span>
              </button>
            </nav>
          </div>

          {/* Section: GHI CHÚ CORNELL */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Phương pháp ghi chép</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('cornell');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'cornell'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'cornell' ? 'text-brand-600 dark:text-brand-400' : 'text-amber-500'}>
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>Ghi chú Cornell</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                  3 Vùng
                </span>
              </button>
            </nav>
          </div>

          {/* Section: TƯ DUY & TRỰC QUAN */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Tư duy & Trực quan</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('mindmap');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'mindmap'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'mindmap' ? 'text-brand-600 dark:text-brand-400' : 'text-indigo-500'}>
                    <Network className="w-4 h-4" />
                  </span>
                  <span>Sơ đồ tư duy (Mindmap)</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                  Visual
                </span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('feynman');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'feynman'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'feynman' ? 'text-purple-600 dark:text-purple-400' : 'text-purple-500'}>
                    <Lightbulb className="w-4 h-4" />
                  </span>
                  <span>Phản biện Feynman</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                  Socratic
                </span>
              </button>
            </nav>
          </div>

          {/* Section: TRỢ LÝ LỘ TRÌNH SMART ADVISOR */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Kế hoạch & Lộ trình</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('advisor');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'advisor'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'advisor' ? 'text-brand-600 dark:text-brand-400' : 'text-blue-500'}>
                    <Compass className="w-4 h-4" />
                  </span>
                  <span>Lộ trình & Cảnh báo</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                  Smart
                </span>
              </button>
            </nav>
          </div>

          {/* Section: SỔ TAY TRA CỨU CÔNG THỨC CHEAT SHEET */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Tra cứu bỏ túi (Cheat Sheet)</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onSelectTab('cheatsheet');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'cheatsheet'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === 'cheatsheet' ? 'text-brand-600 dark:text-brand-400' : 'text-teal-500'}>
                    <Bookmark className="w-4 h-4" />
                  </span>
                  <span>Sổ tay công thức</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono">
                  Tra cứu
                </span>
              </button>
            </nav>
          </div>

          {/* Section 4: Tiện ích hệ thống */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Hệ thống</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  onOpenQuickCapture();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Thu thập thẻ mới</span>
              </button>

              {onOpenCardGenerator && (
                <button
                  onClick={() => {
                    onOpenCardGenerator();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  title="Biến tài liệu thô thành Flashcards và đề Quiz nhanh chóng"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>1-Click Tạo thẻ & Quiz AI</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenSettings();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                  title="Gửi đánh giá trải nghiệm hoặc báo cáo lỗi trực tiếp cho tác giả (phat7971@gmail.com)"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>Đánh giá & Báo lỗi</span>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Streak & Status */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold block">Thói quen học</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">{streak} ngày liên tục</span>
              </div>
            </div>
            {onOpenAchievements && (
              <button
                onClick={() => {
                  onOpenAchievements();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors"
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
