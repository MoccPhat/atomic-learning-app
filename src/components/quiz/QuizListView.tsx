import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Copy,
  Check,
  Play,
  RotateCcw,
  Trash2,
  HelpCircle,
  X,
  Clock,
  Award,
} from 'lucide-react';
import { QuizSet } from '../../lib/quiz-types';
import { addQuizSetFromText, deleteQuizSet, loadQuizProgress } from '../../lib/quiz-storage';

interface QuizListViewProps {
  quizzes: QuizSet[];
  onStartQuiz: (quiz: QuizSet, mode: 'all' | 'wrong') => void;
  onStartMockExam: (quiz: QuizSet, durationMinutes: number) => void;
  onRefresh: () => void;
}

const AI_PROMPT_TEMPLATE = `Soạn 20 câu trắc nghiệm về <CHỦ ĐỀ> theo ĐÚNG định dạng sau, không thêm lời dẫn hay ghi chú nào khác:

# <Tên bài trắc nghiệm>

## Chương 1. <Tên chương>

### Câu 1
<Nội dung câu hỏi>
A. <Lựa chọn A>
B. <Lựa chọn B>
C. <Lựa chọn C>
D. <Lựa chọn D>
Đáp án: <một chữ cái A/B/C/D>
Giải thích: <1 câu giải thích ngắn gọn>

(lặp lại cho tới Câu 20; mỗi câu chỉ có một đáp án đúng; các đáp án chia đều A, B, C, D)`;

export const QuizListView: React.FC<QuizListViewProps> = ({
  quizzes,
  onStartQuiz,
  onStartMockExam,
  onRefresh,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [mockExamQuiz, setMockExamQuiz] = useState<QuizSet | null>(null);
  const [mockDuration, setMockDuration] = useState<number>(15);
  const [pasteContent, setPasteContent] = useState('');
  const [notice, setNotice] = useState<{ text: string; type: 'ok' | 'bad' | 'warn' } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const showNotice = (text: string, type: 'ok' | 'bad' | 'warn') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const fallbackName = file.name.replace(/\.[^.]+$/, '');
      const res = addQuizSetFromText(text, fallbackName);
      if (res.success) {
        showNotice(`Đã nạp thành công "${res.quiz?.name}" với ${res.quiz?.questions.length} câu!`, res.skipped ? 'warn' : 'ok');
        onRefresh();
      } else {
        showNotice(res.error || 'Lỗi nạp file', 'bad');
      }
    };
    reader.readAsText(file, 'utf-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) return;
    const res = addQuizSetFromText(pasteContent.trim());
    if (res.success) {
      showNotice(`Đã nạp thành công "${res.quiz?.name}" với ${res.quiz?.questions.length} câu!`, res.skipped ? 'warn' : 'ok');
      setPasteContent('');
      setPasteModalOpen(false);
      onRefresh();
    } else {
      showNotice(res.error || 'Lỗi nạp văn bản', 'bad');
    }
  };

  const handleDelete = (id: string, name: string) => {
    deleteQuizSet(id);
    onRefresh();
    showNotice(`Đã xóa bộ đề "${name}" thành công!`, 'ok');
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Thi Trắc Nghiệm
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Luyện tập đề thi và câu hỏi trắc nghiệm
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Nạp file .md</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.txt"
            className="hidden"
          />

          <button
            onClick={() => setPasteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Dán văn bản</span>
          </button>

          <button
            onClick={() => setGuideModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Hướng dẫn soạn đề & Prompt AI"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`mb-6 p-3 rounded-2xl text-xs font-semibold animate-fade-in flex items-center justify-between ${
            notice.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : notice.type === 'warn'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="p-0.5 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* List of Quizzes */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
          <span>Danh sách bộ đề hiện có ({quizzes.length})</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Chưa có bộ đề trắc nghiệm nào</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Bấm "Nạp file .md" hoặc "Dán văn bản" ở trên để bắt đầu.</p>
          </div>
        ) : (
          quizzes.map((q) => {
            const p = loadQuizProgress(q.id);
            const total = q.questions.length;
            let metaTxt = `${total} câu`;
            let pct = 0;
            let primaryLabel = 'Bắt đầu làm';

            if (p && !p.done) {
              pct = Math.round((100 * p.pos) / p.order.length);
              metaTxt += ` · đang làm dở (${p.pos}/${p.order.length} câu)`;
              primaryLabel = 'Làm tiếp';
            } else if (p && p.done) {
              const first = p.order.filter((i) => p.firstTry[i]).length;
              pct = 100;
              metaTxt += ` · lần gần nhất: ${first}/${p.order.length} đúng ngay lần đầu (${Math.round((first / p.order.length) * 100)}%)`;
              primaryLabel = 'Làm lại';
            }

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-400 dark:hover:border-brand-500/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                      {q.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{metaTxt}</p>

                  {/* Progress bar */}
                  <div className="w-full sm:max-w-xs h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setMockExamQuiz(q);
                      setMockDuration(Math.max(10, Math.min(60, Math.ceil(q.questions.length * 1.5))));
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 font-bold text-xs shadow-sm transition-all active:scale-95"
                    title="Phòng thi thử: đếm giờ và phân tích radar điểm yếu"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Thi Thử</span>
                  </button>

                  <button
                    onClick={() => onStartQuiz(q, 'all')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{primaryLabel}</span>
                  </button>

                  {p && (
                    <button
                      onClick={() => onStartQuiz(q, 'all')}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Làm lại từ đầu"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(q.id, q.name)}
                    className="p-2 rounded-xl text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Xóa bộ đề"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dán văn bản Markdown */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Dán nội dung câu hỏi Markdown</h3>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Dán nội dung theo định dạng (mỗi câu bắt đầu bằng <code>### Câu N</code>, các lựa chọn <code>A. B. C. D.</code> và <code>Đáp án: B</code>).
            </p>

            <textarea
              rows={8}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="# Tên bài thi&#10;&#10;### Câu 1&#10;Nội dung câu hỏi?&#10;A. Đáp án A&#10;B. Đáp án B&#10;C. Đáp án C&#10;D. Đáp án D&#10;Đáp án: B&#10;Giải thích: Vì B đúng"
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handlePasteSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-md shadow-brand-500/20"
              >
                Nạp bộ đề ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hướng dẫn soạn đề & Prompt AI */}
      {guideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Hướng dẫn tạo đề bằng AI</h3>
              <button
                onClick={() => setGuideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Bạn có thể nhờ AI (ChatGPT, Gemini, Claude) tự động soạn hàng chục câu hỏi trắc nghiệm theo đúng định dạng chuẩn chỉ bằng 1 câu lệnh dưới đây:
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap mb-4">
              {AI_PROMPT_TEMPLATE}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm"
              >
                {copiedPrompt ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPrompt ? 'Đã sao chép prompt!' : 'Sao chép câu lệnh'}</span>
              </button>
              <button
                onClick={() => setGuideModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cấu hình Phòng Thi Thử (Mock Exam) */}
      {mockExamQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                    Phòng Thi Thử Mô Phỏng
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {mockExamQuiz.name} ({mockExamQuiz.questions.length} câu)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMockExamQuiz(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Thời lượng làm bài thi:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMockDuration(mins)}
                      className={`py-2.5 rounded-xl font-bold border transition-all ${
                        mockDuration === mins
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mins} phút
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                  <Award className="w-4 h-4 shrink-0" /> Quy chế phòng thi mô phỏng:
                </span>
                <p>• Tự động xáo trộn ngẫu nhiên thứ tự câu hỏi và 4 đáp án.</p>
                <p>• Ẩn kết quả đúng/sai trong khi làm (Zen mode tập trung cao độ).</p>
                <p>• Đếm ngược thời gian thực, có cờ ghim câu phân vân để xem lại.</p>
                <p>• Chấm điểm thang điểm 10 và vẽ biểu đồ Radar phân tích lỗ hổng kiến thức.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setMockExamQuiz(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const targetQuiz = mockExamQuiz;
                  const dur = mockDuration;
                  setMockExamQuiz(null);
                  onStartMockExam(targetQuiz, dur);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Bắt đầu thi ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
