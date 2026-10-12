import React from 'react';
import {
  Layers,
  GraduationCap,
  FolderTree,
  Clock,
  Menu,
  Plus,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner' | 'cornell' | 'advisor' | 'feynman' | 'cheatsheet' | 'mindmap';
  onSelectTab: (tab: 'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner' | 'cornell' | 'advisor' | 'feynman' | 'cheatsheet' | 'mindmap') => void;
  onOpenMenu: () => void;
  dueCount: number;
  quizCount: number;
  onOpenQuickCapture: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMenu,
  dueCount,
  quizCount,
  onOpenQuickCapture,
}) => {
  // Kiểm tra xem tab hiện tại có phải là một trong 4 tab chính trên thanh bottom không
  const isMoreActive = !['cards', 'quiz', 'tree', 'pomodoro'].includes(activeTab);

  return (
    <>
      {/* Nút Tròn Nổi Tạo Thẻ Nhanh (Floating Action Button - FAB) cho Mobile */}
      {activeTab === 'cards' && (
        <button
          onClick={onOpenQuickCapture}
          className="lg:hidden fixed right-4 bottom-20 z-40 w-13 h-13 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-xl shadow-brand-500/35 flex items-center justify-center active:scale-90 transition-all border-2 border-white dark:border-slate-800"
          title="Tạo nhanh thẻ học mới (Quick Capture)"
          aria-label="Tạo nhanh thẻ học mới"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Thanh Điều Hướng Cố Định Dưới Đáy Màn Hình (Mobile Bottom Navigation Bar) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-2xl safe-area-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Thanh điều hướng di động"
      >
        <div className="flex items-center justify-around h-15 px-2 max-w-lg mx-auto">
          {/* Tab 1: ÔN TẬP THẺ */}
          <button
            onClick={() => onSelectTab('cards')}
            className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
              activeTab === 'cards'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <Layers className={`w-5 h-5 ${activeTab === 'cards' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {dueCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black font-mono flex items-center justify-center shadow-xs animate-pulse">
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Ôn tập</span>
            {activeTab === 'cards' && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>

          {/* Tab 2: LUYỆN THI TRẮC NGHIỆM */}
          <button
            onClick={() => onSelectTab('quiz')}
            className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
              activeTab === 'quiz'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="relative">
              <GraduationCap className={`w-5 h-5 ${activeTab === 'quiz' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {quizCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-purple-500 text-white text-[8px] font-bold font-mono flex items-center justify-center">
                  {quizCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Luyện thi</span>
            {activeTab === 'quiz' && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>

          {/* Tab 3: CÂY TÀI LIỆU (VAULT) */}
          <button
            onClick={() => onSelectTab('tree')}
            className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
              activeTab === 'tree'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <FolderTree className={`w-5 h-5 ${activeTab === 'tree' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 tracking-tight">Tài liệu</span>
            {activeTab === 'tree' && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>

          {/* Tab 4: ĐỒNG HỒ POMODORO */}
          <button
            onClick={() => onSelectTab('pomodoro')}
            className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
              activeTab === 'pomodoro'
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Clock className={`w-5 h-5 ${activeTab === 'pomodoro' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 tracking-tight">Tập trung</span>
            {activeTab === 'pomodoro' && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>

          {/* Tab 5: MENU MỞ RỘNG (Scanner, Cornell, Mindmap, Feynman, v.v.) */}
          <button
            onClick={onOpenMenu}
            className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
              isMoreActive
                ? 'text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Menu className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 tracking-tight">
              {isMoreActive ? 'Đang mở' : 'Thêm'}
            </span>
            {isMoreActive && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
