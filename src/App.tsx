import { useState, useEffect, useMemo } from 'react';
import { Menu, Check } from 'lucide-react';
import { Card, Category, UserStats } from './lib/types';
import { getCards, getUserStats } from './lib/storage';
import { filterDueCards } from './lib/srs-engine';
import { loadQuizSets } from './lib/quiz-storage';
import { applyTheme, getStoredTheme, setupSystemThemeListener } from './lib/theme';
import { Dashboard } from './components/Dashboard';
import { ReviewPlayer } from './components/ReviewPlayer';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { SettingsModal } from './components/SettingsModal';
import { DeleteCategoryModal } from './components/categories/DeleteCategoryModal';
import { Sidebar } from './components/Sidebar';
import { QuizMaster } from './components/quiz/QuizMaster';
import { TreeExplorer } from './components/tree/TreeExplorer';
import { TreeData } from './lib/tree-types';
import { countTotalFilesInTree, loadTreeData } from './lib/tree-storage';
import { PomodoroTimer } from './components/pomodoro/PomodoroTimer';
import { DocumentScanner } from './components/scanner/DocumentScanner';
import { CornellNotesStudio } from './components/cornell/CornellNotesStudio';
import { StudyAdvisor } from './components/advisor/StudyAdvisor';
import { FeynmanStudio } from './components/feynman/FeynmanStudio';
import { CheatSheetVault } from './components/cheatsheet/CheatSheetVault';
import { MindMapStudio } from './components/mindmap/MindMapStudio';
import { getCornellNotes } from './lib/cornell-storage';
import { CornellNote } from './lib/cornell-types';
import { AchievementsModal } from './components/achievements/AchievementsModal';
import { AchievementInputStats } from './lib/achievements-service';
import { getGardenStats } from './lib/focus-garden-storage';
import { getCheatSheets } from './lib/cheatsheet-storage';
import { MistakeNotebookModal } from './components/mistakes/MistakeNotebookModal';
import { InstantCardGeneratorModal } from './components/tools/InstantCardGeneratorModal';
import { AudioFlashcardModal } from './components/flashcards/AudioFlashcardModal';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { addQuizSetFromText } from './lib/quiz-storage';
import { MistakeItem } from './lib/mistakes-types';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [cornellNotes, setCornellNotes] = useState<CornellNote[]>([]);
  const [stats, setStats] = useState<UserStats>({
    streak: 0,
    lastActiveDate: '',
    totalReviews: 0,
    historyMap: {},
  });
  const [isReviewing, setIsReviewing] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isMistakesOpen, setIsMistakesOpen] = useState(false);
  const [isCardGeneratorOpen, setIsCardGeneratorOpen] = useState(false);
  const [isAudioFlashcardOpen, setIsAudioFlashcardOpen] = useState(false);
  const [cardGenInitialText, setCardGenInitialText] = useState('');
  const [cardGenDocTitle, setCardGenDocTitle] = useState('');
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showGlobalToast = (message: string) => {
    setGlobalToast(message);
    setTimeout(() => setGlobalToast(null), 3500);
  };

  // Tab đang hoạt động: 'cards', 'quiz', 'tree', 'pomodoro', 'scanner', 'cornell', 'advisor', 'feynman', 'cheatsheet', 'mindmap'
  const [activeTab, setActiveTab] = useState<'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner' | 'cornell' | 'advisor' | 'feynman' | 'cheatsheet' | 'mindmap'>('cards');
  const [quizCount, setQuizCount] = useState<number>(() => loadQuizSets().length);
  const [treeData, setTreeData] = useState<TreeData>({ groups: [] });
  
  // Trạng thái Menu bên trái: mặc định mở trên màn hình lớn (>= 1024px) và đóng trên mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Danh mục đang chọn (Tất cả, Lập trình, Ngoại ngữ, Đọc sách, Ôn thi cử)
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  // Khởi tạo và nạp dữ liệu từ LocalStorage & IndexedDB
  const reloadData = () => {
    setCards(getCards());
    setStats(getUserStats());
    setQuizCount(loadQuizSets().length);
    setCornellNotes(getCornellNotes());
    loadTreeData().then(setTreeData).catch(console.error);
  };

  const handleStartRevengeQuiz = (mistakesToReview: MistakeItem[]) => {
    if (mistakesToReview.length === 0) return;

    // Sinh nội dung Markdown Quiz từ các câu hỏi sai
    const mdLines: string[] = [
      `# Đề Sát Hạch Phục Thù Sổ Lỗi Sai (${mistakesToReview.length} câu)`,
      '',
    ];

    mistakesToReview.forEach((m, idx) => {
      mdLines.push(`Câu ${idx + 1}: ${m.question}`);
      if (m.options && m.options.length >= 2) {
        m.options.forEach((opt) => mdLines.push(opt));
      } else {
        mdLines.push(`A. ${m.correctAnswer}`);
        mdLines.push(`B. ${m.userChoice || 'Phương án khác'}`);
      }
      mdLines.push(`Đáp án: ${m.correctAnswer}`);
      if (m.explanation) mdLines.push(`Giải thích: ${m.explanation}`);
      mdLines.push('');
    });

    const addRes = addQuizSetFromText(
      mdLines.join('\n'),
      `Sát Hạch Phục Thù (${new Date().toLocaleDateString('vi-VN')})`
    );
    if (addRes.success) {
      setQuizCount(loadQuizSets().length);
      setActiveTab('quiz');
      showGlobalToast('Đã khởi tạo Đề Thi Phục Thù thành công! Chúc bạn vượt qua các câu lỗi sai! 🔥');
    }
  };

  useEffect(() => {
    reloadData();
    // Nạp và kích hoạt Theme từ LocalStorage (Dark / Light / System & Accent color)
    applyTheme(getStoredTheme());
    const cleanupListener = setupSystemThemeListener(() => {
      applyTheme(getStoredTheme());
    });
    return cleanupListener;
  }, []);

  // Lắng nghe phím tắt toàn cục
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'n')) {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
      // Phím tắt mở/đóng Sidebar: phím "["
      if (e.key === '[' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const dueCards = useMemo(() => filterDueCards(cards), [cards]);

  // Thống kê số lượng thẻ cho từng danh mục
  const cardCounts = useMemo<Record<Category | 'all', number>>(() => {
    return {
      all: cards.length,
      code: cards.filter((c) => c.category === 'code').length,
      english: cards.filter((c) => c.category === 'english').length,
      book: cards.filter((c) => c.category === 'book').length,
      exam: cards.filter((c) => c.category === 'exam').length,
    };
  }, [cards]);

  // Thống kê phục vụ hệ thống Huy Hiệu Thành Tựu
  const achievementStats = useMemo<AchievementInputStats>(() => {
    let hlCount = 0;
    let totalFiles = 0;
    (treeData.groups || []).forEach((g) => {
      (g.subjects || []).forEach((s) => {
        (s.weeks || []).forEach((w) => {
          totalFiles += (w.files || []).length;
          (w.files || []).forEach((f) => {
            hlCount += f.highlights?.length || 0;
          });
        });
      });
    });

    let bloomedTrees = 0;
    try {
      bloomedTrees = getGardenStats().totalHarvested;
    } catch {
      bloomedTrees = 0;
    }

    let cheatSheetCount = 0;
    try {
      cheatSheetCount = getCheatSheets().length;
    } catch {
      cheatSheetCount = 0;
    }

    return {
      streak: stats.streak,
      totalCards: cards.length,
      gardenTreesCount: bloomedTrees,
      cornellNotesCount: cornellNotes.length,
      cheatSheetsCount: cheatSheetCount,
      vaultFilesCount: totalFiles,
      highlightsCount: hlCount,
      completedExamsCount: 1,
    };
  }, [stats.streak, cards.length, treeData, cornellNotes.length]);

  return (
    <div
      className="min-h-screen app-custom-bg font-sans transition-colors duration-250"
      style={{
        backgroundColor: 'var(--app-bg)',
        backgroundImage: 'var(--app-gradient)',
        color: 'var(--app-fg)',
      }}
    >
      {isReviewing ? (
        <ReviewPlayer
          cards={dueCards.length > 0 ? dueCards : cards.slice(0, 5)}
          onFinish={() => {
            reloadData();
            setIsReviewing(false);
          }}
          onExit={() => {
            reloadData();
            setIsReviewing(false);
          }}
        />
      ) : (
        <div className="flex min-h-screen">
          {/* Thanh Menu bên trái có thể Ẩn / Hiện */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              reloadData();
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            cardCounts={cardCounts}
            quizCount={quizCount}
            totalTreeFiles={countTotalFilesInTree(treeData)}
            dueCount={dueCards.length}
            streak={stats.streak}
            onStartReview={() => setIsReviewing(true)}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenDeleteCategory={() => setIsDeleteCategoryOpen(true)}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onOpenMistakes={() => setIsMistakesOpen(true)}
            onOpenCardGenerator={() => {
              setCardGenInitialText('');
              setCardGenDocTitle('');
              setIsCardGeneratorOpen(true);
            }}
          />

          {/* Vùng nội dung chính */}
          <main
            className={`flex-1 transition-all duration-300 ease-in-out pb-24 lg:pb-8 ${
              isSidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
            }`}
          >
            {activeTab === 'cards' ? (
              <Dashboard
                cards={cards}
                stats={stats}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                onStartReview={() => setIsReviewing(true)}
                onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onCardDeleted={() => reloadData()}
                treeData={treeData}
                onActivityLogged={() => reloadData()}
                onOpenPomodoro={() => setActiveTab('pomodoro')}
                onOpenDeleteCategory={() => setIsDeleteCategoryOpen(true)}
                onOpenScanner={() => setActiveTab('scanner')}
                onOpenCornell={() => setActiveTab('cornell')}
                onOpenAdvisor={() => setActiveTab('advisor')}
                onOpenAchievements={() => setIsAchievementsOpen(true)}
                onOpenMindmap={() => setActiveTab('mindmap')}
                onOpenMistakes={() => setIsMistakesOpen(true)}
                onOpenCardGenerator={() => {
                  setCardGenInitialText('');
                  setCardGenDocTitle('');
                  setIsCardGeneratorOpen(true);
                }}
                onOpenAudioFlashcard={() => setIsAudioFlashcardOpen(true)}
              />
            ) : activeTab === 'quiz' ? (
              <div className="w-full">
                {/* Header thanh công cụ mở menu cho Quiz Master */}
                <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0 flex items-center justify-between">
                  <button
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
                    title="Ẩn / Hiện menu danh mục"
                  >
                    <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200">Menu</span>
                  </button>
                </div>
                <QuizMaster onDataChanged={reloadData} />
              </div>
            ) : activeTab === 'tree' ? (
              <div className="w-full">
                {/* Header thanh công cụ mở menu cho Cây Lưu Trữ Tài Liệu */}
                <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0 flex items-center justify-between">
                  <button
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
                    title="Ẩn / Hiện menu danh mục"
                  >
                    <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200">Menu</span>
                  </button>
                </div>
                <TreeExplorer
                  treeData={treeData}
                  onUpdateTree={(newData) => setTreeData(newData)}
                  cornellNotes={cornellNotes}
                  cards={cards}
                  onExtractCards={(text, title) => {
                    setCardGenInitialText(text);
                    setCardGenDocTitle(title);
                    setIsCardGeneratorOpen(true);
                  }}
                />
              </div>
            ) : activeTab === 'pomodoro' ? (
              <div className="w-full">
                {/* Header thanh công cụ mở menu cho Đồng hồ Pomodoro */}
                <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0 flex items-center justify-between">
                  <button
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
                    title="Ẩn / Hiện menu danh mục"
                  >
                    <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200">Menu</span>
                  </button>
                </div>
                <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                  <PomodoroTimer
                    treeData={treeData}
                    onActivityLogged={() => reloadData()}
                  />
                </div>
              </div>
            ) : activeTab === 'scanner' ? (
              <div className="w-full">
                <DocumentScanner
                  treeData={treeData}
                  onUpdateTree={(newData) => setTreeData(newData)}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                    reloadData();
                  }}
                  onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                  onDataChanged={() => reloadData()}
                />
              </div>
            ) : activeTab === 'cornell' ? (
              <div className="w-full">
                {/* Header thanh công cụ mở menu cho Ghi chú Cornell */}
                <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0 flex items-center justify-between">
                  <button
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
                    title="Ẩn / Hiện menu danh mục"
                  >
                    <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200">Menu</span>
                  </button>
                </div>
                <CornellNotesStudio
                  treeData={treeData}
                  onActivityLogged={() => reloadData()}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab as any);
                    reloadData();
                  }}
                  onCardsAdded={() => {
                    reloadData();
                    showGlobalToast('Đã chuyển Cues sang thẻ Flashcard SRS thành công!');
                  }}
                />
              </div>
            ) : activeTab === 'advisor' ? (
              <div className="w-full">
                {/* Header thanh công cụ mở menu cho Trợ lý Lộ trình */}
                <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0 flex items-center justify-between">
                  <button
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
                    title="Ẩn / Hiện menu danh mục"
                  >
                    <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200">Menu</span>
                  </button>
                </div>
                <StudyAdvisor
                  cards={cards}
                  stats={stats}
                  treeData={treeData}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                    reloadData();
                  }}
                  onActivityLogged={() => reloadData()}
                />
              </div>
            ) : activeTab === 'cheatsheet' ? (
              <div className="w-full">
                <CheatSheetVault onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
              </div>
            ) : activeTab === 'mindmap' ? (
              <div className="w-full">
                <MindMapStudio
                  onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab as any);
                    reloadData();
                  }}
                  onCardsAdded={() => reloadData()}
                />
              </div>
            ) : (
              <div className="w-full">
                <FeynmanStudio
                  onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                    reloadData();
                  }}
                  onCardsAdded={() => reloadData()}
                />
              </div>
            )}
          </main>

          {/* Thanh điều hướng cố định dưới đáy màn hình trên Mobile */}
          <MobileBottomNav
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              reloadData();
            }}
            onOpenMenu={() => setIsSidebarOpen(true)}
            dueCount={dueCards.length}
            quizCount={quizCount}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          />
        </div>
      )}

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        defaultCategory={selectedCategory === 'all' ? 'code' : selectedCategory}
        onCardAdded={() => reloadData()}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChanged={() => reloadData()}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal
        isOpen={isDeleteCategoryOpen}
        onClose={() => setIsDeleteCategoryOpen(false)}
        cards={cards}
        onDeleted={(msg) => {
          reloadData();
          showGlobalToast(msg);
        }}
      />

      {/* Achievements & Mastery Badges Modal */}
      {isAchievementsOpen && (
        <AchievementsModal
          stats={achievementStats}
          onClose={() => setIsAchievementsOpen(false)}
        />
      )}

      {/* Sổ Tay Lỗi Sai Thông Minh */}
      <MistakeNotebookModal
        isOpen={isMistakesOpen}
        onClose={() => setIsMistakesOpen(false)}
        onStartRevengeQuiz={handleStartRevengeQuiz}
      />

      {/* 1-Click Biến Tài Liệu Thành Thẻ Học & Quiz */}
      <InstantCardGeneratorModal
        isOpen={isCardGeneratorOpen}
        onClose={() => {
          setIsCardGeneratorOpen(false);
          setCardGenInitialText('');
          setCardGenDocTitle('');
        }}
        initialText={cardGenInitialText}
        sourceDocTitle={cardGenDocTitle}
        onSuccess={(createdCards, createdQuizzes) => {
          reloadData();
          showGlobalToast(`Đã tạo thành công ${createdCards} thẻ học và ${createdQuizzes} câu quiz! 🎉`);
        }}
      />

      {/* Chế Độ Podcast Ôn Bài Rảnh Tay */}
      <AudioFlashcardModal
        isOpen={isAudioFlashcardOpen}
        onClose={() => setIsAudioFlashcardOpen(false)}
        cards={dueCards.length > 0 ? dueCards : cards}
        onFinish={() => {
          reloadData();
          showGlobalToast('Đã hoàn thành phiên Podcast ôn bài rảnh tay! 🎧');
        }}
      />

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed top-5 right-5 z-[100] p-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{globalToast}</span>
        </div>
      )}
    </div>
  );
}
