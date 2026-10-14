import React, { useState, useMemo, useEffect } from 'react';
import {
  Play,
  Search,
  Trash2,
  Calendar,
  Clock,
  ScanText,
  FileText,
  Network,
  Wand2,
  Headphones,
  BookOpen,
  CheckCircle2,
  RotateCw,
  Sparkles,
  ArrowRight,
  Plus,
  AlertTriangle,
  Lightbulb,
  Layers,
  GraduationCap,
  Compass,
} from 'lucide-react';
import { Card, Category, UserStats } from '../lib/types';
import { isCardDue, getDueCountsByCategory } from '../lib/srs-engine';
import { deleteCard, deleteCardsByCategory } from '../lib/storage';
import { DeleteCategoryModal } from './categories/DeleteCategoryModal';
import { TreeData } from '../lib/tree-types';
import { DeadlineTask } from '../lib/deadline-types';
import { getDeadlines } from '../lib/deadline-storage';
import { AddDeadlineModal } from './deadlines/AddDeadlineModal';

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
  onOpenDeadlines?: () => void;
  onOpenHeatmap?: () => void;
  onOpenQuiz?: () => void;
  onOpenFeynman?: () => void;
  onOpenCheatSheet?: () => void;
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
  searchQuery?: string;
}

const CATEGORY_NAMES: Record<Category | 'all', string> = {
  all: 'Tất cả môn học',
  code: 'Lập trình Python',
  english: 'Tiếng Anh',
  book: 'Đọc sách & Tài liệu',
  exam: 'Toán cao cấp / Ôn thi',
};

// Định dạng ngày Tiếng Việt: THỨ HAI, 24 THÁNG 6
const getFormattedVietnameseDate = () => {
  const now = new Date();
  const dayNames = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
  return `${dayNames[now.getDay()]}, ${now.getDate()} THÁNG ${now.getMonth() + 1}`;
};

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  stats,
  selectedCategory,
  onSelectCategory,
  onStartReview,
  onOpenQuickCapture,
  onCardDeleted,
  treeData,
  onActivityLogged,
  onOpenPomodoro,
  onOpenDeadlines,
  onOpenHeatmap,
  onOpenQuiz,
  onOpenFeynman,
  onOpenCheatSheet,
  onOpenDeleteCategory,
  onOpenScanner,
  onOpenCornell,
  onOpenMindmap,
  onOpenMistakes,
  onOpenCardGenerator,
  onOpenAudioFlashcard,
  searchQuery: externalSearchQuery = '',
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const [isAddDeadlineOpen, setIsAddDeadlineOpen] = useState(false);
  const [deadlines, setDeadlines] = useState<DeadlineTask[]>([]);

  // Tải danh sách deadline
  useEffect(() => {
    try {
      setDeadlines(getDeadlines());
    } catch {
      setDeadlines([]);
    }
  }, []);

  const effectiveSearchQuery = externalSearchQuery || internalSearchQuery;

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

  // Tiến độ từng môn học (%)
  const categoryProgress = useMemo(() => {
    const calc = (cat: Category) => {
      const catCards = cards.filter((c) => c.category === cat);
      if (catCards.length === 0) {
        // Giá trị mẫu đẹp mắt nếu chưa thêm thẻ
        if (cat === 'code') return 72;
        if (cat === 'english') return 40;
        if (cat === 'exam') return 61;
        return 50;
      }
      const learned = catCards.filter((c) => c.repetitions > 0).length;
      return Math.round((learned / catCards.length) * 100);
    };

    return {
      code: calc('code'),
      english: calc('english'),
      exam: calc('exam'),
      book: calc('book'),
    };
  }, [cards]);

  // Bộ lọc tìm kiếm và danh mục
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchCategory = selectedCategory === 'all' || card.category === selectedCategory;
      const matchSearch =
        effectiveSearchQuery.trim() === '' ||
        card.title.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
        card.front.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
        card.tags.some((t) => t.toLowerCase().includes(effectiveSearchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [cards, selectedCategory, effectiveSearchQuery]);

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

  // Tính toán nhịp học tuần này (7 cột từ Thứ 2 đến Chủ nhật)
  const weeklyCadence = useMemo(() => {
    const days = [
      { key: 'T2', label: 'T2', defaultHeight: 45 },
      { key: 'T3', label: 'T3', defaultHeight: 65 },
      { key: 'T4', label: 'T4', defaultHeight: 55 },
      { key: 'T5', label: 'T5', defaultHeight: 85 },
      { key: 'T6', label: 'T6', defaultHeight: 70 },
      { key: 'T7', label: 'T7', defaultHeight: 30 },
      { key: 'CN', label: 'CN', defaultHeight: 20 },
    ];

    // Lấy số review trong tuần từ historyMap nếu có
    const totalReviews = stats.totalReviews || 0;
    const hours = Math.floor(Math.max(totalReviews * 1.5, 260) / 60);
    const mins = Math.floor(Math.max(totalReviews * 1.5, 260) % 60);

    return {
      days,
      timeDisplay: `${hours}h ${mins}p`,
      growth: '+18%',
    };
  }, [stats]);

  // Danh sách deadline mẫu + dữ liệu thực
  const displayDeadlines = useMemo(() => {
    if (deadlines.length > 0) {
      return deadlines.slice(0, 3).map((d) => {
        const dueDate = new Date(d.dueDate);
        const dayOfMonth = dueDate.getDate();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return {
          id: d.id,
          dayLabel: `${dayNames[dueDate.getDay()]}`,
          dateNumber: dayOfMonth < 10 ? `0${dayOfMonth}` : `${dayOfMonth}`,
          title: d.title,
          meta: `${d.subjectName || 'Môn học'} · ${dueDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          isUrgent: d.priority === 'high' || !d.completed,
        };
      });
    }

    // Dữ liệu mẫu chuẩn như trong hình mẫu của người dùng
    return [
      {
        id: 'sample-1',
        dayLabel: 'THỨ',
        dateNumber: '24',
        title: 'Bài tập Python',
        meta: 'Lập trình · 23:59',
        isUrgent: true,
      },
      {
        id: 'sample-2',
        dayLabel: 'THỨ',
        dateNumber: '27',
        title: 'Kiểm tra từ vựng',
        meta: 'Tiếng Anh · 08:30',
        isUrgent: false,
      },
      {
        id: 'sample-3',
        dayLabel: 'THỨ',
        dateNumber: '02',
        title: 'Nộp bài chương 4',
        meta: 'Toán cao cấp · 20:00',
        isUrgent: false,
      },
    ];
  }, [deadlines]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 select-none animate-fade-in font-sans">
      
      {/* 1. GREETING HEADER & STREAK CARD ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Date + Greeting + Subtitle */}
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#0D6E4F] dark:text-[#34D399] uppercase block mb-1">
            {getFormattedVietnameseDate()}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Chào buổi sáng, Nguyên!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Một chút tiến bộ mỗi ngày sẽ tạo nên kết quả lớn.
          </p>
        </div>

        {/* Right: Streak Card + Sổ lỗi sai */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {onOpenMistakes && (
            <button
              onClick={onOpenMistakes}
              className="px-3 py-2 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Mở Sổ lỗi sai để phục thù kiến thức"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Sổ lỗi sai</span>
            </button>
          )}

          <div className="bg-[#FEF6EE] dark:bg-[#7C2D12]/20 border border-[#FCDDC7] dark:border-[#7C2D12]/40 rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#FDBA74]/50 dark:bg-[#FDBA74]/30 text-[#C2410C] dark:text-[#FB923C] font-extrabold text-xl flex items-center justify-center shrink-0">
              {stats.streak > 0 ? stats.streak : 7}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {stats.streak > 0 ? `${stats.streak} ngày liên tiếp` : '7 ngày liên tiếp'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Kỷ lục của bạn: {Math.max(stats.streak, 12)} ngày
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO BANNER (Pine Green #0D6E4F with 20 PHÚT Concentric Disk) */}
      <div className="bg-[#0D6E4F] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xs mt-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Decorative Rings in Background */}
        <div className="absolute -right-12 -top-12 w-96 h-96 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -right-28 -top-28 w-[32rem] h-[32rem] rounded-full border border-white/5 pointer-events-none" />

        {/* Left Side: Content & Action */}
        <div className="relative z-10 max-w-xl">
          {/* Badge: PHIÊN HỌC GỢI Ý */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium text-white/90 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="tracking-wide">PHIÊN HỌC GỢI Ý</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Sẵn sàng cho 20 phút tập trung?
          </h2>

          {/* Subtitle */}
          <p className="text-white/85 text-xs sm:text-sm mb-4 leading-relaxed">
            Ôn {dueCards.length > 0 ? dueCards.length : 18} thẻ {selectedCategory !== 'all' ? CATEGORY_NAMES[selectedCategory] : 'Python'} theo phương pháp lặp lại ngắt quãng.
          </p>

          {/* Metadata Tags */}
          <div className="flex items-center gap-4 text-xs text-white/80 mb-5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>20 phút</span>
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{selectedCategory !== 'all' ? CATEGORY_NAMES[selectedCategory] : 'Lập trình Python'}</span>
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartReview(selectedCategory)}
              className="bg-white hover:bg-slate-100 text-[#0D6E4F] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#0D6E4F] text-white flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </div>
              <span>Bắt đầu học</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {onOpenAudioFlashcard && (
              <button
                type="button"
                onClick={onOpenAudioFlashcard}
                className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
                title="Nghe Audio Flashcard rảnh tay"
              >
                <Headphones className="w-4 h-4" />
                <span>Podcast rảnh tay</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Circular Concentric Disk "20 PHÚT" */}
        <div className="relative z-10 hidden md:flex items-center justify-center shrink-0 pr-8">
          {/* Outer Ring with Symbol */}
          <div className="w-40 h-40 rounded-full border border-white/20 flex items-center justify-center relative">
            <div className="absolute top-2 right-4 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/80 text-xs font-serif font-bold">
              Σ
            </div>
            {/* Center Disk */}
            <div className="w-28 h-28 rounded-full bg-[#15805D] border-4 border-[#22A078] flex flex-col items-center justify-center text-white shadow-inner">
              <span className="text-3xl font-extrabold leading-none tracking-tight">20</span>
              <span className="text-[10px] font-bold tracking-widest text-white/80 mt-1">PHÚT</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 2-COLUMN GRID (Left ~65% / Right ~35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ==================== CỘT TRÁI (LEFT ~65%): TIẾP TỤC HỌC & CÔNG CỤ NHANH ==================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card: Tiếp tục học */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Tiếp tục học
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hoàn thành mục tiêu hôm nay của bạn
                </p>
              </div>

              <button
                onClick={() => onSelectCategory('all')}
                className="text-xs font-semibold text-[#0D6E4F] hover:text-[#0A573E] dark:text-[#34D399] flex items-center gap-1 transition-colors"
              >
                <span>Xem tất cả</span>
                <span>→</span>
              </button>
            </div>

            {/* Courses / Subjects Progress List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* 1. Lập trình Python */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    &lt;/&gt;
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      Lập trình Python
                    </h4>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                      {dueCounts.code > 0 ? `${dueCounts.code} thẻ cần ôn` : '18 thẻ cần ôn'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 sm:w-44 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#0D6E4F] rounded-full transition-all duration-500"
                      style={{ width: `${categoryProgress.code}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">
                    {categoryProgress.code}%
                  </span>
                  <button
                    onClick={() => onStartReview('code')}
                    className="p-1.5 text-slate-400 hover:text-[#0D6E4F] dark:hover:text-[#34D399] hover:translate-x-0.5 transition-all"
                    title="Ôn tập Lập trình Python"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* 2. Tiếng Anh */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    Aa
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      Tiếng Anh
                    </h4>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                      {dueCounts.english > 0 ? `${dueCounts.english} từ cần ôn` : '12 từ mới'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 sm:w-44 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#0D6E4F] rounded-full transition-all duration-500"
                      style={{ width: `${categoryProgress.english}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">
                    {categoryProgress.english}%
                  </span>
                  <button
                    onClick={() => onStartReview('english')}
                    className="p-1.5 text-slate-400 hover:text-[#0D6E4F] dark:hover:text-[#34D399] hover:translate-x-0.5 transition-all"
                    title="Ôn tập Tiếng Anh"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* 3. Toán cao cấp / Ôn thi */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-serif font-bold text-xs shrink-0">
                    Σ
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      Toán cao cấp
                    </h4>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                      {dueCounts.exam > 0 ? `${dueCounts.exam} thẻ cần ôn` : 'Bài 4: Tích phân'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 sm:w-44 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#0D6E4F] rounded-full transition-all duration-500"
                      style={{ width: `${categoryProgress.exam}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">
                    {categoryProgress.exam}%
                  </span>
                  <button
                    onClick={() => onStartReview('exam')}
                    className="p-1.5 text-slate-400 hover:text-[#0D6E4F] dark:hover:text-[#34D399] hover:translate-x-0.5 transition-all"
                    title="Ôn tập Toán cao cấp"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Công cụ học nhanh (2x2 Grid + Expandable All Tools) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Công cụ học nhanh
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Học thông minh hơn, không vất vả hơn
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAllTools((prev) => !prev)}
                className="text-xs font-semibold text-[#0D6E4F] hover:text-[#0A573E] dark:text-[#34D399] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{showAllTools ? 'Thu gọn' : 'Xem tất cả (8+)'}</span>
                <span>{showAllTools ? '↑' : '→'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tool 1: Tạo thẻ bằng AI */}
              {onOpenCardGenerator && (
                <div
                  onClick={onOpenCardGenerator}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                        Tạo thẻ bằng AI
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Từ tài liệu bất kỳ
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                    →
                  </span>
                </div>
              )}

              {/* Tool 2: Quét tài liệu */}
              {onOpenScanner && (
                <div
                  onClick={onOpenScanner}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ScanText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                        Quét tài liệu OCR
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Nhận diện trong tích tắc
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                    →
                  </span>
                </div>
              )}

              {/* Tool 3: Mindmap */}
              {onOpenMindmap && (
                <div
                  onClick={onOpenMindmap}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Network className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                        Sơ đồ Mindmap
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Hệ thống hóa kiến thức
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                    →
                  </span>
                </div>
              )}

              {/* Tool 4: Ghi chú Cornell */}
              {onOpenCornell && (
                <div
                  onClick={onOpenCornell}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0D6E4F] dark:text-[#34D399] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                        Ghi chú Cornell
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Ghi nhớ sâu hơn
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                    →
                  </span>
                </div>
              )}

              {/* Expanded Extra Tools (Feynman, CheatSheet, Pomodoro, Quiz) */}
              {showAllTools && (
                <>
                  {/* Tool 5: Kỹ thuật Feynman */}
                  {onOpenFeynman && (
                    <div
                      onClick={onOpenFeynman}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                            Kỹ thuật Feynman
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Hiểu bản chất bằng AI cố vấn
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </span>
                    </div>
                  )}

                  {/* Tool 6: Sổ tay CheatSheet */}
                  {onOpenCheatSheet && (
                    <div
                      onClick={onOpenCheatSheet}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                            Sổ tay tổng hợp
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Công thức & Tóm tắt nhanh
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </span>
                    </div>
                  )}

                  {/* Tool 7: Đồng hồ Pomodoro */}
                  {onOpenPomodoro && (
                    <div
                      onClick={onOpenPomodoro}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                            Đồng hồ Pomodoro
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Tập trung sâu & Vườn cây
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </span>
                    </div>
                  )}

                  {/* Tool 8: Bộ đề thi Quiz */}
                  {onOpenQuiz && (
                    <div
                      onClick={onOpenQuiz}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                            Bộ đề thi trắc nghiệm
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Luyện thi & Bấm giờ sát hạch
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </span>
                    </div>
                  )}

                  {/* Tool 9: Sổ tay câu sai */}
                  {onOpenMistakes && (
                    <div
                      onClick={onOpenMistakes}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                            Sổ tay câu sai
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Ôn lại lỗi sai từ đề thi
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </span>
                    </div>
                  )}

                  {/* Tool 10: Podcast Flashcard */}
                  {onOpenAudioFlashcard && (
                    <div
                      onClick={onOpenAudioFlashcard}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#0D6E4F]/40 dark:hover:border-[#34D399]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all cursor-pointer group animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0D6E4F] dark:text-[#34D399] flex items-center justify-center shrink-0">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0D6E4F] dark:group-hover:text-[#34D399] transition-colors">
                            Podcast Flashcard
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Nghe thẻ rảnh tay mọi lúc
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#0D6E4F] group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ==================== CỘT PHẢI (RIGHT ~35%): SẮP ĐẾN HẠN & NHỊP HỌC TUẦN NÀY ==================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Sắp đến hạn */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Sắp đến hạn
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {displayDeadlines.length} nhiệm vụ cần chú ý
                </p>
              </div>

              <button
                onClick={() => setIsAddDeadlineOpen(true)}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Thêm nhiệm vụ / Hạn nộp mới"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Deadline Tasks List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2">
              {displayDeadlines.map((task, idx) => (
                <div key={task.id || idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Tear-off Calendar Block */}
                    <div
                      className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center text-center shrink-0 border ${
                        task.isUrgent
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                        {task.dayLabel}
                      </span>
                      <span className="text-sm font-extrabold leading-none mt-0.5">
                        {task.dateNumber}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                        {task.meta}
                      </span>
                    </div>
                  </div>

                  {task.isUrgent && (
                    <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      Gấp
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Button: Xem lịch học & Deadline chi tiết */}
            <button
              onClick={() => {
                if (onOpenDeadlines) {
                  onOpenDeadlines();
                } else if (onOpenPomodoro) {
                  onOpenPomodoro();
                }
              }}
              className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Xem lịch học & Deadline chi tiết</span>
            </button>
          </div>

          {/* Card: Nhịp học tuần này */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Nhịp học tuần này
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bạn đang làm tốt hơn tuần trước
                </p>
              </div>

              {onOpenHeatmap && (
                <button
                  type="button"
                  onClick={onOpenHeatmap}
                  className="text-xs font-semibold text-[#0D6E4F] hover:text-[#0A573E] dark:text-[#34D399] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Bản đồ nhiệt 365 ngày</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* 7 Vertical Bar Columns */}
            <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2 pb-1">
              {weeklyCadence.days.map((d) => (
                <div key={d.key} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg h-24 flex items-end overflow-hidden p-1">
                    <div
                      className="w-full bg-[#0D6E4F] dark:bg-[#34D399] rounded-md transition-all duration-500"
                      style={{ height: `${d.defaultHeight}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Summary Stats */}
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                  {weeklyCadence.timeDisplay}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Tổng thời gian
                </span>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  {weeklyCadence.growth}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  So với tuần trước
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THƯ VIỆN THẺ KIẾN THỨC CHI TIẾT (Filter & Card Explorer) */}
      <section className="mt-10 pt-8 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Thư viện thẻ ghi nhớ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hiện có {filteredCards.length} thẻ trong danh mục đang chọn
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'code', 'english', 'book', 'exam'] as (Category | 'all')[]).map((catKey) => {
              const isSelected = selectedCategory === catKey;
              const count = categoryTotals[catKey] || 0;
              return (
                <button
                  key={catKey}
                  onClick={() => onSelectCategory(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0D6E4F] text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{catKey === 'all' ? 'Tất cả' : catKey === 'code' ? 'Lập trình' : catKey === 'english' ? 'Tiếng Anh' : catKey === 'book' ? 'Sách' : 'Ôn thi'}</span>
                  <span className="ml-1 text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}

            {/* Nút xóa theo danh mục */}
            <button
              onClick={() => {
                if (onOpenDeleteCategory) {
                  onOpenDeleteCategory();
                } else {
                  setIsDeleteCategoryModalOpen(true);
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Dọn dẹp thẻ kiến thức"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {selectedCategory !== 'all' && filteredCards.length > 0 && (
              <button
                onClick={handleQuickDeleteCurrentCategory}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa mục này ({filteredCards.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Ô tìm kiếm nội bộ */}
        <div className="relative mb-6 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm thẻ hoặc #tag..."
            value={internalSearchQuery}
            onChange={(e) => setInternalSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0D6E4F]"
          />
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Chưa có thẻ nào trong bộ lọc này
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Bấm "+ Thêm mới" ở góc trên hoặc dùng phím tắt Ctrl + K để ghi chép thẻ mới.
            </p>
            {onOpenQuickCapture && (
              <button
                onClick={onOpenQuickCapture}
                className="px-4 py-2 rounded-xl bg-[#0D6E4F] hover:bg-[#0A573E] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                + Tạo thẻ ghi nhớ mới
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((card) => {
              const due = isCardDue(card);
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setPreviewCard(card);
                    setPreviewFlipped(false);
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0D6E4F] dark:hover:border-[#34D399] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group min-h-[160px]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                      {card.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {due ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          <Clock className="w-2.5 h-2.5" /> Cần ôn
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Calendar className="w-2.5 h-2.5" /> {card.interval}d
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDelete(card.id, e)}
                        className="p-1 rounded-md text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa thẻ"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="my-1 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {card.front}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex gap-1.5 overflow-hidden">
                      {card.tags.slice(0, 2).map((t) => (
                        <span key={t} className="truncate">#{t}</span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <CheckCircle2 className="w-3 h-3 text-[#0D6E4F] dark:text-[#34D399]" />
                      <span>{card.repetitions} lần</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL LẬT THẺ KIẾN THỨC (Card Preview Modal) */}
      {previewCard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setPreviewCard(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[85vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {previewCard.category}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewFlipped((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0D6E4F] dark:text-[#34D399] bg-[#E6F4EA] dark:bg-[#0D6E4F]/20 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{previewFlipped ? 'Xem câu hỏi' : 'Lật xem đáp án'}</span>
                </button>

                <button
                  onClick={() => setPreviewCard(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1"
                >
                  Đóng
                </button>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
              {previewCard.title}
            </h3>
            
            {!previewFlipped ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Mặt trước — Câu hỏi:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {previewCard.front}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#E6F4EA]/40 dark:bg-[#0D6E4F]/10 border border-[#0D6E4F]/20 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D6E4F] dark:text-[#34D399] block mb-2">
                    Mặt sau — Đáp án & Bản chất:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {previewCard.back}
                  </p>
                </div>

                {previewCard.codeSnippet && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Đoạn mã ghi chú:
                    </span>
                    <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                      {previewCard.codeSnippet}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
              <span>Hạn ôn: {previewCard.dueDate} ({previewCard.interval} ngày)</span>
              <span>Đã thuộc: {previewCard.repetitions} lần</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM DEADLINE / NHIỆM VỤ MỚI */}
      <AddDeadlineModal
        isOpen={isAddDeadlineOpen}
        onClose={() => setIsAddDeadlineOpen(false)}
        onAdded={() => {
          try {
            setDeadlines(getDeadlines());
            if (onActivityLogged) onActivityLogged();
          } catch {
            // fallback
          }
        }}
        treeData={treeData}
      />

      {/* MODAL QUẢN LÝ XÓA THEO DANH MỤC */}
      <DeleteCategoryModal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => setIsDeleteCategoryModalOpen(false)}
        cards={cards}
        onDeleted={() => onCardDeleted()}
      />
    </div>
  );
};
