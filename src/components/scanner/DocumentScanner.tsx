import React, { useState, useEffect, useRef } from 'react';
import {
  ScanText,
  Upload,
  Camera,
  Copy,
  Check,
  Sparkles,
  Zap,
  Key,
  GraduationCap,
  Layers,
  FolderPlus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  Menu,
  ExternalLink,
  Code,
  Sigma,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import {
  extractTextWithGemini,
  extractTextWithTesseract,
  getGeminiApiKey,
  saveGeminiApiKey,
  getScannerSettings,
  saveScannerSettings,
  analyzeScannedContent,
  ScannerEngine,
} from '../../lib/scanner-service';
import { addQuizSetFromText } from '../../lib/quiz-storage';
import { addCard } from '../../lib/storage';
import { createNewStoredFile, addFilesToWeek } from '../../lib/tree-storage';
import { TreeData } from '../../lib/tree-types';

interface DocumentScannerProps {
  treeData: TreeData;
  onUpdateTree?: (newTree: TreeData) => void;
  onNavigateToTab?: (tab: 'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner') => void;
  onToggleSidebar?: () => void;
  onDataChanged?: () => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  treeData,
  onUpdateTree,
  onNavigateToTab,
  onToggleSidebar,
  onDataChanged,
}) => {
  // Cấu hình Scanner
  const [engine, setEngine] = useState<ScannerEngine>(() => getScannerSettings().engine);
  const [model, setModel] = useState<string>(() => getScannerSettings().model);
  const [apiKey, setApiKey] = useState<string>(() => getGeminiApiKey());

  // Trạng thái Tệp ảnh
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Trạng thái Xử lý Quét
  const [isScanning, setIsScanning] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');

  // Nội dung trích xuất (Requirement A3: Ô textarea chứa nội dung, giữ nguyên bố cục)
  const [scannedText, setScannedText] = useState<string>('');
  const [isMonospace, setIsMonospace] = useState(true);
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('raw');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);

  // Modal API Key
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [testKeyStatus, setTestKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');

  // Modal tạo Thẻ Flashcard nhanh
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardQuestion, setCardQuestion] = useState('');
  const [cardAnswer, setCardAnswer] = useState('');
  const [cardCategory, setCardCategory] = useState<'code' | 'english' | 'book' | 'exam'>('exam');

  // Thông báo Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Lắng nghe sự kiện paste clipboard ảnh (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleSelectImage(file);
            showToast('Đã dán ảnh từ bộ nhớ tạm (Clipboard)!', 'info');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Xử lý khi chọn ảnh
  const handleSelectImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP...)', 'error');
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  // Kéo thả ảnh
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleSelectImage(files[0]);
    }
  };

  // Đổi Engine
  const handleChangeEngine = (newEngine: ScannerEngine) => {
    setEngine(newEngine);
    saveScannerSettings({
      ...getScannerSettings(),
      engine: newEngine,
    });
  };

  // Đổi Model
  const handleChangeModel = (newModel: string) => {
    setModel(newModel);
    saveScannerSettings({
      ...getScannerSettings(),
      model: newModel,
    });
  };

  // Tiến hành quét văn bản
  const handleStartScan = async () => {
    if (!imageFile && !imagePreviewUrl) {
      showToast('Vui lòng chọn hoặc chụp ảnh tài liệu cần quét trước.', 'error');
      return;
    }

    // Nếu chọn Gemini nhưng chưa có API key
    if (engine === 'gemini' && !apiKey.trim()) {
      setInputKey('');
      setShowKeyModal(true);
      return;
    }

    setIsScanning(true);
    setProgressPercent(10);
    setProgressStatus('Đang chuẩn bị hình ảnh...');

    try {
      let extracted = '';

      if (engine === 'gemini') {
        setProgressPercent(35);
        setProgressStatus('Đang gửi tới Gemini Vision AI phân tích bố cục...');

        // Chuyển File sang Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          if (imageFile) {
            reader.readAsDataURL(imageFile);
          } else {
            reject(new Error('Không tìm thấy tệp ảnh'));
          }
        });

        setProgressPercent(60);
        setProgressStatus('Đang xử lý chữ viết, công thức toán và mã nguồn...');

        extracted = await extractTextWithGemini(
          base64Data,
          imageFile?.type || 'image/jpeg',
          apiKey,
          model,
          customInstructions
        );
      } else {
        // Tesseract Offline
        extracted = await extractTextWithTesseract(imageFile!, (percent, status) => {
          setProgressPercent(percent);
          setProgressStatus(status);
        });
      }

      setScannedText(extracted);
      setProgressPercent(100);
      setProgressStatus('Hoàn tất trích xuất!');
      showToast('Đã trích xuất văn bản và bảo toàn bố cục thành công!', 'success');

      // Tự động focus vào textarea sau khi quét
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 200);
    } catch (err: unknown) {
      console.error('Scan error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Lưu API Key
  const handleSaveApiKey = () => {
    if (!inputKey.trim()) {
      showToast('Vui lòng nhập API Key hợp lệ', 'error');
      return;
    }
    saveGeminiApiKey(inputKey.trim());
    setApiKey(inputKey.trim());
    setShowKeyModal(false);
    showToast('Đã lưu Gemini API Key thành công!', 'success');
  };

  // Test kết nối Gemini API
  const handleTestApiKey = async () => {
    if (!inputKey.trim()) {
      showToast('Vui lòng nhập API Key để kiểm tra', 'error');
      return;
    }
    setTestKeyStatus('testing');
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${inputKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }],
          }),
        }
      );
      if (res.ok) {
        setTestKeyStatus('valid');
        showToast('Kết nối Gemini API thành công!', 'success');
      } else {
        setTestKeyStatus('invalid');
        showToast('API Key không hợp lệ hoặc bị giới hạn quyền', 'error');
      }
    } catch {
      setTestKeyStatus('invalid');
      showToast('Lỗi mạng khi kiểm tra API Key', 'error');
    }
  };

  // Copy Text
  const handleCopyText = () => {
    if (!scannedText.trim()) return;
    navigator.clipboard.writeText(scannedText);
    setCopied(true);
    showToast('Đã sao chép văn bản vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Tạo Bộ Đề Quiz Master
  const handleCreateQuiz = () => {
    if (!scannedText.trim()) {
      showToast('Chưa có nội dung văn bản để tạo đề trắc nghiệm.', 'error');
      return;
    }

    const res = addQuizSetFromText(scannedText, 'Bộ đề quét từ tài liệu ảnh');
    if (res.success && res.quiz) {
      showToast(`Đã tạo bộ đề trắc nghiệm "${res.quiz.name}" (${res.quiz.questions.length} câu)!`, 'success');
      if (onDataChanged) onDataChanged();
      if (onNavigateToTab) {
        setTimeout(() => onNavigateToTab('quiz'), 800);
      }
    } else {
      showToast(
        res.error || 'Không tìm thấy câu hỏi trắc nghiệm hợp lệ (Cần có cấu trúc Câu 1:... A. B. C. D.)',
        'error'
      );
    }
  };

  // Mở modal tạo Flashcard
  const handleOpenCardModal = () => {
    if (!scannedText.trim()) {
      showToast('Chưa có nội dung văn bản để tạo thẻ.', 'error');
      return;
    }

    // Nếu văn bản có 2 phần hoặc câu hỏi
    const lines = scannedText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 1) {
      setCardQuestion(lines[0]);
      setCardAnswer('');
    } else if (lines.length >= 2) {
      setCardQuestion(lines[0]);
      setCardAnswer(lines.slice(1).join('\n'));
    } else {
      setCardQuestion(scannedText.slice(0, 100));
      setCardAnswer(scannedText);
    }

    const analysis = analyzeScannedContent(scannedText);
    if (analysis.hasCode) setCardCategory('code');
    else if (analysis.isQuiz) setCardCategory('exam');
    else setCardCategory('book');

    setShowCardModal(true);
  };

  // Lưu Flashcard
  const handleSaveCard = () => {
    if (!cardQuestion.trim() || !cardAnswer.trim()) {
      showToast('Vui lòng nhập đầy đủ câu hỏi và câu trả lời của thẻ.', 'error');
      return;
    }

    addCard({
      title: cardQuestion.slice(0, 50).trim(),
      category: cardCategory,
      front: cardQuestion.trim(),
      back: cardAnswer.trim(),
      tags: ['#scanner', `#${cardCategory}`],
    });

    setShowCardModal(false);
    showToast('Đã tạo thẻ kiến thức mới vào danh sách ôn tập!', 'success');
    if (onDataChanged) onDataChanged();
  };

  // Lưu vào Cây Lưu Trữ Tài Liệu (Tree Vault)
  const handleSaveToTree = async () => {
    if (!scannedText.trim()) {
      showToast('Chưa có nội dung văn bản để lưu vào cây tài liệu.', 'error');
      return;
    }

    const defaultTitle = `Tai_lieu_scan_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()
      .toString()
      .slice(-4)}`;
    const title = window.prompt('Nhập tên tệp lưu trữ (.md):', defaultTitle);
    if (!title) return;

    try {
      const newFile = createNewStoredFile(title, 'md', scannedText, 'Tài liệu trích xuất từ Scanner AI');

      // Tìm nhóm, môn học và tuần đầu tiên để lưu
      const firstGroup = treeData.groups[0];
      const firstSubject = firstGroup?.subjects?.[0];
      const firstWeek = firstSubject?.weeks?.[0];

      if (!firstGroup || !firstSubject || !firstWeek) {
        showToast('Chưa có nhóm hoặc môn học hợp lệ trong Cây tài liệu để lưu.', 'error');
        return;
      }

      const updatedTree = await addFilesToWeek(
        treeData,
        firstGroup.id,
        firstSubject.id,
        firstWeek.id,
        [newFile]
      );

      if (onUpdateTree) onUpdateTree(updatedTree);

      showToast(`Đã lưu tệp "${newFile.name}" vào Cây tài liệu!`, 'success');
      if (onDataChanged) onDataChanged();
      if (onNavigateToTab) {
        setTimeout(() => onNavigateToTab('tree'), 800);
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi lưu tệp vào Cây tài liệu', 'error');
    }
  };

  // Làm mới để quét trang mới
  const handleReset = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    setScannedText('');
    setProgressPercent(0);
    setProgressStatus('');
    showToast('Đã làm mới, sẵn sàng quét tài liệu tiếp theo.', 'info');
  };

  // Phân tích nội dung văn bản hiện tại
  const contentAnalysis = analyzeScannedContent(scannedText);
  const wordCount = scannedText.trim() ? scannedText.trim().split(/\s+/).length : 0;
  const lineCount = scannedText.trim() ? scannedText.split('\n').length : 0;
  const charCount = scannedText.length;

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-slate-800 dark:text-slate-100 select-text">
      {/* Toast thông báo */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-fade-in transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : 'bg-brand-50 dark:bg-brand-950/90 text-brand-800 dark:text-brand-200 border-brand-200 dark:border-brand-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header thanh công cụ & Tùy chọn Engine */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 shadow-xs"
              title="Ẩn / Hiện menu danh mục"
            >
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              <span className="text-xs font-bold hidden sm:inline text-slate-700 dark:text-slate-200">Menu</span>
            </button>
          )}

          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
            <ScanText className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              Quét Tài Liệu
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                OCR
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trích xuất văn bản từ hình ảnh
            </p>
          </div>
        </div>

        {/* Engine Switcher & API Key Status */}
        <div className="flex items-center flex-wrap gap-2.5 self-stretch md:self-auto justify-end">
          {/* Bộ chọn Engine */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => handleChangeEngine('tesseract')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                engine === 'tesseract'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Offline OCR</span>
            </button>
            <button
              onClick={() => handleChangeEngine('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                engine === 'gemini'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Cloud AI</span>
            </button>
          </div>

          {/* Model Selector (nếu chọn Gemini) */}
          {engine === 'gemini' && (
            <select
              value={model}
              onChange={(e) => handleChangeModel(e.target.value)}
              className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 shadow-xs"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Khuyên dùng - Nhanh & Ổn định)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest (Bản mới nhất)</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Bản thử nghiệm)</option>
            </select>
          )}

          {/* Nút cấu hình API Key */}
          {engine === 'gemini' && (
            <button
              onClick={() => {
                setInputKey(apiKey);
                setTestKeyStatus('idle');
                setShowKeyModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs ${
                apiKey.trim()
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/50 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey.trim() ? 'Đã cài API Key' : 'Nhập API Key'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Layout 2 cột: Bên Trái là Nhập Ảnh, Bên Phải là Textarea Kết Quả */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* ==================== CỘT TRÁI: TẢI & XEM ẢNH (5 / 12) ==================== */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                1. Hình ảnh tài liệu
              </span>
              {imagePreviewUrl && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa ảnh</span>
                </button>
              )}
            </div>

            {/* Khung Dropzone / Preview */}
            {!imagePreviewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Kéo thả ảnh hoặc bấm để chọn tệp
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mb-3">
                  Hỗ trợ PNG, JPG, WEBP. Hoặc bấm <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Ctrl + V</kbd> dán ảnh từ chụp màn hình
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn tệp ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp ảnh</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Đã có ảnh preview */
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col items-center justify-center group">
                <img
                  src={imagePreviewUrl}
                  alt="Tài liệu cần quét"
                  className="max-h-[380px] w-auto object-contain select-none"
                />

                {/* Hiệu ứng Laser quét phát sáng khi đang scanning */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_15px_4px_rgba(99,102,241,0.7)] animate-bounce transition-all" />
                )}

                {/* Thanh thông tin dưới ảnh */}
                <div className="w-full bg-slate-900/90 backdrop-blur-sm px-3 py-2 text-white text-[11px] flex items-center justify-between border-t border-slate-800">
                  <span className="truncate max-w-[200px] font-mono">{imageFile?.name || 'Ảnh dán từ clipboard'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="hover:text-brand-400 transition-colors text-[10px] font-semibold"
                    >
                      Đổi ảnh
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleSelectImage(f);
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleSelectImage(f);
              }}
            />

            {/* Tùy chọn nâng cao: Custom Prompt */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedPrompt((prev) => !prev)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <span>{showAdvancedPrompt ? '▼ Ẩn yêu cầu bổ sung' : '▶ Thêm yêu cầu riêng cho AI (Tùy chọn)'}</span>
              </button>

              {showAdvancedPrompt && (
                <div className="mt-2 animate-fade-in">
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="VD: Chỉ trích xuất phần đề bài, bỏ qua đáp án; hoặc chuyển thành bảng..."
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              )}
            </div>

            {/* Nút Bắt Đầu Quét */}
            <button
              onClick={handleStartScan}
              disabled={isScanning || (!imageFile && !imagePreviewUrl)}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                isScanning || (!imageFile && !imagePreviewUrl)
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressStatus || 'Đang số hóa văn bản...'}</span>
                </>
              ) : (
                <>
                  <ScanText className="w-4 h-4" />
                  <span>Quét & Trích xuất văn bản ({engine === 'gemini' ? 'AI Vision' : 'Offline OCR'})</span>
                </>
              )}
            </button>

            {/* Tiến trình quét */}
            {isScanning && (
              <div className="w-full space-y-1.5 animate-fade-in">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{progressStatus}</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================== CỘT PHẢI: TEXTAREA CHỨA KẾT QUẢ & BẢO TOÀN BỐ CỤC (7 / 12) ==================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col h-full min-h-[500px]">
            {/* Header Textarea */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  2. Văn bản trích xuất (Bảo toàn bố cục)
                </span>
                {scannedText && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {lineCount} dòng • {wordCount} từ • {charCount} ký tự
                  </span>
                )}
              </div>

              {/* Toggle Monospace & View Mode */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsMonospace((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    isMonospace
                      ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono'
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title="Bật/Tắt font Monospace giữ nguyên khoảng cách thụt lề"
                >
                  Code/Mono
                </button>

                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold">
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
                      viewMode === 'raw'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Soạn thảo</span>
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
                      viewMode === 'preview'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Xem trước</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Huy hiệu phân tích nội dung (Smart Badges) */}
            {scannedText.trim() && (
              <div className="flex flex-wrap items-center gap-2 py-2.5">
                {contentAnalysis.isQuiz && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Phát hiện {contentAnalysis.quizCount} câu hỏi trắc nghiệm</span>
                  </span>
                )}
                {contentAnalysis.hasCode && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono">
                    <Code className="w-3.5 h-3.5" />
                    <span>Chứa mã nguồn lập trình</span>
                  </span>
                )}
                {contentAnalysis.hasMath && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    <Sigma className="w-3.5 h-3.5" />
                    <span>Công thức Toán KaTeX</span>
                  </span>
                )}
              </div>
            )}

            {/* Textarea hoặc Preview (Requirement A3: ô text area chứa những nội dung đó, giữ nguyên bố cục) */}
            <div className="flex-1 flex flex-col my-2 min-h-[320px]">
              {viewMode === 'raw' ? (
                <textarea
                  ref={textareaRef}
                  value={scannedText}
                  onChange={(e) => setScannedText(e.target.value)}
                  placeholder="Văn bản sau khi quét sẽ xuất hiện tại đây, giữ nguyên 100% bố cục thụt đầu dòng, bảng biểu, danh sách và công thức toán..."
                  className={`w-full flex-1 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none transition-colors leading-relaxed ${
                    isMonospace ? 'font-mono text-xs sm:text-sm' : 'font-sans text-xs sm:text-sm'
                  }`}
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                  spellCheck={false}
                />
              ) : (
                /* Chế độ xem trước định dạng */
                <div className="w-full flex-1 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 overflow-y-auto text-xs sm:text-sm leading-relaxed prose dark:prose-invert max-w-none">
                  {scannedText.trim() ? (
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      {scannedText}
                    </pre>
                  ) : (
                    <p className="text-slate-400 italic">Chưa có nội dung để xem trước...</p>
                  )}
                </div>
              )}
            </div>

            {/* Nút Hành Động Trực Tiếp (Action Buttons) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  disabled={!scannedText.trim()}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    !scannedText.trim()
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                      : copied
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-xs'
                  }`}
                  title="Sao chép toàn bộ văn bản vào bộ nhớ tạm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>

                <button
                  onClick={() => setScannedText('')}
                  disabled={!scannedText.trim()}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Xóa trắng nội dung"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Các nút nạp vào hệ sinh thái học tập */}
              <div className="flex items-center flex-wrap gap-2">
                {/* 1. Tạo Quiz */}
                <button
                  onClick={handleCreateQuiz}
                  disabled={!scannedText.trim()}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    !scannedText.trim()
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                      : 'bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 shadow-xs'
                  }`}
                  title="Nạp vào Bộ Đề Trắc Nghiệm (Quiz Master)"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Tạo Đề Quiz</span>
                </button>

                {/* 2. Tạo Flashcard */}
                <button
                  onClick={handleOpenCardModal}
                  disabled={!scannedText.trim()}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    !scannedText.trim()
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-xs'
                  }`}
                  title="Tạo Thẻ Flashcard Ôn Tập"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tạo Thẻ Thẻ Học</span>
                </button>

                {/* 3. Lưu vào Tree Explorer */}
                <button
                  onClick={handleSaveToTree}
                  disabled={!scannedText.trim()}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    !scannedText.trim()
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                      : 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-xs'
                  }`}
                  title="Lưu thành tệp Markdown vào Cây Lưu Trữ Tài Liệu (Tree Vault)"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Lưu vào Vault</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODAL CẤU HÌNH API KEY ==================== */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in select-text">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-left flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Cấu hình Gemini API Key</h3>
                  <span className="text-[11px] text-slate-400">Miễn phí 100% từ Google AI Studio</span>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Để sử dụng chế độ <strong>AI Vision</strong> (nhận diện chữ viết tay, công thức Toán học KaTeX, code lập trình và bảo toàn bố cục), vui lòng nhập Gemini API Key của bạn:
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    setTestKeyStatus('idle');
                  }}
                  placeholder="AIzaSy..."
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Hướng dẫn lấy key */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
                <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  <span>Cách nhận API Key miễn phí trong 1 phút:</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <span>Mở Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p>1. Đăng nhập bằng tài khoản Google bất kỳ.</p>
                <p>2. Bấm nút <strong>"Create API key"</strong>.</p>
                <p>3. Sao chép và dán vào ô bên trên.</p>
                <p className="text-[10px] text-slate-400 italic">
                  * Khóa API được lưu cục bộ an toàn trên trình duyệt của bạn (Local-first), không gửi về máy chủ trung gian.
                </p>
              </div>
            </div>

            {/* Nút hành động trong modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={testKeyStatus === 'testing' || !inputKey.trim()}
                className="text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {testKeyStatus === 'testing'
                  ? 'Đang kiểm tra...'
                  : testKeyStatus === 'valid'
                  ? '✓ Hợp lệ'
                  : 'Kiểm tra kết nối'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
                >
                  Lưu API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL TẠO FLASHCARD ==================== */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in select-text">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-left flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Tạo Thẻ Học Tập Mới</h3>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Danh mục thẻ
                </label>
                <select
                  value={cardCategory}
                  onChange={(e) => setCardCategory(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100"
                >
                  <option value="code">Lập trình (Code)</option>
                  <option value="english">Ngoại ngữ (English)</option>
                  <option value="book">Đọc sách & Nghiên cứu</option>
                  <option value="exam">Ôn thi chứng chỉ (Exam)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mặt Trước (Câu hỏi / Khái niệm)
                </label>
                <textarea
                  rows={3}
                  value={cardQuestion}
                  onChange={(e) => setCardQuestion(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc khái niệm cần ghi nhớ..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mặt Sau (Câu trả lời / Lời giải)
                </label>
                <textarea
                  rows={5}
                  value={cardAnswer}
                  onChange={(e) => setCardAnswer(e.target.value)}
                  placeholder="Nhập câu trả lời, giải thích, hoặc đoạn code..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCard}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
              >
                Lưu Thẻ Kiến Thức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
