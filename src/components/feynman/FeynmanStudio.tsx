import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Layers,
  Menu,
} from 'lucide-react';
import { critiqueExplanationWithGemini, SocraticCritique } from '../../lib/feynman-service';
import { addCard } from '../../lib/storage';

interface FeynmanStudioProps {
  onToggleSidebar?: () => void;
  onNavigateToTab?: (tab: 'cards' | 'quiz' | 'tree' | 'pomodoro' | 'scanner' | 'cornell' | 'advisor') => void;
  onCardsAdded?: () => void;
}

const TOPIC_SUGGESTIONS = [
  'Đóng gói (Encapsulation) trong OOP',
  'Bộ nhớ đệm (Cache) hoạt động thế nào?',
  'Khái niệm Recursion (Đệ quy)',
  'Tại sao cần dùng Spaced Repetition?',
  'Tính chất ACID trong Cơ sở dữ liệu',
  'Độ phức tạp thuật toán O(log n)',
];

export const FeynmanStudio: React.FC<FeynmanStudioProps> = ({
  onToggleSidebar,
  onNavigateToTab,
  onCardsAdded,
}) => {
  const [topic, setTopic] = useState('Bộ nhớ đệm (Cache)');
  const [explanation, setExplanation] = useState('');
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critique, setCritique] = useState<SocraticCritique | null>(null);
  const [savedAsCard, setSavedAsCard] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCritique = async () => {
    if (!topic.trim()) {
      showToast('Vui lòng nhập khái niệm cần giải thích!');
      return;
    }
    if (!explanation.trim()) {
      showToast('Vui lòng nhập lời giải thích của bạn!');
      return;
    }

    setIsCritiquing(true);
    setSavedAsCard(false);

    try {
      const result = await critiqueExplanationWithGemini(topic.trim(), explanation.trim());
      setCritique(result);
    } catch (e) {
      console.error('Critique error:', e);
      showToast('Có lỗi xảy ra khi phân tích, vui lòng thử lại.');
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleSaveToFlashcard = () => {
    if (!critique) return;

    addCard({
      title: `Feynman: ${topic}`,
      front: `Giải thích bản chất của: ${topic}?`,
      back: `${explanation.trim()}\n\n💡 Ẩn dụ: ${critique.analogySuggestion}`,
      category: 'code',
      tags: ['feynman', 'socratic', 'deep-understanding'],
    });

    setSavedAsCard(true);
    if (onCardsAdded) onCardsAdded();
    showToast('Đã lưu thành công thành thẻ Flashcard Spaced Repetition!');
  };

  const wordsCount = explanation.trim() ? explanation.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Toast thông báo */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-slide-in">
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
                Phản Biện Feynman
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Diễn giải khái niệm bằng từ ngữ đơn giản
            </p>
          </div>
        </div>

        {/* Nút gợi ý chuyển tab nếu có */}
        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('cards')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Xem Flashcards</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT NHẬP LIỆU (7 CỘT) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            {/* CHỌN / NHẬP KHÁI NIỆM */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                1. Khái niệm bạn muốn kiểm tra:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Event Loop trong JavaScript, Con trỏ trong C++, v.v."
                className="w-full text-sm font-bold px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              {/* Các thẻ gợi ý chủ đề nhanh */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {TOPIC_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTopic(sug)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* NHẬP LỜI GIẢI THÍCH */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  2. Lời giải thích của bạn:
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {wordsCount} từ
                </span>
              </div>

              <textarea
                rows={7}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Hãy tưởng tượng bạn đang giải thích cho một người bạn hoặc một học sinh 12 tuổi chưa biết gì về chủ đề này. Dùng ví dụ đời thường, tránh thuật ngữ sách vở..."
                className="w-full text-xs sm:text-sm p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none leading-relaxed"
              />

              <div className="mt-2 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <b>Mẹo Feynman:</b> Nếu bạn phải dùng các từ như "tối ưu", "cơ chế", "xử lý ngầm", hãy dừng lại và tự hỏi: Nó thực chất đang làm cái gì? Giống như việc gì trong đời thực?
                </span>
              </div>
            </div>

            {/* NÚT BẤM GỬI PHẢN BIỆN */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCritique}
                disabled={isCritiquing || !topic.trim() || !explanation.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-purple-500/25 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
              >
                {isCritiquing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Socrates đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Phản biện cùng Socrates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CỘT KẾT QUẢ PHẢN BIỆN (5 CỘT) */}
        <div className="lg:col-span-5 space-y-4">
          {critique ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 animate-fade-in">
              {/* ĐIỂM SỐ & TỔNG QUAN */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {critique.isAiGenerated ? 'Gemini AI Socratic Coach' : 'Offline Rule-based Evaluator'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Đánh giá mức độ thấu triệt
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-2xl font-black text-sm ${
                      critique.score >= 80
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : critique.score >= 60
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {critique.score}/100
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                "{critique.summary}"
              </p>

              {/* ĐIỂM SÁNG */}
              {critique.strengths.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Điểm sáng:
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-4 list-disc">
                    {critique.strengths.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CẢNH BÁO THUẬT NGỮ JARGON */}
              {critique.jargons.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                  <h4 className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Thuật ngữ chưa giải nghĩa:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {critique.jargons.map((jg, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                      >
                        {jg}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Hãy thử thay thế các từ trên bằng mô tả trực quan để đảm bảo không bị ảo tưởng hiểu biết.
                  </p>
                </div>
              )}

              {/* 2 CÂU HỎI PHẢN BIỆN SOCRATIC */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Câu hỏi kích thích tư duy:
                </h4>
                <div className="space-y-2">
                  {critique.socraticQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 text-xs font-semibold text-indigo-950 dark:text-indigo-200"
                    >
                      <span className="font-bold text-indigo-500 mr-1.5">#{i + 1}:</span>
                      {q}
                    </div>
                  ))}
                </div>
              </div>

              {/* PHÉP ẨN DỤ ĐỜI THƯỜNG GỢI Ý */}
              {critique.analogySuggestion && (
                <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/40 text-xs text-purple-950 dark:text-purple-200 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" /> Gợi ý phép ẩn dụ:
                  </span>
                  <p className="italic">{critique.analogySuggestion}</p>
                </div>
              )}

              {/* NÚT LƯU THÀNH FLASHCARD */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                {savedAsCard ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60">
                    <CheckCircle2 className="w-4 h-4" /> Đã lưu vào bộ thẻ ôn tập!
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveToFlashcard}
                    className="w-full py-2.5 px-4 rounded-2xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/80 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Lưu thành Flashcard Spaced Repetition</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* PLACEHOLDER KHI CHƯA PHẢN BIỆN */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-sm min-h-[360px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-3xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-md shadow-purple-500/10">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Chờ phản biện từ Socrates
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhập khái niệm và lời giải thích của bạn ở bên trái, sau đó bấm <b>Phản biện cùng Socrates</b> để phát hiện lỗ hổng tư duy.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-left max-w-xs space-y-1">
                <span className="font-bold block text-slate-700 dark:text-slate-300">4 Tiêu chí đánh giá:</span>
                <div>• Độ đơn giản & súc tích (1-100)</div>
                <div>• Phát hiện bẫy thuật ngữ (Jargon)</div>
                <div>• Câu hỏi phản biện Socratic</div>
                <div>• Gợi ý phép ẩn dụ đời thường</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
