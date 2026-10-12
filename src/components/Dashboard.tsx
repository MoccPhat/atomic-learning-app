import React, { useState } from 'react';
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
  Check,
  ScanText,
  FileText,
  Compass,
  Trophy,
  Network,
  AlertTriangle,
  Wand2,
  Headphones,
  HeartHandshake,
} from 'lucide-react';
import { Card, Category, UserStats } from '../lib/types';
import { isCardDue, filterDueCards } from '../lib/srs-engine';
import { deleteCard, deleteCardsByCategory } from '../lib/storage';
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
  onStartReview: () => void;
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
  exam: 'Ôn thi cử',
};

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);

  const dueCards = filterDueCards(cards);

  const filteredCards = cards.filter((card) => {
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDelete = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetCard = cards.find((c) => c.id === cardId);
    const cardTitle = targetCard?.title || 'thẻ kiến thức';
    deleteCard(cardId);
    onCardDeleted(cardId);
    setToastMessage(`Đã xóa thẻ "${cardTitle}" thành công!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleQuickDeleteCurrentCategory = () => {
    if (selectedCategory === 'all') return;
    const catName = CATEGORY_NAMES[selectedCategory];
    const count = deleteCardsByCategory(selectedCategory);
    onCardDeleted();
    setToastMessage(`Đã xóa toàn bộ ${count} thẻ thuộc danh mục "${catName}" thành công!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBatchDeleted = (message: string) => {
    onCardDeleted();
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left">
      {/* Toast Notification khi xóa thành công */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="flex items-center justify-between pb-5 border-b border-slate-200/80 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          {/* Nút Ẩn / Hiện Menu bên trái */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
            title="Ẩn / Hiện menu danh mục"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200">Menu</span>
          </button>

          <div className="flex items-center gap-2.5">
            <KaiLogo size={36} />
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                Auto Learning
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 uppercase tracking-widest font-mono">
                  KAI
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">Hệ thống học tập thông minh</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Streak & Achievements Badge */}
          <button
            onClick={onOpenAchievements}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-black shadow-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all active:scale-95"
            title="Xem Cột Mốc Thành Tựu & Huy Hiệu Vinh Danh"
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
            <span>{stats.streak} ngày</span>
            <Trophy className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
          </button>

          {/* Quick Capture Button */}
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
            title="Thêm thẻ kiến thức mới (Ctrl + Enter)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm thẻ</span>
          </button>

          {/* Scanner AI Button */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95"
              title="Quét & số hóa tài liệu ảnh với AI Vision"
            >
              <ScanText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Quét tài liệu</span>
            </button>
          )}

          {/* Pomodoro Focus Button */}
          {onOpenPomodoro && (
            <button
              onClick={onOpenPomodoro}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs shadow-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-95"
              title="Đồng hồ Pomodoro & Âm thanh tập trung"
            >
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Pomodoro</span>
            </button>
          )}

          {/* Cornell Notes Quick Button */}
          {onOpenCornell && (
            <button
              onClick={onOpenCornell}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs shadow-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all active:scale-95"
              title="Trình Ghi Chú Chuẩn Cornell (3 Vùng)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Ghi chú Cornell</span>
            </button>
          )}

          {/* Study Advisor Quick Button */}
          {onOpenAdvisor && (
            <button
              onClick={onOpenAdvisor}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs shadow-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all active:scale-95"
              title="Trợ Lý Lộ Trình & Nhắc Nhở Học Tập Thông Minh"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Lộ trình</span>
            </button>
          )}

          {/* Mindmap Quick Button */}
          {onOpenMindmap && (
            <button
              onClick={onOpenMindmap}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95"
              title="Sơ Đồ Tư Duy Trực Quan (Mindmap)"
            >
              <Network className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Mindmap</span>
            </button>
          )}

          {/* Sổ Tay Lỗi Sai Button */}
          {onOpenMistakes && (
            <button
              onClick={onOpenMistakes}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs shadow-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-95"
              title="Sổ Tay Lỗi Sai & Sát Hạch Phục Thù"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">Sổ lỗi sai</span>
            </button>
          )}

          {/* 1-Click Tạo Thẻ AI Button */}
          {onOpenCardGenerator && (
            <button
              onClick={onOpenCardGenerator}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/60 dark:to-indigo-950/60 border border-brand-200/80 dark:border-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-xs shadow-xs hover:from-brand-100 hover:to-indigo-100 transition-all active:scale-95"
              title="Rút trích Flashcard & Quiz tự động từ tài liệu"
            >
              <Wand2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="hidden sm:inline">Tạo thẻ AI</span>
            </button>
          )}

          {/* Feedback & Bug Report Button */}
          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Gửi đánh giá hoặc báo lỗi trực tiếp cho tác giả (phat7971@gmail.com)"
            >
              <HeartHandshake className="w-5 h-5" />
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
        </div>
      </header>

      {/* Hero Review Card */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Phiên ôn tập hôm nay</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {dueCards.length > 0 ? (
                  <>
                    Có <span className="text-brand-400">{dueCards.length} thẻ</span> cần củng cố
                  </>
                ) : (
                  <>Đã ôn tập xong hôm nay! 🎉</>
                )}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-md">
                {dueCards.length > 0
                  ? 'Dành 5 phút để kích hoạt trí nhớ chủ động (Active Recall) và tránh đường cong lãng quên Ebbinghaus.'
                  : 'Bạn đã hoàn thành toàn bộ thẻ đến hạn. Thêm thẻ mới hoặc tận hưởng ngày học hiệu quả!'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {onOpenAudioFlashcard && cards.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenAudioFlashcard}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-md transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
                  title="Nghe audio phát thanh câu hỏi & câu trả lời rảnh tay"
                >
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Podcast rảnh tay</span>
                </button>
              )}

              <button
                onClick={onStartReview}
                disabled={dueCards.length === 0}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-lg transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto ${
                  dueCards.length > 0
                    ? 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-brand-500/30 cursor-pointer'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {dueCards.length > 0 ? 'Bắt đầu ôn tập ngay' : 'Đã thuộc hết'}
              </button>
            </div>
          </div>

          {/* Decorative Background Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* Activity Heatmap & Deadline Countdown Section */}
      <section className="space-y-6 mb-8">
        {/* Heatmap: Thói quen chăm chỉ */}
        <StudyHeatmap
          historyMap={stats.historyMap}
          streak={stats.streak}
          onActivityLogged={onActivityLogged}
        />

        {/* Deadline Manager: Quản lý đếm ngược nhiệm vụ & bài tập */}
        <DeadlineManager
          treeData={treeData}
          onActivityLogged={onActivityLogged}
        />
      </section>

      {/* Filter Status & Search Bar */}
      <section className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Active Category Indicator Banner */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Danh mục:</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xs border border-transparent dark:border-slate-700">
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

            {/* Nút Mở Modal: Chọn 1 danh mục cần xóa hoặc Xóa tất cả */}
            <button
              onClick={() => {
                if (onOpenDeleteCategory) {
                  onOpenDeleteCategory();
                } else {
                  setIsDeleteCategoryModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200/90 dark:border-rose-900/60 transition-all active:scale-95 shadow-xs ml-1"
              title="Chọn 1 danh mục cần xóa hoặc xóa tất cả thẻ"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa danh mục / Xóa tất cả</span>
            </button>

            {/* Nút xóa nhanh nếu đang lọc theo 1 danh mục cụ thể */}
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
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thẻ hoặc hashtag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>
      </section>

      {/* Cards List Grid */}
      <section>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span>Danh sách thẻ kiến thức ({filteredCards.length})</span>
          <span>Click vào thẻ để xem chi tiết</span>
        </div>

        {filteredCards.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có thẻ nào trong mục này</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Bấm nút "Thêm thẻ" ở góc trên để bổ sung kiến thức đầu tiên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((card) => {
              const due = isCardDue(card);
              return (
                <div
                  key={card.id}
                  onClick={() => setPreviewCard(card)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
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

                  <div className="mt-3 pt-2.5 border-t border-slate-50 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <div className="flex gap-1.5 overflow-hidden">
                      {card.tags.slice(0, 2).map((t) => (
                        <span key={t} className="truncate">#{t}</span>
                      ))}
                    </div>
                    <span className="font-mono text-[10px] font-medium">
                      Reps: {card.repetitions}
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
