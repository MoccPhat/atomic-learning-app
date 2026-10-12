import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  FileText,
  Copy,
  Check,
  Code,
  Sparkles,
  BookOpen,
  Calendar,
  HardDrive,
  Edit3,
  Save,
  Highlighter,
  Bookmark,
  Trash2,
  Layers,
  HelpCircle
} from 'lucide-react';
import { StoredFile, FileHighlight } from '../../lib/tree-types';
import { downloadStoredFile } from '../../lib/tree-storage';
import { decodeStoredFileData, dataUrlToArrayBuffer, formatFileSize } from '../../lib/file-utils';
import { readDocxFromBuffer, DocxDocument } from '../../lib/docx-reader-service';

interface FilePreviewModalProps {
  file: StoredFile | null;
  onClose: () => void;
  onSaveContent?: (fileId: string, newContent: string) => Promise<void>;
  onSaveHighlights?: (fileId: string, highlights: FileHighlight[]) => Promise<void>;
  onCreateFlashcard?: (selectedText: string) => void;
  onAddToCornell?: (selectedText: string) => void;
  onCreateQuiz?: (selectedText: string) => void;
  onOpenSplitView?: (file: StoredFile) => void;
  onExtractCards?: (fileContent: string, fileName: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onSaveContent,
  onSaveHighlights,
  onCreateFlashcard,
  onAddToCornell,
  onCreateQuiz,
  onOpenSplitView,
  onExtractCards,
}) => {
  const [copied, setCopied] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [ipynbData, setIpynbData] = useState<{
    cells?: Array<{
      cell_type: string;
      source: string[] | string;
      outputs?: Array<{ text?: string[] | string }>;
    }>;
  } | null>(null);

  // Trạng thái đọc Docx
  const [docxDoc, setDocxDoc] = useState<DocxDocument | null>(null);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);

  // Chế độ chỉnh sửa (In-Vault Editor)
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Quản lý Bút nhớ dòng (Highlighter & Quotes Stash)
  const [highlights, setHighlights] = useState<FileHighlight[]>(file?.highlights || []);
  const [isQuotesStashOpen, setIsQuotesStashOpen] = useState(false);

  // Thanh công cụ nổi khi bôi đen văn bản (Doc-to-Study Bridge)
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ top: number; left: number } | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Toast thông báo cục bộ
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!file) {
      setTextPreview(null);
      setIpynbData(null);
      setDocxDoc(null);
      setIsEditing(false);
      setHighlights([]);
      return;
    }

    setHighlights(file.highlights || []);
    const ext = (file.extension || '').toLowerCase();

    // 1. Phân tích Jupyter Notebook (.ipynb)
    if (ext === 'ipynb') {
      try {
        const rawJson = decodeStoredFileData(file);
        const parsed = JSON.parse(rawJson);
        setIpynbData(parsed);
        setTextPreview(rawJson);
        setEditContent(rawJson);
      } catch (e) {
        console.warn('Error parsing ipynb:', e);
      }
    }
    // 2. Phân tích Word (.docx)
    else if (ext === 'docx') {
      setIsLoadingDocx(true);
      const buffer = dataUrlToArrayBuffer(file.data);
      readDocxFromBuffer(buffer)
        .then((doc) => {
          setDocxDoc(doc);
          setTextPreview(doc.rawText);
        })
        .finally(() => setIsLoadingDocx(false));
    }
    // 3. Phân tích File Text / Code / Markdown / CSV / JSON
    else if (
      [
        'py',
        'js',
        'ts',
        'html',
        'css',
        'json',
        'md',
        'markdown',
        'txt',
        'csv',
        'sql',
        'sh',
        'xml',
        'yaml',
        'yml'
      ].includes(ext)
    ) {
      const decoded = decodeStoredFileData(file);
      setTextPreview(decoded);
      setEditContent(decoded);
    }
  }, [file]);

  // Lắng nghe bôi đen văn bản trong trình đọc
  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectedText('');
      setSelectionPosition(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length >= 3) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionPosition({
          top: Math.max(10, rect.top - 52),
          left: Math.max(10, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 140)),
        });
      } catch {
        setSelectedText(text);
      }
    } else {
      setSelectedText('');
      setSelectionPosition(null);
    }
  };

  // Lắng nghe phím tắt Ctrl + S khi đang soạn thảo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (isEditing && file) {
          e.preventDefault();
          handleSaveEdit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editContent, file]);

  if (!file) return null;

  const ext = (file.extension || '').toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  const isEditable = [
    'py', 'js', 'ts', 'html', 'css', 'json', 'md', 'markdown', 'txt', 'csv', 'sql', 'sh', 'xml', 'yaml', 'yml'
  ].includes(ext);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Lưu nội dung chỉnh sửa
  const handleSaveEdit = async () => {
    if (!onSaveContent || !file) return;
    setIsSaving(true);
    try {
      await onSaveContent(file.id, editContent);
      setTextPreview(editContent);
      setHasUnsavedChanges(false);
      setIsEditing(false);
      showToast('Đã lưu các thay đổi vào kho tài liệu an toàn! (Ctrl+S)');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi lưu nội dung file');
    } finally {
      setIsSaving(false);
    }
  };

  // Thêm đánh dấu Bút nhớ dòng
  const handleAddHighlight = async (color: 'yellow' | 'green' | 'pink' | 'blue') => {
    if (!selectedText || !file) return;

    const newHl: FileHighlight = {
      id: 'hl-' + Date.now(),
      text: selectedText,
      color,
      createdAt: new Date().toISOString(),
    };

    const nextList = [newHl, ...highlights];
    setHighlights(nextList);
    setSelectedText('');
    setSelectionPosition(null);

    if (onSaveHighlights) {
      await onSaveHighlights(file.id, nextList);
    }
    showToast('Đã lưu đoạn trích dẫn vào Sổ tay Bút nhớ dòng!');
  };

  // Xóa đánh dấu bút nhớ
  const handleDeleteHighlight = async (hlId: string) => {
    const nextList = highlights.filter((h) => h.id !== hlId);
    setHighlights(nextList);
    if (onSaveHighlights && file) {
      await onSaveHighlights(file.id, nextList);
    }
    showToast('Đã xóa đánh dấu trích dẫn');
  };

  // Màu sắc cho bút nhớ
  const getHighlightBg = (color: FileHighlight['color']) => {
    switch (color) {
      case 'yellow':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800';
      case 'green':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800';
      case 'pink':
        return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800';
      case 'blue':
        return 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in select-text">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-left relative">
        {/* Toast thông báo */}
        {toast && (
          <div className="absolute top-4 right-16 z-50 p-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        {/* Floating Action Toolbar khi bôi đen văn bản */}
        {selectionPosition && selectedText && (
          <div
            style={{
              position: 'fixed',
              top: `${selectionPosition.top}px`,
              left: `${selectionPosition.left}px`,
              zIndex: 9999,
            }}
            className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-fade-in backdrop-blur-md"
          >
            {/* Tạo Flashcard */}
            {onCreateFlashcard && (
              <button
                onClick={() => {
                  onCreateFlashcard(selectedText);
                  setSelectedText('');
                  setSelectionPosition(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-[11px] font-bold text-white transition-colors"
                title="Biến đoạn văn này thành thẻ học Flashcard SRS"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Tạo Flashcard</span>
              </button>
            )}

            {/* Thêm vào Cornell Cues */}
            {onAddToCornell && (
              <button
                onClick={() => {
                  onAddToCornell(selectedText);
                  setSelectedText('');
                  setSelectionPosition(null);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition-colors"
                title="Gửi đoạn văn này sang bài Ghi chú Cornell"
              >
                <BookOpen className="w-3 h-3 text-sky-400" />
                <span>Vào Cornell</span>
              </button>
            )}

            {/* Tạo câu hỏi Quiz */}
            {onCreateQuiz && (
              <button
                onClick={() => {
                  onCreateQuiz(selectedText);
                  setSelectedText('');
                  setSelectionPosition(null);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition-colors"
                title="Chuyển thành câu hỏi luyện thi trắc nghiệm"
              >
                <HelpCircle className="w-3 h-3 text-purple-400" />
                <span>Tạo Quiz</span>
              </button>
            )}

            {/* Các nút Bút nhớ dòng */}
            <div className="h-4 w-px bg-slate-700 mx-0.5" />
            <button
              onClick={() => handleAddHighlight('yellow')}
              className="w-5 h-5 rounded-full bg-amber-400 hover:scale-110 active:scale-95 transition-transform"
              title="Highlight Vàng"
            />
            <button
              onClick={() => handleAddHighlight('green')}
              className="w-5 h-5 rounded-full bg-emerald-400 hover:scale-110 active:scale-95 transition-transform"
              title="Highlight Xanh"
            />
            <button
              onClick={() => handleAddHighlight('pink')}
              className="w-5 h-5 rounded-full bg-rose-400 hover:scale-110 active:scale-95 transition-transform"
              title="Highlight Hồng"
            />
          </div>
        )}

        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 shrink-0">
              {ext === 'ipynb' ? (
                <Code className="w-5 h-5 text-amber-500" />
              ) : ext === 'docx' ? (
                <FileText className="w-5 h-5 text-blue-500" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                  {file.name}
                </h3>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                    Đang Soạn Thảo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <HardDrive className="w-3 h-3" />
                  {formatFileSize(file.size)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                </span>
                {highlights.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    <Highlighter className="w-3 h-3" />
                    {highlights.length} trích dẫn
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Nút Đọc chia đôi màn hình Split-Screen */}
            {onOpenSplitView && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSplitView(file);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-all"
                title="Đọc tài liệu chia đôi màn hình song song với Ghi chú Cornell / Flashcard"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Chia màn hình</span>
              </button>
            )}

            {/* Nút 1-Click Rút trích Thẻ Học & Quiz */}
            {onExtractCards && (
              <button
                onClick={() => {
                  const content = isEditing && editContent
                    ? editContent
                    : textPreview ||
                      (docxDoc?.rawText || '') ||
                      (ipynbData?.cells ? ipynbData.cells.map((c) => (Array.isArray(c.source) ? c.source.join('') : c.source)).join('\n') : '');
                  if (!content.trim()) {
                    showToast('Tệp tin chưa có nội dung văn bản để rút trích!');
                    return;
                  }
                  onExtractCards(content, file.name);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 transition-all shadow-xs"
                title="1-Click trích xuất Flashcards và Quiz từ tài liệu này"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="hidden md:inline">Tạo Thẻ & Quiz</span>
              </button>
            )}

            {/* Nút Xem sổ tay trích dẫn Bút nhớ */}
            <button
              onClick={() => setIsQuotesStashOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isQuotesStashOpen
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Xem các đoạn văn đã bôi bút nhớ"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trích dẫn ({highlights.length})</span>
            </button>

            {/* Nút Bật/Tắt Soạn thảo (In-Vault Editor) */}
            {isEditable && !isEditing && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditContent(textPreview || '');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all"
                title="Chỉnh sửa nội dung file trực tiếp"
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="hidden sm:inline">Soạn thảo</span>
              </button>
            )}

            {/* Nút Lưu khi đang soạn thảo */}
            {isEditing && (
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
                title="Lưu các thay đổi (Ctrl + S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu (Ctrl+S)'}</span>
              </button>
            )}

            {/* Nút Tải file về */}
            <button
              onClick={() => downloadStoredFile(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
              title="Tải file về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải về</span>
            </button>

            {/* Nút Đóng */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thân Nội dung Modal */}
        <div
          ref={contentContainerRef}
          onMouseUp={handleTextSelection}
          className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4"
        >
          {file.note && !isEditing && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Ghi chú:</span>
              <p>{file.note}</p>
            </div>
          )}

          {/* Sổ tay trích dẫn cốt lõi (Key Quotes Stash) */}
          {isQuotesStashOpen && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-amber-600" /> Sổ tay trích dẫn cốt lõi ({highlights.length})
                </span>
                {highlights.length > 0 && onCreateFlashcard && (
                  <button
                    onClick={() => {
                      const allQuotes = highlights.map((h, i) => `${i + 1}. ${h.text}`).join('\n\n');
                      onCreateFlashcard(allQuotes);
                      showToast('Đã chuyển toàn bộ trích dẫn sang Flashcards!');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Biến tất cả thành Flashcards</span>
                  </button>
                )}
              </div>

              {highlights.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Chưa có đoạn trích dẫn nào. Hãy bôi đen bất kỳ đoạn văn bản nào bên dưới và chọn màu bút nhớ để lưu vào đây!
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {highlights.map((hl) => (
                    <div
                      key={hl.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${getHighlightBg(
                        hl.color
                      )}`}
                    >
                      <p className="font-medium leading-relaxed italic">"{hl.text}"</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(hl.text)}
                          className="p-1 hover:text-slate-900 dark:hover:text-white"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteHighlight(hl.id)}
                          className="p-1 hover:text-rose-600"
                          title="Xóa trích dẫn"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1. CHẾ ĐỘ SOẠN THẢO TRỰC TIẾP (IN-VAULT EDITOR) */}
          {isEditing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Soạn thảo: {file.name}</span>
                <span>{editContent.split('\n').length} dòng | Phím tắt: Ctrl + S</span>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                rows={18}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y selection:bg-brand-500/40"
                placeholder="Nhập nội dung mã nguồn hoặc ghi chú tại đây..."
              />
            </div>
          )}

          {/* 2. XEM TRƯỚC VĂN BẢN WORD (.DOCX) THUẦN TRÌNH DUYỆT */}
          {!isEditing && ext === 'docx' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Trình đọc Word (.DOCX) Native
                </span>
                {docxDoc && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {docxDoc.paragraphsCount} đoạn | ~{docxDoc.wordsCount} từ
                  </span>
                )}
              </div>

              {isLoadingDocx ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Đang giải mã tài liệu Word...</p>
                </div>
              ) : docxDoc && docxDoc.blocks.length > 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[60vh] overflow-y-auto leading-relaxed">
                  {docxDoc.blocks.map((block, idx) => {
                    if (block.type === 'heading') {
                      return (
                        <h4
                          key={idx}
                          className={`font-black text-slate-900 dark:text-white ${
                            block.level === 1 ? 'text-lg sm:text-xl border-b pb-1 mt-3' : 'text-base mt-2'
                          }`}
                        >
                          {block.text}
                        </h4>
                      );
                    }
                    if (block.type === 'table' && block.tableRows) {
                      return (
                        <div key={idx} className="overflow-x-auto my-3">
                          <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-700">
                            <tbody>
                              {block.tableRows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className={rIdx === 0 ? 'bg-slate-100 dark:bg-slate-800 font-bold' : ''}
                                >
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="p-2 border border-slate-300 dark:border-slate-700"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <p className="text-xs">Tệp Word không chứa đoạn văn bản nào hoặc định dạng đặc biệt.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. XEM TRƯỚC JUPYTER NOTEBOOK (.IPYNB) */}
          {!isEditing && ext === 'ipynb' && ipynbData?.cells && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Xem trước nội dung Jupyter Notebook
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {ipynbData.cells.length} cells
                </span>
              </div>

              {ipynbData.cells.map((cell, idx) => {
                const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
                const isCode = cell.cell_type === 'code';

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isCode
                        ? 'bg-slate-950 border-slate-800 text-slate-100'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-3.5'
                    }`}
                  >
                    {isCode ? (
                      <div>
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                          <span>In [{idx + 1}] (Python)</span>
                          <button
                            onClick={() => handleCopy(source)}
                            className="p-1 hover:text-white"
                            title="Sao chép cell"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                          {source}
                        </pre>
                        {cell.outputs && cell.outputs.length > 0 && (
                          <div className="px-3 py-2 bg-slate-900/70 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Kết quả chạy:</span>
                            {cell.outputs.map((out, oIdx) => (
                              <div key={oIdx} className="whitespace-pre-wrap">
                                {Array.isArray(out.text) ? out.text.join('') : out.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                        {source}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. XEM TRƯỚC TEXT / CODE / MARKDOWN */}
          {!isEditing && textPreview !== null && ext !== 'ipynb' && ext !== 'docx' && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Nội dung tệp tin ({ext.toUpperCase()})
                </span>
                <button
                  onClick={() => handleCopy(textPreview)}
                  className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[65vh]">
                {textPreview}
              </pre>
            </div>
          )}

          {/* 5. XEM TRƯỚC HÌNH ẢNH */}
          {!isEditing && isImage && (
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <img
                src={file.data}
                alt={file.name}
                className="max-h-80 rounded-xl object-contain shadow-sm"
              />
            </div>
          )}

          {/* 6. XEM TRƯỚC TÀI LIỆU PDF TRỰC TIẾP */}
          {!isEditing && ext === 'pdf' && (
            <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-inner">
              <iframe
                src={file.data}
                title={file.name}
                className="w-full h-full border-0 rounded-2xl"
              />
            </div>
          )}

          {/* 7. TÀI LIỆU KHÔNG HỖ TRỢ XEM TRỰC TIẾP */}
          {!isEditing &&
            !textPreview &&
            !isImage &&
            ext !== 'ipynb' &&
            ext !== 'docx' &&
            ext !== 'pdf' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center shadow-md">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Tài liệu sẵn sàng để mở trên thiết bị
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Tệp <span className="font-semibold text-slate-700 dark:text-slate-300">.{ext.toUpperCase()}</span> đã được lưu trữ an toàn trong kho dữ liệu cục bộ. Bạn có thể bấm "Tải về" để mở bằng ứng dụng trên máy.
                </p>
                <button
                  onClick={() => downloadStoredFile(file)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all mt-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp {file.name} về máy</span>
                </button>
              </div>
            )}
        </div>

        {/* Footer Modal */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span>Mẹo: Bôi đen chữ bất kỳ để tạo Flashcard hoặc Bút nhớ dòng</span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(textPreview || '');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Hủy sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
