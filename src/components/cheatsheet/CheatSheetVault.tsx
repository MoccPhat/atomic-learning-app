import React, { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Copy,
  Check,
  Trash2,
  Tag,
  X,
  Menu
} from 'lucide-react';
import {
  CheatSheetItem,
  CheatSheetCategory,
  CHEATSHEET_CATEGORY_META,
} from '../../lib/cheatsheet-types';
import {
  getCheatSheets,
  addCustomCheatSheet,
  deleteCheatSheet,
  searchCheatSheets,
} from '../../lib/cheatsheet-storage';

interface CheatSheetVaultProps {
  onToggleSidebar?: () => void;
}

export const CheatSheetVault: React.FC<CheatSheetVaultProps> = ({ onToggleSidebar }) => {
  const [items, setItems] = useState<CheatSheetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CheatSheetCategory | 'all'>('all');

  // Copy toast trạng thái
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal tạo công thức mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CheatSheetCategory>('dev');
  const [newSyntax, setNewSyntax] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newTags, setNewTags] = useState('');

  const reloadData = () => {
    setItems(getCheatSheets());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopySyntax = (id: string, syntax: string) => {
    navigator.clipboard.writeText(syntax);
    setCopiedId(id);
    showToast('Đã sao chép cú pháp vào clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, title: string) => {
    deleteCheatSheet(id);
    reloadData();
    showToast(`Đã xóa công thức "${title}"`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSyntax.trim()) {
      showToast('Vui lòng điền tiêu đề và cú pháp công thức!');
      return;
    }

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addCustomCheatSheet({
      title: newTitle.trim(),
      category: newCategory,
      syntax: newSyntax.trim(),
      explanation: newExplanation.trim() || 'Công thức do bạn tự lưu trữ.',
      example: newExample.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : ['custom'],
    });

    setNewTitle('');
    setNewSyntax('');
    setNewExplanation('');
    setNewExample('');
    setNewTags('');
    setIsAddModalOpen(false);
    reloadData();
    showToast('Đã thêm công thức mới vào Sổ tay tra cứu!');
  };

  // Danh sách đã lọc theo search query và category
  const filteredItems = useMemo(() => {
    return searchCheatSheets(items, searchQuery, selectedCategory);
  }, [items, searchQuery, selectedCategory]);

  const categories: { key: CheatSheetCategory | 'all'; label: string; icon: string }[] = [
    { key: 'all', label: 'Tất cả công thức', icon: '🌟' },
    { key: 'dev', label: 'Lập trình & Web', icon: '💻' },
    { key: 'devops', label: 'Linux & Git & Docker', icon: '⚡' },
    { key: 'math', label: 'Toán & Khoa học', icon: '📐' },
    { key: 'english', label: 'Ngữ pháp & Tiếng Anh', icon: '🌍' },
    { key: 'regex', label: 'Biểu thức Regex', icon: '🎯' },
  ];

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left animate-fade-in space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3 px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
            <Bookmark className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg sm:text-xl">
                Sổ Tay Tra Cứu
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bảng tra cứu cú pháp và công thức
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all shrink-0 self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm công thức mới</span>
        </button>
      </div>

      {/* Thanh Tìm Kiếm Tức Thì (Instant Search) & Tabs Chủ Đề */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh cú pháp (ví dụ: git undo, row_number, gradient descent, inversion, email regex)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Danh sách Tab Lọc Thể Loại */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 scale-102'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thống kê số lượng kết quả */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
        <span>HIỂN THỊ {filteredItems.length} CÔNG THỨC & CÚ PHÁP</span>
        <span className="font-mono text-[11px]">Tổng kho: {items.length} mục</span>
      </div>

      {/* Lưới Thẻ Card Công Thức (Cheat Sheets Grid) */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-2">
          <Bookmark className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 opacity-60" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            Không tìm thấy công thức nào phù hợp với từ khóa "{searchQuery}"
          </h4>
          <p className="text-xs text-slate-400">
            Bạn có thể bấm "Thêm công thức mới" ở góc trên để bổ sung vào sổ tay ngay bây giờ!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const catMeta = CHEATSHEET_CATEGORY_META[item.category];
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Category & Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>{catMeta.icon}</span>
                      <span>{catMeta.label}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {item.isCustom && (
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Xóa công thức tự tạo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h4>

                  {/* Code / Syntax Box */}
                  <div className="relative rounded-2xl bg-slate-950 p-3.5 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                    <button
                      onClick={() => handleCopySyntax(item.id, item.syntax)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Sao chép cú pháp"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <pre className="pr-8 whitespace-pre-wrap">{item.syntax}</pre>
                  </div>

                  {/* Explanation */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>

                  {/* Example (nếu có) */}
                  {item.example && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Ví dụ:
                      </span>
                      <pre className="whitespace-pre-wrap">{item.example}</pre>
                    </div>
                  )}
                </div>

                {/* Footer Tags */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex flex-wrap gap-1.5 items-center">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      onClick={() => setSearchQuery(tag)}
                      className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-brand-600 cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm Công Thức Tự Tạo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-500" />
                <span>Thêm công thức mới vào Sổ tay tra cứu</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề công thức / cú pháp *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Lệnh khôi phục file đã xóa trong Git, Công thức đạo hàm..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chủ đề / Thể loại
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CheatSheetCategory)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="dev">💻 Lập trình & Web</option>
                  <option value="devops">⚡ Linux & Git & Docker</option>
                  <option value="math">📐 Toán & Khoa học</option>
                  <option value="english">🌍 Ngữ pháp & Tiếng Anh</option>
                  <option value="regex">🎯 Biểu thức Regex</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cú pháp / Lệnh / Công thức toán *
                </label>
                <textarea
                  rows={3}
                  value={newSyntax}
                  onChange={(e) => setNewSyntax(e.target.value)}
                  placeholder="Nhập cú pháp code, công thức toán hoặc lệnh..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Giải thích ngắn gọn
                </label>
                <input
                  type="text"
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Mẹo nhớ hoặc mục đích sử dụng..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thẻ tags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="git, undo, tips, docker..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  Lưu vào Sổ tay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
