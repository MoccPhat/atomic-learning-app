import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Zap,
  Search,
  BookOpen,
  Code,
  Globe,
  Award,
  Check,
  Eye,
  Edit3,
  Sparkles,
  Network,
} from 'lucide-react';
import { Category } from '../../lib/types';
import { CornellNote, CornellCue } from '../../lib/cornell-types';
import {
  getCornellNotes,
  createCornellNote,
  updateCornellNote,
  deleteCornellNote,
  convertCuesToFlashcards,
  exportCornellNoteToMarkdown,
} from '../../lib/cornell-storage';
import { convertCornellNoteToMindMap } from '../../lib/mindmap-storage';
import { TreeData } from '../../lib/tree-types';

interface CornellNotesStudioProps {
  treeData?: TreeData;
  onActivityLogged?: () => void;
  onNavigateToTab?: (
    tab:
      | 'cards'
      | 'quiz'
      | 'tree'
      | 'pomodoro'
      | 'scanner'
      | 'cornell'
      | 'advisor'
      | 'feynman'
      | 'cheatsheet'
      | 'mindmap'
  ) => void;
  onCardsAdded?: () => void;
}

const CATEGORY_MAP: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  code: { label: 'Lập trình', icon: <Code className="w-4 h-4" />, color: 'text-indigo-500' },
  english: { label: 'Ngoại ngữ', icon: <Globe className="w-4 h-4" />, color: 'text-sky-500' },
  book: { label: 'Đọc sách', icon: <BookOpen className="w-4 h-4" />, color: 'text-emerald-500' },
  exam: { label: 'Ôn thi cử', icon: <Award className="w-4 h-4" />, color: 'text-amber-500' },
};

export const CornellNotesStudio: React.FC<CornellNotesStudioProps> = ({
  treeData,
  onActivityLogged,
  onNavigateToTab,
  onCardsAdded,
}) => {
  const [notes, setNotes] = useState<CornellNote[]>(() => getCornellNotes());
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    const list = getCornellNotes();
    return list.length > 0 ? list[0].id : '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<Category | 'all'>('all');
  const [activePreviewMode, setActivePreviewMode] = useState<'split' | 'edit' | 'preview'>('edit');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lấy ghi chú đang chọn
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Cập nhật trường trong activeNote
  const handleUpdateActiveNote = (updates: Partial<CornellNote>) => {
    if (!activeNote) return;
    const updated = updateCornellNote(activeNote.id, updates);
    if (updated) {
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }
  };

  // Tạo ghi chú mới
  const handleCreateNewNote = () => {
    const newNote = createCornellNote({
      title: 'Ghi chú bài học mới',
      category: selectedFilterCategory === 'all' ? 'code' : selectedFilterCategory,
      subjectGroup: treeData?.groups?.[0]?.name || 'Môn học mới',
      weekNumber: 1,
      cues: [
        { id: `cue-${Date.now()}-1`, cue: '', referenceAnswer: '' },
      ],
      notes: '## Nội dung bài học\n\n- Ghi chép các ý chính ở đây...\n- Hỗ trợ công thức $E = mc^2$ hoặc khối code ```python',
      summary: '',
      tags: [],
    });
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    showToast(`Đã tạo ghi chú mới "${newNote.title}"!`);
  };

  // Xóa ghi chú
  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const noteToDelete = notes.find((n) => n.id === id);
    const title = noteToDelete?.title || 'ghi chú';
    deleteCornellNote(id);
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id) {
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : '');
    }
    showToast(`Đã xóa "${title}" thành công!`);
  };

  // Thêm Cue mới
  const handleAddCue = () => {
    if (!activeNote) return;
    const newCue: CornellCue = {
      id: `cue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cue: '',
      referenceAnswer: '',
    };
    const updatedCues = [...activeNote.cues, newCue];
    handleUpdateActiveNote({ cues: updatedCues });
  };

  // Sửa Cue
  const handleUpdateCue = (cueId: string, field: 'cue' | 'referenceAnswer', val: string) => {
    if (!activeNote) return;
    const updatedCues = activeNote.cues.map((c) =>
      c.id === cueId ? { ...c, [field]: val } : c
    );
    handleUpdateActiveNote({ cues: updatedCues });
  };

  // Xóa Cue
  const handleDeleteCue = (cueId: string) => {
    if (!activeNote) return;
    const updatedCues = activeNote.cues.filter((c) => c.id !== cueId);
    handleUpdateActiveNote({ cues: updatedCues });
  };

  // 1-Click: Chuyển tất cả Cues sang Flashcard SRS
  const handleConvertToFlashcards = () => {
    if (!activeNote) return;
    const validCues = activeNote.cues.filter((c) => c.cue.trim());
    if (validCues.length === 0) {
      showToast('⚠️ Vui lòng nhập ít nhất 1 câu hỏi gợi nhớ (Cue) trước khi tạo thẻ!');
      return;
    }

    const result = convertCuesToFlashcards(activeNote.id);
    if (result.createdCount > 0) {
      showToast(`⚡ Đã chuyển thành công ${result.createdCount} câu hỏi sang bộ thẻ Flashcard SRS!`);
      onCardsAdded?.();
      onActivityLogged?.();
    }
  };

  // Tự động sinh sơ đồ tư duy Mindmap từ Cues & Summary
  const handleConvertToMindmap = () => {
    if (!activeNote) return;
    const newMap = convertCornellNoteToMindMap(activeNote);
    showToast(`🧠 Đã sinh sơ đồ tư duy "${newMap.title}" thành công!`);
    onActivityLogged?.();
    if (onNavigateToTab) {
      setTimeout(() => onNavigateToTab('mindmap'), 600);
    }
  };

  // Xuất Markdown
  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const md = exportCornellNoteToMarkdown(activeNote);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeNote.title.replace(/\s+/g, '_')}_Cornell.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file Markdown chuẩn Cornell!');
  };

  // Lọc ghi chú
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchCat = selectedFilterCategory === 'all' || n.category === selectedFilterCategory;
      const matchSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.cues.some((c) => c.cue.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [notes, selectedFilterCategory, searchQuery]);

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left animate-fade-in">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 shadow-2xl backdrop-blur-md border border-slate-700/50 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header chính: Cornell Notes Studio */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Ghi Chú Cornell
              </h1>
            </div>
          </div>
        </div>

        {/* Nút hành động chính */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleCreateNewNote}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo ghi chú mới</span>
          </button>

          {activeNote && (
            <>
              <button
                type="button"
                onClick={handleConvertToFlashcards}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all"
                title="Tự động biến tất cả Cues thành Flashcard ôn tập ngắt quãng"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>1-Click Sang Flashcard</span>
              </button>

              <button
                type="button"
                onClick={handleConvertToMindmap}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-xs"
                title="Tự động sinh sơ đồ tư duy trực quan từ Cues & Summary"
              >
                <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Sinh Mindmap</span>
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 transition-colors"
                title="Xuất file Markdown (.md)"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => handleDeleteNote(activeNote.id, e)}
                className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 text-rose-600 dark:text-rose-400 transition-colors"
                title="Xóa bài ghi chú này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Không gian làm việc 2 cột: Cột trái danh sách ghi chú, Cột phải là Khung soạn thảo Cornell 3 vùng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Cột 1: Danh sách bài ghi chú (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Thanh tìm kiếm & Lọc danh mục */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm ghi chú, cue, từ khóa..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
              {(['all', 'code', 'english', 'book', 'exam'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                    selectedFilterCategory === cat
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'Tất cả' : CATEGORY_MAP[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các ghi chú */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 font-medium">Chưa có bài ghi chú nào.</p>
                <button
                  onClick={handleCreateNewNote}
                  className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  + Tạo bài đầu tiên
                </button>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                const catInfo = CATEGORY_MAP[note.category];

                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500/50 shadow-sm'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`flex items-center gap-1.5 text-[11px] font-bold ${catInfo.color}`}>
                        {catInfo.icon}
                        <span>{catInfo.label}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {note.cues.filter((c) => c.cue.trim()).length} cues
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {note.title}
                    </h3>

                    {note.summary && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {note.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                      <span>{note.subjectGroup || 'Chung'}</span>
                      <span>{new Date(note.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cột 2: BẢNG GHI CHÚ CHUẨN CORNELL (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {activeNote ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              {/* Thanh tiêu đề & Metadata của bài */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                    placeholder="Nhập tiêu đề bài học..."
                    className="text-lg sm:text-xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:outline-hidden focus:ring-0 w-full"
                  />

                  {/* Mode xem: Edit / Preview */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActivePreviewMode('edit')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activePreviewMode === 'edit'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Soạn thảo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewMode('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activePreviewMode === 'preview'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước</span>
                    </button>
                  </div>
                </div>

                {/* Metadata phân loại */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Danh mục */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Danh mục:</span>
                    <select
                      value={activeNote.category}
                      onChange={(e) => handleUpdateActiveNote({ category: e.target.value as Category })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border-none text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="code">Lập trình</option>
                      <option value="english">Ngoại ngữ</option>
                      <option value="book">Đọc sách</option>
                      <option value="exam">Ôn thi cử</option>
                    </select>
                  </div>

                  {/* Nhóm môn học liên kết */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Môn học:</span>
                    <input
                      type="text"
                      value={activeNote.subjectGroup || ''}
                      onChange={(e) => handleUpdateActiveNote({ subjectGroup: e.target.value })}
                      placeholder="Tên môn học..."
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border-none text-xs w-36 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Tuần học */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Tuần:</span>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={activeNote.weekNumber || 1}
                      onChange={(e) => handleUpdateActiveNote({ weekNumber: parseInt(e.target.value) || 1 })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border-none text-xs w-16 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* KHUNG CORNELL 3 VÙNG CHÍNH */}
              <div className="flex-1 flex flex-col">
                {/* HÀNG TRÊN: 2 CỘT (CUES BÊN TRÁI 35% & NOTES BÊN PHẢI 65%) */}
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] border-b border-slate-200/80 dark:border-slate-800">
                  {/* CỘT TRÁI: CUES / TỪ KHÓA / CÂU HỎI GỢI NHỚ (md:col-span-4) */}
                  <div className="md:col-span-4 p-4 border-r border-slate-200/80 dark:border-slate-800 bg-amber-50/20 dark:bg-slate-900/40 flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/50 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          1. Cột Gợi Nhớ (Cues)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 font-bold text-amber-800 dark:text-amber-300">
                          {activeNote.cues.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCue}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Cue</span>
                      </button>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
                      {activeNote.cues.map((cueItem, cueIdx) => (
                        <div
                          key={cueItem.id}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2 group"
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-400">
                            <span>Câu hỏi / Khái niệm #{cueIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCue(cueItem.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                              title="Xóa cue này"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={cueItem.cue}
                            onChange={(e) => handleUpdateCue(cueItem.id, 'cue', e.target.value)}
                            placeholder="Từ khóa, khái niệm hoặc câu hỏi gợi nhớ cốt lõi..."
                            className="w-full text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-none"
                          />

                          <input
                            type="text"
                            value={cueItem.referenceAnswer || ''}
                            onChange={(e) => handleUpdateCue(cueItem.id, 'referenceAnswer', e.target.value)}
                            placeholder="Gợi ý đáp án / Mặt sau thẻ (Tùy chọn)..."
                            className="w-full text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddCue}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-300 dark:border-slate-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm câu hỏi / từ khóa mới</span>
                      </button>
                    </div>
                  </div>

                  {/* CỘT PHẢI: NOTES / GHI CHÉP BÀI HỌC CHÍNH (md:col-span-8) */}
                  <div className="md:col-span-8 p-4 flex flex-col bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        2. Ghi Chép Chi Tiết (Notes Area)
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Hỗ trợ Markdown & Code</span>
                      </div>
                    </div>

                    {activePreviewMode === 'edit' ? (
                      <textarea
                        value={activeNote.notes}
                        onChange={(e) => handleUpdateActiveNote({ notes: e.target.value })}
                        placeholder="Viết nội dung bài học ở đây: các định lý, công thức toán $...$, khối code ```, danh sách gạch đầu dòng..."
                        className="w-full flex-1 min-h-[380px] p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-y"
                      />
                    ) : (
                      <div className="w-full flex-1 min-h-[380px] p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 overflow-y-auto max-h-[500px] text-left text-xs sm:text-sm space-y-3 leading-relaxed text-slate-800 dark:text-slate-200">
                        {activeNote.notes.split('\n\n').map((paragraph, pIdx) => {
                          if (paragraph.startsWith('###')) {
                            return <h3 key={pIdx} className="text-base font-bold text-slate-900 dark:text-white pt-2">{paragraph.replace('###', '')}</h3>;
                          }
                          if (paragraph.startsWith('##')) {
                            return <h2 key={pIdx} className="text-lg font-black text-slate-900 dark:text-white pt-3">{paragraph.replace('##', '')}</h2>;
                          }
                          if (paragraph.startsWith('```')) {
                            const cleanCode = paragraph.replace(/```[a-z]*\n?/g, '');
                            return (
                              <pre key={pIdx} className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto my-2">
                                <code>{cleanCode}</code>
                              </pre>
                            );
                          }
                          return <p key={pIdx}>{paragraph}</p>;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* HÀNG DƯỚI: SUMMARY / TÓM TẮT ĐÚC KẾT TOÀN BÀI (FULL WIDTH) */}
                <div className="p-4 sm:p-5 bg-emerald-50/30 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/40 dark:border-emerald-800/30">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>3. Tóm Tắt Toàn Bài (Summary)</span>
                    </span>
                    <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                      Đúc kết bài học trong 2 - 3 câu để nhớ lâu
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={activeNote.summary}
                    onChange={(e) => handleUpdateActiveNote({ summary: e.target.value })}
                    placeholder="Viết 2-3 câu ngắn gọn tóm tắt lại toàn bộ tinh hoa của bài học này..."
                    className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 border border-emerald-300/80 dark:border-emerald-700/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none shadow-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Chưa chọn bài ghi chú</h3>
              <p className="text-xs text-slate-400 mt-1">Chọn một bài ghi chú bên trái hoặc tạo bài mới.</p>
              <button
                onClick={handleCreateNewNote}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                + Tạo bài mới
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
