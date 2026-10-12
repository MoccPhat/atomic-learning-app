import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Sparkles,
  BookOpen,
  Check,
  Plus,
  Save,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  Send,
} from 'lucide-react';
import { StoredFile } from '../../lib/tree-types';
import { downloadStoredFile } from '../../lib/tree-storage';
import { decodeStoredFileData, dataUrlToArrayBuffer } from '../../lib/file-utils';
import { readDocxFromBuffer, DocxDocument } from '../../lib/docx-reader-service';
import { getCornellNotes, createCornellNote, updateCornellNote } from '../../lib/cornell-storage';
import { addCard } from '../../lib/storage';
import { Category } from '../../lib/types';

interface SplitScreenReaderModalProps {
  isOpen: boolean;
  file: StoredFile | null;
  onClose: () => void;
  onCardAdded?: () => void;
  onCornellUpdated?: () => void;
}

export const SplitScreenReaderModal: React.FC<SplitScreenReaderModalProps> = ({
  isOpen,
  file,
  onClose,
  onCardAdded,
  onCornellUpdated,
}) => {
  // Trạng thái tài liệu bên trái
  const [textPreview, setTextPreview] = useState<string>('');
  const [docxDoc, setDocxDoc] = useState<DocxDocument | null>(null);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedDocText, setSelectedDocText] = useState('');

  // Trạng thái trạm ghi chép bên phải (Tab 'cornell' | 'flashcard')
  const [rightTab, setRightTab] = useState<'cornell' | 'flashcard'>('cornell');

  // Ghi chú Cornell
  const [activeCornellId, setActiveCornellId] = useState<string>('');
  const [cornellTitle, setCornellTitle] = useState('');
  const [cornellCuesText, setCornellCuesText] = useState('');
  const [cornellMainNotes, setCornellMainNotes] = useState('');
  const [cornellSummary, setCornellSummary] = useState('');

  // Flashcard
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardCategory, setCardCategory] = useState<Category>('code');

  // Toast thông báo
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Nạp dữ liệu khi file thay đổi
  useEffect(() => {
    if (!isOpen || !file) return;

    const ext = (file.extension || '').toLowerCase();
    if (ext === 'docx') {
      setIsLoadingDocx(true);
      const buffer = dataUrlToArrayBuffer(file.data);
      readDocxFromBuffer(buffer)
        .then((doc) => {
          setDocxDoc(doc);
          setTextPreview(doc.rawText);
        })
        .finally(() => setIsLoadingDocx(false));
    } else {
      const decoded = decodeStoredFileData(file);
      setTextPreview(decoded);
      setDocxDoc(null);
    }

    // Nạp danh sách ghi chú Cornell
    const notes = getCornellNotes();
    if (notes.length > 0) {
      const first = notes[0];
      setActiveCornellId(first.id);
      setCornellTitle(first.title);
      setCornellMainNotes(first.notes);
      setCornellSummary(first.summary);
      setCornellCuesText(first.cues.map((c) => c.cue).join('\n'));
    } else {
      // Tạo sẵn 1 bài ghi chú mới gắn với tên file
      const created = createCornellNote({
        title: `Ghi chú: ${file.name}`,
        notes: '',
        summary: '',
      });
      setActiveCornellId(created.id);
      setCornellTitle(created.title);
      setCornellMainNotes('');
      setCornellSummary('');
      setCornellCuesText('');
    }
  }, [isOpen, file]);

  // Lắng nghe bôi đen trong tài liệu bên trái
  const handleLeftDocSelection = () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString().trim();
      if (text.length > 2) {
        setSelectedDocText(text);
      }
    }
  };

  // Chèn text đã bôi đen sang Cues Cornell
  const handleSendToCornellCues = () => {
    if (!selectedDocText) return;
    setCornellCuesText((prev) => (prev ? prev + '\n' + selectedDocText : selectedDocText));
    setRightTab('cornell');
    showToast('Đã chèn đoạn trích dẫn vào cột Cues Cornell!');
  };

  // Chèn text đã bôi đen sang Ghi chú chính Cornell
  const handleSendToCornellNotes = () => {
    if (!selectedDocText) return;
    setCornellMainNotes((prev) => (prev ? prev + '\n\n' + selectedDocText : selectedDocText));
    setRightTab('cornell');
    showToast('Đã chèn đoạn văn vào Nội dung bài học Cornell!');
  };

  // Chèn text đã bôi đen sang Mặt sau Flashcard
  const handleSendToFlashcardBack = () => {
    if (!selectedDocText) return;
    setCardBack(selectedDocText);
    setRightTab('flashcard');
    showToast('Đã chèn trích dẫn vào Mặt sau thẻ Flashcard!');
  };

  // Lưu bài Cornell
  const handleSaveCornell = () => {
    if (!activeCornellId) return;
    const cuesArray = cornellCuesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((cue, idx) => ({
        id: `cue-${Date.now()}-${idx}`,
        cue,
        referenceAnswer: '',
      }));

    updateCornellNote(activeCornellId, {
      title: cornellTitle.trim() || 'Ghi chú bài học',
      notes: cornellMainNotes,
      summary: cornellSummary,
      cues: cuesArray.length > 0 ? cuesArray : [{ id: `cue-${Date.now()}`, cue: '', referenceAnswer: '' }],
    });

    if (onCornellUpdated) onCornellUpdated();
    showToast('Đã lưu bài ghi chú Cornell thành công!');
  };

  // Tạo thẻ Flashcard mới
  const handleCreateCardSubmit = () => {
    if (!cardFront.trim() || !cardBack.trim()) {
      showToast('Vui lòng điền đủ câu hỏi (Mặt trước) và câu trả lời (Mặt sau)!');
      return;
    }

    addCard({
      title: cardFront.slice(0, 50).trim() || 'Thẻ ghi nhớ',
      front: cardFront.trim(),
      back: cardBack.trim(),
      category: cardCategory,
      tags: file ? [file.extension, 'split-reader'] : ['split-reader'],
    });

    setCardFront('');
    setCardBack('');
    if (onCardAdded) onCardAdded();
    showToast('Đã thêm thẻ Flashcard SRS thành công!');
  };

  if (!isOpen || !file) return null;

  const ext = (file.extension || '').toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md animate-fade-in text-left select-text">
      {/* Toast thông báo */}
      {toast && (
        <div className="fixed top-4 right-16 z-50 p-2.5 px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                Split-Screen Mode
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                {file.name}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Đọc tài liệu bên trái và ghi chép Cornell / Flashcard song song bên phải
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Phóng to / Thu nhỏ chữ */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(80, prev - 10))}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="Thu nhỏ chữ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1 text-slate-600 dark:text-slate-400">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(160, prev + 10))}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="Phóng to chữ"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => downloadStoredFile(file)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải về</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng chế độ chia màn hình"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Split Grid (50% - 50%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 overflow-hidden">
        {/* NỬA TRÁI (50%): TRÌNH ĐỌC TÀI LIỆU */}
        <div
          onMouseUp={handleLeftDocSelection}
          className="bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden"
        >
          {/* Header Nửa Trái */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-500" /> Tài liệu: {file.name}
            </span>

            {/* Thanh thao tác nhanh với đoạn văn đã chọn */}
            {selectedDocText && (
              <div className="flex items-center gap-1 animate-fade-in">
                <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Trích dẫn:</span>
                <button
                  onClick={handleSendToCornellCues}
                  className="px-2 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                  title="Chèn vào Cột gợi ý (Cues) Cornell"
                >
                  <Send className="w-3 h-3" />
                  <span>Vào Cues</span>
                </button>
                <button
                  onClick={handleSendToCornellNotes}
                  className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                  title="Chèn vào Ghi chú chính"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Vào Note</span>
                </button>
                <button
                  onClick={handleSendToFlashcardBack}
                  className="px-2 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                  title="Chèn vào Mặt sau Flashcard"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Vào Card</span>
                </button>
              </div>
            )}
          </div>

          {/* Vùng đọc nội dung (Scrollable) */}
          <div
            style={{ fontSize: `${zoomLevel}%` }}
            className="flex-1 p-5 sm:p-6 overflow-y-auto leading-relaxed select-text space-y-4"
          >
            {/* 1. Tài liệu Word Docx */}
            {ext === 'docx' && (
              <div>
                {isLoadingDocx ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs">Đang giải mã văn bản Word...</p>
                  </div>
                ) : docxDoc && docxDoc.blocks.length > 0 ? (
                  <div className="space-y-4">
                    {docxDoc.blocks.map((b, idx) => {
                      if (b.type === 'heading') {
                        return (
                          <h4
                            key={idx}
                            className={`font-black text-slate-900 dark:text-white ${
                              b.level === 1 ? 'text-lg border-b pb-1 mt-4' : 'text-base mt-2'
                            }`}
                          >
                            {b.text}
                          </h4>
                        );
                      }
                      if (b.type === 'table' && b.tableRows) {
                        return (
                          <div key={idx} className="overflow-x-auto my-3">
                            <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-700">
                              <tbody>
                                {b.tableRows.map((row, rIdx) => (
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
                        <p key={idx} className="text-slate-800 dark:text-slate-200">
                          {b.text}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Không có văn bản nào trong file này.</p>
                )}
              </div>
            )}

            {/* 2. Text / Code / Markdown */}
            {ext !== 'docx' && !isImage && textPreview && (
              <pre className="font-mono text-xs text-slate-800 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed">
                {textPreview}
              </pre>
            )}

            {/* 3. Image */}
            {isImage && (
              <div className="flex items-center justify-center py-6">
                <img
                  src={file.data}
                  alt={file.name}
                  className="max-h-[70vh] rounded-2xl object-contain shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* NỬA PHẢI (50%): TRẠM GHI CHÉP CORNELL & FLASHCARD */}
        <div className="bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden">
          {/* Header Tab Nửa Phải */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setRightTab('cornell')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  rightTab === 'cornell'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ghi chú Cornell</span>
              </button>
              <button
                onClick={() => setRightTab('flashcard')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  rightTab === 'flashcard'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo Flashcard SRS</span>
              </button>
            </div>

            {rightTab === 'cornell' && (
              <button
                onClick={handleSaveCornell}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                title="Lưu bài ghi chú Cornell"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cornell</span>
              </button>
            )}
          </div>

          {/* Vùng làm việc Tab Cornell */}
          {rightTab === 'cornell' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tiêu đề ghi chú
                </label>
                <input
                  type="text"
                  value={cornellTitle}
                  onChange={(e) => setCornellTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Tiêu đề bài học..."
                />
              </div>

              {/* 3 Vùng Cornell: Cues & Main Notes (2 cột) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cột 1 (1 col): Cues / Từ khóa gợi ý */}
                <div className="sm:col-span-1 space-y-1">
                  <label className="block text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    Cues (Từ khóa / Câu hỏi)
                  </label>
                  <textarea
                    rows={10}
                    value={cornellCuesText}
                    onChange={(e) => setCornellCuesText(e.target.value)}
                    placeholder="Mỗi dòng 1 từ khóa hoặc câu hỏi ôn tập..."
                    className="w-full p-2.5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed resize-none"
                  />
                </div>

                {/* Cột 2 (2 cols): Ghi chú chính */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Notes (Nội dung bài học)
                  </label>
                  <textarea
                    rows={10}
                    value={cornellMainNotes}
                    onChange={(e) => setCornellMainNotes(e.target.value)}
                    placeholder="Ghi chép chi tiết, công thức, ví dụ..."
                    className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Vùng 3: Tổng kết Summary */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Summary (Tóm tắt cốt lõi)
                </label>
                <textarea
                  rows={3}
                  value={cornellSummary}
                  onChange={(e) => setCornellSummary(e.target.value)}
                  placeholder="2-3 câu tóm gọn ý cốt lõi nhất của bài học..."
                  className="w-full p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* Vùng làm việc Tab Flashcard */}
          {rightTab === 'flashcard' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 text-xs text-brand-800 dark:text-brand-300">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-4 h-4" /> Tạo thẻ Spaced Repetition (SRS)
                </p>
                <p className="text-[11px] opacity-80">
                  Bôi đen văn bản bên trái rồi bấm "Vào Card" để tự động điền câu trả lời!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mặt trước (Câu hỏi / Thuật ngữ / Cues) *
                </label>
                <textarea
                  rows={3}
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="Ví dụ: Thuật ngữ X có ý nghĩa gì? Điều kiện của định lý Y?"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mặt sau (Câu trả lời / Định nghĩa giải thích) *
                </label>
                <textarea
                  rows={5}
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="Nội dung giải thích chi tiết..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Danh mục thẻ
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'code', label: 'Lập trình' },
                    { key: 'english', label: 'Ngoại ngữ' },
                    { key: 'book', label: 'Sách vở' },
                    { key: 'exam', label: 'Thi cử' },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCardCategory(c.key as Category)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                        cardCategory === c.key
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateCardSubmit}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-98 transition-all mt-4"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm thẻ vào bộ nhớ dài hạn</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
