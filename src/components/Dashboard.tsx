import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  Play,
  Settings,
  Search,
  Sparkles,
  Trash2,
  Calendar,
  Clock,
  Menu,
  X,
  ScanText,
  FileText,
  Compass,
  Trophy,
  Network,
  AlertTriangle,
  Wand2,
  Headphones,
  HeartHandshake,
  Code,
  Globe,
  BookOpen,
  Award,
  BookMarked,
  BrainCircuit,
  Zap,
  ChevronRight,
  GraduationCap,
  FolderTree,
  Lightbulb,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { Card, Category, UserStats } from '../lib/types';
import { isCardDue, getDueCountsByCategory } from '../lib/srs-engine';
import { deleteCard, deleteCardsByCategory } from '../lib/storage';
import { countTotalFilesInTree } from '../lib/tree-storage';
import { StudyHeatmap } from './analytics/StudyHeatmap';
import { DeadlineManager } from './deadlines/DeadlineManager';
import { DeleteCategoryModal } from './categories/DeleteCategoryModal';
import { TreeData } from '../lib/tree-types';
import { KaiLogo } from './KaiLogo';

interface DashboardProps {
  cards: Card[];
  stats: UserStats;
  selectedCategory: Category | 'all';
  onSelectCategory: (cat: Category | 'all') => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onStartReview: (category?: Category | 'all') => void;
  onOpenQuickCapture: () => void;
  onOpenSettings: () => void;
  onCardDeleted: (cardId?: string) => void;
  treeData?: TreeData;
  onActivityLogged?: () => void;
  onOpenPomodoro?: () => void;
  onOpenDeleteCategory?: () => void;
  onOpenScanner?: () => void;
  onOpenCornell?: () => void;
  onOpenAdvisor?: () => void;
  onOpenAchievements?: () => void;
  onOpenMindmap?: () => void;
  onOpenMistakes?: () => void;
  onOpenCardGenerator?: () => void;
  onOpenAudioFlashcard?: () => void;
  onOpenFeedback?: () => void;
}

const CATEGORY_NAMES: Record<Category | 'all', string> = {
  all: 'Tất cả thẻ',
  code: 'Lập trình',
  english: 'Ngoại ngữ',
  book: 'Đọc sách',
  exam: 'Ôn thi chứng chỉ',
};

const REVIEW_CATEGORIES: {
  key: Category;
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  gradientClass: string;
}[] = [
  {
    key: 'code',
    label: 'Lập trình',
    icon: <Code className="w-4 h-4" />,
    bgClass: 'bg-indigo-500/20',
    textClass: 'text-indigo-400',
    gradientClass: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30',
  },
  {
    key: 'english',
    label: 'Ngoại ngữ',
    icon: <Globe className="w-4 h-4" />,
    bgClass: 'bg-sky-500/20',
    textClass: 'text-sky-400',
    gradientClass: 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
  },
  {
    key: 'book',
    label: 'Đọc sách',
    icon: <BookOpen className="w-4 h-4" />,
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    gradientClass: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
  },
  {
    key: 'exam',
    label: 'Ôn thi',
    icon: <Award className="w-4 h-4" />,
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    gradientClass: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
  },
];

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  stats,
  selectedCategory,
  onSelectCategory,
  onToggleSidebar,
  onStartReview,
  onOpenQuickCapture,
  onOpenSettings,
  onCardDeleted,
  treeData,
  onActivityLogged,
  onOpenPomodoro,
  onOpenDeleteCategory,
  onOpenScanner,
  onOpenCornell,
  onOpenAdvisor,
  onOpenAchievements,
  onOpenMindmap,
  onOpenMistakes,
  onOpenCardGenerator,
  onOpenAudioFlashcard,
  onOpenFeedback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);

  // Tính số lượng thẻ đến hạn theo danh mục (SRS SM-2)
  const dueCounts = useMemo(() => getDueCountsByCategory(cards), [cards]);
  const dueCards = useMemo(() => cards.filter((c) => isCardDue(c)), [cards]);

  const categoryTotals = useMemo(() => {
    return {
      all: cards.length,
      code: cards.filter((c) => c.category === 'code').length,
      english: cards.filter((c) => c.category === 'english').length,
      book: cards.filter((c) => c.category === 'book').length,
      exam: cards.filter((c) => c.category === 'exam').length,
    };
  }, [cards]);

  // Bộ lọc tìm kiếm và danh mục
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchCategory = selectedCategory === 'all' || card.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [cards, selectedCategory, searchQuery]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa thẻ kiến thức này?')) {
      deleteCard(id);
      onCardDeleted(id);
    }
  };

  const handleQuickDeleteCurrentCategory = () => {
    if (selectedCategory === 'all') return;
    const count = categoryTotals[selectedCategory];
    if (count === 0) return;
    const catName = CATEGORY_NAMES[selectedCategory];
    if (window.confirm(`Bạn có chắc muốn xóa tất cả ${count} thẻ trong danh mục "${catName}" không?`)) {
      deleteCardsByCategory(selectedCategory);
      onCardDeleted();
    }
  };

  const handleBatchDeleted = () => {
    onCardDeleted();
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-5 select-none animate-fade-in space-y-7">
      {/* 1. TOP HEADER: Glassmorphic Floating Header (Heptabase + RemNote Style) */}
      <header className="sticky top-2 z-30 flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
            title="Ẩn / Hiện menu danh mục"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">Không Gian</span>
          </button>

          <div className="flex items-center gap-2.5">
            <KaiLogo size={34} />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  Auto Learning
                </h1>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 text-white uppercase tracking-wider font-mono">
                  WORKSPACE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold hidden md:block">
                RemNote • Heptabase • Brilliant Converged
              </p>
            </div>
          </div>
        </div>

        {/* Thanh công cụ hành động nhanh */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Streak & Achievements Badge (Brilliant Gamification) */}
          <button
            onClick={onOpenAchievements}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-black shadow-xs hover:border-amber-400 transition-all active:scale-95"
            title="Xem Cột Mốc Thành Tựu & Huy Hiệu Vinh Danh"
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{stats.streak} ngày</span>
            <Trophy className="w-3.5 h-3.5 text-amber-500 ml-0.5 hidden sm:inline" />
          </button>

          {/* Quick Capture Button (RemNote Fast Capture) */}
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
            title="Thêm thẻ kiến thức mới (Ctrl + K / Ctrl + Enter)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm thẻ</span>
          </button>

          {/* 1-Click Tạo Thẻ AI Button */}
          {onOpenCardGenerator && (
            <button
              onClick={onOpenCardGenerator}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-amber-950/40 dark:to-indigo-950/40 border border-amber-200/80 dark:border-amber-900/60 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs hover:border-amber-400 transition-all active:scale-95"
              title="Rút trích Flashcard & Quiz tự động từ tài liệu"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Tạo thẻ AI</span>
            </button>
          )}

          {/* Sổ Tay Lỗi Sai Phục Thù */}
          {onOpenMistakes && (
            <button
              onClick={onOpenMistakes}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs shadow-xs hover:border-rose-400 transition-all active:scale-95"
              title="Sổ Tay Lỗi Sai & Sát Hạch Phục Thù"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Sổ lỗi sai</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cài đặt & Giao diện"
          >
            <Settings className="w-5 h-5" />
          </button>

          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors hidden sm:block"
              title="Gửi đánh giá hoặc báo lỗi trực tiếp cho tác giả"
            >
              <HeartHandshake className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. HERO COMMAND CENTER: Brilliant Gamified Hero + RemNote Active Recall */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800/80">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold tracking-wide">
              <Clock className="w-3.5 h-3.5" />
              <span>Phiên Ôn Tập Hôm Nay</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {dueCards.length > 0 ? (
                <>
                  Có <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-300">{dueCards.length} thẻ kiến thức</span> đến hạn
                </>
              ) : (
                <>
                  Đã ôn tập xong toàn bộ thẻ hôm nay!
                </>
              )}
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {dueCards.length > 0
                ? 'Ôn tập các thẻ đến hạn để duy trì chuỗi ghi nhớ.'
                : 'Bạn đã hoàn thành các thẻ cần ôn tập.'}
            </p>
          </div>

          {/* Action Center Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {onOpenAudioFlashcard && cards.length > 0 && (
              <button
                type="button"
                onClick={onOpenAudioFlashcard}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 shadow-md transition-all active:scale-95 whitespace-nowrap"
                title="Nghe audio phát thanh câu hỏi & câu trả lời rảnh tay"
              >
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>Podcast Rảnh Tay</span>
              </button>
            )}

            <button
              onClick={() => onStartReview(selectedCategory)}
              disabled={selectedCategory === 'all' ? dueCards.length === 0 : categoryTotals[selectedCategory] === 0}
              className={`flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 whitespace-nowrap ${
                (selectedCategory === 'all' ? dueCards.length > 0 : categoryTotals[selectedCategory] > 0)
                  ? 'bg-gradient-to-r from-brand-400 to-emerald-400 hover:from-brand-300 hover:to-emerald-300 text-slate-950 shadow-brand-500/30 cursor-pointer scale-102 hover:scale-105'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {selectedCategory !== 'all'
                  ? (dueCounts[selectedCategory] > 0
                      ? `Ôn ${CATEGORY_NAMES[selectedCategory]} (${dueCounts[selectedCategory]} thẻ)`
                      : `Ôn luyện ${CATEGORY_NAMES[selectedCategory]}`)
                  : (dueCards.length > 0
                      ? `Ôn Tập Tất Cả (${dueCards.length} Thẻ)`
                      : 'Đã Thuộc Toàn Bộ')}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Lĩnh Vực Chuyên Môn: Bento Grid Cards (Heptabase Spatial Style) */}
        <div className="relative z-10 mt-7 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between gap-1 mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Ôn Theo Từng Lĩnh Vực Chuyên Môn</span>
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Bấm để tập trung ôn sâu từng chủ đề</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {REVIEW_CATEGORIES.map((cat) => {
              const catDue = dueCounts[cat.key] || 0;
              const catTotal = categoryTotals[cat.key] || 0;
              const hasDue = catDue > 0;
              const isSelected = selectedCategory === cat.key;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => onStartReview(cat.key)}
                  disabled={catTotal === 0}
                  className={`group relative p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                    catTotal === 0
                      ? 'opacity-35 cursor-not-allowed bg-slate-900/40 border-slate-800'
                      : isSelected
                      ? 'bg-gradient-to-br from-slate-800 to-indigo-950 border-brand-400 ring-2 ring-brand-500/30 shadow-lg'
                      : hasDue
                      ? `bg-slate-900/80 hover:bg-slate-850 border-slate-700/80 hover:border-slate-500 shadow-sm`
                      : 'bg-slate-900/50 hover:bg-slate-850 border-slate-800/80 opacity-80'
                  }`}
                  title={
                    catTotal === 0
                      ? `Chưa có thẻ trong mục ${cat.label}`
                      : `Bấm để ôn riêng mục ${cat.label} (${catDue} cần ôn / ${catTotal} thẻ)`
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-xl ${cat.bgClass} ${cat.textClass}`}>
                        {cat.icon}
                      </span>
                      <span className="font-bold text-xs text-slate-200 group-hover:text-white truncate">
                        {cat.label}
                      </span>
                    </div>
                    {hasDue ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-500 text-slate-950 font-mono shadow-xs">
                        {catDue}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {catTotal}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1 pt-1.5 border-t border-slate-800/80">
                    <span className="text-slate-400 text-[10px]">
                      {hasDue ? `${catDue} cần ôn` : `${catTotal} thẻ`}
                    </span>
                    <span className={`font-black text-[10px] flex items-center gap-1 ${
                      hasDue ? 'text-brand-400 group-hover:underline' : 'text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{hasDue ? 'Ôn ngay' : 'Xem thẻ'}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ambient Decorative Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 3. BENTO GRID 3 KHÔNG GIAN HỌC TẬP TOÀN CẦU (RemNote • Heptabase • Brilliant Converged Hubs) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Không Gian Học Tập</span>
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">3 Không gian chuyên biệt</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* HUB 1: REMNOTE (Ghi Nhớ & Đọc) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <BookMarked className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                  REMNOTE STYLE
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Ghi Nhớ & Tài Liệu
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Đọc tài liệu, ghi chú Cornell và quét OCR.
              </p>

              <div className="space-y-1.5">
                {onOpenCornell && (
                  <button
                    onClick={onOpenCornell}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ghi chú Cornell (3 Vùng)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}

                {onOpenScanner && (
                  <button
                    onClick={onOpenScanner}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ScanText className="w-3.5 h-3.5 text-sky-500" />
                      <span>Quét tài liệu AI (Scanner)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <FolderTree className="w-3 h-3 text-amber-500" />
                <span>{treeData ? countTotalFilesInTree(treeData) : 0} file tài liệu</span>
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Xem Vault ➔</span>
            </div>
          </div>

          {/* HUB 2: HEPTABASE (Tư Duy Không Gian & Bản Đồ) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <BrainCircuit className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono">
                  HEPTABASE STYLE
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Tư Duy & Bản Đồ
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Sơ đồ tư duy Mindmap, phản biện Feynman và tra cứu.
              </p>

              <div className="space-y-1.5">
                {onOpenMindmap && (
                  <button
                    onClick={onOpenMindmap}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Network className="w-3.5 h-3.5 text-teal-500" />
                      <span>Sơ đồ tư duy (MindMap Canvas)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}

                <button
                  onClick={() => onToggleSidebar()}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-purple-500" />
                    <span>Phản biện Feynman Socratic</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Bookmark className="w-3 h-3 text-emerald-500" />
                <span>CheatSheet tra cứu</span>
              </span>
              <span className="font-bold text-teal-600 dark:text-teal-400">Mở Canvas ➔</span>
            </div>
          </div>

          {/* HUB 3: BRILLIANT (Luyện Tập & Phản Xạ) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                  BRILLIANT STYLE
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Luyện Thi & Tập Trung
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Thi trắc nghiệm, sổ lỗi sai và đồng hồ Pomodoro.
              </p>

              <div className="space-y-1.5">
                {onOpenPomodoro && (
                  <button
                    onClick={onOpenPomodoro}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Pomodoro Focus (25 Phút)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}

                {onOpenAdvisor && (
                  <button
                    onClick={onOpenAdvisor}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-blue-500" />
                      <span>Trợ lý lộ trình & Thói quen</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <GraduationCap className="w-3 h-3 text-purple-500" />
                <span>Phòng thi Quiz Master</span>
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Vào Phòng Thi ➔</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVITY HEATMAP & DEADLINE TRACKER: Brilliant Gamification */}
      <section className="space-y-6">
        <StudyHeatmap
          historyMap={stats.historyMap}
          streak={stats.streak}
          onActivityLogged={onActivityLogged}
        />

        <DeadlineManager
          treeData={treeData}
          onActivityLogged={onActivityLogged}
        />
      </section>

      {/* 5. FILTER BAR & SEARCH: RemNote Structured Outliner Search */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Lọc danh mục:</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xs border border-transparent dark:border-slate-700">
              <span>{CATEGORY_NAMES[selectedCategory]}</span>
              <span className="text-[10px] text-slate-400 font-mono">({filteredCards.length})</span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => onSelectCategory('all')}
                  className="ml-1 p-0.5 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Xem tất cả thẻ"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={onToggleSidebar}
              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold ml-1 hover:underline"
            >
              Đổi danh mục ➔
            </button>

            {/* Nút Xóa Danh Mục / Xóa Tất Cả */}
            <button
              onClick={() => {
                if (onOpenDeleteCategory) {
                  onOpenDeleteCategory();
                } else {
                  setIsDeleteCategoryModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200/90 dark:border-rose-900/60 transition-all active:scale-95 shadow-xs ml-1"
              title="Quản lý xóa theo danh mục hoặc xóa tất cả thẻ"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn dẹp thẻ</span>
            </button>

            {selectedCategory !== 'all' && filteredCards.length > 0 && (
              <button
                onClick={handleQuickDeleteCurrentCategory}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={`Xóa nhanh toàn bộ ${filteredCards.length} thẻ trong mục ${CATEGORY_NAMES[selectedCategory]}`}
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa mục này ({filteredCards.length})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thẻ hoặc #tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-xs"
            />
          </div>
        </div>
      </section>

      {/* 6. SPATIAL CARDS GRID: Heptabase Visual Cards */}
      <section className="space-y-3 pb-8">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span>Thư viện thẻ kiến thức ({filteredCards.length})</span>
          <span>Click vào thẻ để xem phân tích 2 mặt</span>
        </div>

        {filteredCards.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-8 backdrop-blur-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có thẻ nào trong bộ lọc này</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Bấm nút "Thêm thẻ" ở góc trên hoặc dùng phím tắt Ctrl + K để bổ sung.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((card) => {
              const due = isCardDue(card);
              return (
                <div
                  key={card.id}
                  onClick={() => setPreviewCard(card)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        card.category === 'code' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' :
                        card.category === 'english' ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300' :
                        card.category === 'book' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {card.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {due ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> Cần ôn
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            <Calendar className="w-3 h-3" /> {card.interval}d
                          </span>
                        )}

                        <button
                          onClick={(e) => handleDelete(card.id, e)}
                          className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all"
                          title="Xóa thẻ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {card.front}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <div className="flex gap-1.5 overflow-hidden">
                      {card.tags.slice(0, 2).map((t) => (
                        <span key={t} className="truncate">#{t}</span>
                      ))}
                    </div>
                    <span className="font-mono text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-brand-500" />
                      <span>{card.repetitions} lần</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Preview Single Card */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Chi tiết thẻ kiến thức
              </span>
              <button
                onClick={() => setPreviewCard(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Đóng
              </button>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">{previewCard.title}</h3>
            
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Mặt trước (Vấn đề):</span>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium">{previewCard.front}</p>
            </div>

            <div className="mb-4 p-3.5 rounded-2xl bg-brand-50/40 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
              <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300 uppercase block mb-1">Mặt sau (Lời giải / Bản chất):</span>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">{previewCard.back}</p>
            </div>

            {previewCard.codeSnippet && (
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Đoạn code đính kèm:</span>
                <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800">
                  {previewCard.codeSnippet}
                </pre>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span>Chu kỳ ôn tiếp: {previewCard.dueDate} ({previewCard.interval} ngày)</span>
              <span>Đã nhớ: {previewCard.repetitions} lần</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quản lý Xóa theo Danh mục hoặc Xóa tất cả */}
      <DeleteCategoryModal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => setIsDeleteCategoryModalOpen(false)}
        cards={cards}
        onDeleted={handleBatchDeleted}
      />
    </div>
  );
};
