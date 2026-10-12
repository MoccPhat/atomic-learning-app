import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Download,
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Sliders,
  Layers,
  Brain,
  Quote,
  Eye,
  Code
} from 'lucide-react';
import { Subject } from '../../lib/tree-types';
import { CornellNote } from '../../lib/cornell-types';
import { Card } from '../../lib/types';
import {
  generateSubjectDigest,
  downloadStudyDigestMarkdown,
  DigestOptions
} from '../../lib/study-digest-service';

interface StudyDigestModalProps {
  subject: Subject;
  cornellNotes: CornellNote[];
  cards: Card[];
  onClose: () => void;
}

export const StudyDigestModal: React.FC<StudyDigestModalProps> = ({
  subject,
  cornellNotes,
  cards,
  onClose
}) => {
  const [authorName, setAuthorName] = useState('Kai');
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeCornellNotes, setIncludeCornellNotes] = useState(true);
  const [includeHighlights, setIncludeHighlights] = useState(true);
  const [includeFlashcards, setIncludeFlashcards] = useState(true);
  const [includeFileList, setIncludeFileList] = useState(true);

  const [activeTab, setActiveTab] = useState<'preview' | 'markdown'>('preview');
  const [copied, setCopied] = useState(false);

  const options: DigestOptions = {
    includeOverview,
    includeCornellNotes,
    includeHighlights,
    includeFlashcards,
    includeFileList,
    authorName
  };

  const digestResult = useMemo(() => {
    return generateSubjectDigest(subject, cornellNotes, cards, options);
  }, [subject, cornellNotes, cards, options]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(digestResult.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadStudyDigestMarkdown(digestResult.fileName, digestResult.markdown);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-text">
      <div className="w-full max-w-5xl h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-left">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400">
                  E-Book Packager
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {digestResult.generatedAt}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg truncate mt-0.5">
                Cẩm Nang Ôn Tập Cấp Tốc: {subject.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-95"
              title="Tải về file Markdown (.md)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải .MD</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              title="In ra giấy hoặc lưu thành file PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In / Xuất PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors ml-1"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thống kê nhanh & Tùy chọn cấu hình */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Quick stats pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {digestResult.totalWeeks} Tuần học
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {digestResult.totalNotes} Cornell Notes
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5" />
              {digestResult.totalHighlights} Trích dẫn bút nhớ
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              {digestResult.totalCards} Thẻ Flashcard
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Xem bản in E-Book
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'markdown'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Mã Markdown
            </button>
          </div>
        </div>

        {/* Tùy chọn lọc nội dung (Config Checkboxes) */}
        <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 flex-wrap text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0">
          <span className="flex items-center gap-1 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <Sliders className="w-3 h-3" /> Tùy chọn:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-brand-400">
            <input
              type="checkbox"
              checked={includeOverview}
              onChange={(e) => setIncludeOverview(e.target.checked)}
              className="rounded text-brand-600 focus:ring-0"
            />
            Mục lục tuần
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-brand-400">
            <input
              type="checkbox"
              checked={includeCornellNotes}
              onChange={(e) => setIncludeCornellNotes(e.target.checked)}
              className="rounded text-brand-600 focus:ring-0"
            />
            Ghi chú Cornell
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-brand-400">
            <input
              type="checkbox"
              checked={includeHighlights}
              onChange={(e) => setIncludeHighlights(e.target.checked)}
              className="rounded text-brand-600 focus:ring-0"
            />
            Bút nhớ trích dẫn
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-brand-400">
            <input
              type="checkbox"
              checked={includeFlashcards}
              onChange={(e) => setIncludeFlashcards(e.target.checked)}
              className="rounded text-brand-600 focus:ring-0"
            />
            Flashcard tóm tắt
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-brand-400">
            <input
              type="checkbox"
              checked={includeFileList}
              onChange={(e) => setIncludeFileList(e.target.checked)}
              className="rounded text-brand-600 focus:ring-0"
            />
            Danh mục file
          </label>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Tác giả:</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs w-24 text-center font-semibold"
            />
          </div>
        </div>

        {/* Vùng hiển thị nội dung chính (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20">
          {activeTab === 'preview' ? (
            /* Tab 1: Bản in E-Book đã format */
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg text-slate-800 dark:text-slate-100 leading-relaxed space-y-6">
              {/* Trang bìa cẩm nang */}
              <div className="border-b-2 border-brand-500/30 pb-6 text-center space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-500/10 text-brand-500 inline-block">
                  Cẩm Nang Tổng Hợp Môn Học
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {subject.name} {subject.code ? `(${subject.code})` : ''}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                  {subject.description || 'Tài liệu ôn tập tổng hợp toàn bộ bài học, ghi chú và câu hỏi then chốt.'}
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2 font-mono">
                  <span>Biên soạn: <strong className="text-slate-700 dark:text-slate-300">{authorName}</strong></span>
                  <span>•</span>
                  <span>Ngày: {digestResult.generatedAt}</span>
                </div>
              </div>

              {/* Nội dung Markdown trình bày thanh lịch */}
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {digestResult.markdown}
              </div>
            </div>
          ) : (
            /* Tab 2: Raw Markdown Source */
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-mono text-slate-500">
                  {digestResult.fileName} ({digestResult.markdown.split('\n').length} dòng)
                </span>
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-600/10 hover:bg-brand-600/20 text-brand-500 font-bold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép Markdown'}</span>
                </button>
              </div>
              <pre className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {digestResult.markdown}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 hidden sm:block">
            Mẹo: Bạn có thể sao chép Markdown vào <strong>Obsidian</strong> hoặc <strong>Notion</strong> để lưu trữ lâu dài.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép Markdown'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
