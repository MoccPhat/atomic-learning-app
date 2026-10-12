import React, { useState } from 'react';
import {
  X,
  FilePlus,
  Sparkles,
  FileText,
  FileCode2,
  Code,
  File
} from 'lucide-react';
import { createNewStoredFile } from '../../lib/tree-storage';
import { StoredFile } from '../../lib/tree-types';

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekTitle: string;
  onCreateFile: (newFile: StoredFile) => void;
}

const PRESET_EXTENSIONS = [
  { ext: 'docx', label: '.docx (Word)', icon: <FileText className="w-3.5 h-3.5 text-blue-500" /> },
  { ext: 'ipynb', label: '.ipynb (Jupyter)', icon: <FileCode2 className="w-3.5 h-3.5 text-amber-500" /> },
  { ext: 'py', label: '.py (Python)', icon: <Code className="w-3.5 h-3.5 text-emerald-500" /> },
  { ext: 'md', label: '.md (Markdown)', icon: <FileText className="w-3.5 h-3.5 text-indigo-500" /> },
  { ext: 'txt', label: '.txt (Văn bản)', icon: <FileText className="w-3.5 h-3.5 text-slate-500" /> },
  { ext: 'sql', label: '.sql (Truy vấn)', icon: <Code className="w-3.5 h-3.5 text-cyan-500" /> },
  { ext: 'json', label: '.json (Dữ liệu)', icon: <Code className="w-3.5 h-3.5 text-yellow-500" /> },
  { ext: 'cpp', label: '.cpp (C++)', icon: <Code className="w-3.5 h-3.5 text-purple-500" /> },
  { ext: 'java', label: '.java (Java)', icon: <Code className="w-3.5 h-3.5 text-rose-500" /> },
  { ext: 'custom', label: 'Tùy chỉnh...', icon: <File className="w-3.5 h-3.5 text-slate-400" /> },
];

export const CreateFileModal: React.FC<CreateFileModalProps> = ({
  isOpen,
  onClose,
  weekTitle,
  onCreateFile,
}) => {
  const [fileName, setFileName] = useState('');
  const [selectedExt, setSelectedExt] = useState('docx');
  const [customExt, setCustomExt] = useState('');
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const currentExt = selectedExt === 'custom' ? customExt.replace(/^\./, '') : selectedExt;

  const handleApplyTemplate = () => {
    const ext = currentExt.toLowerCase();
    if (ext === 'ipynb') {
      setContent('# Tên bài thực hành\nimport cv2\nimport numpy as np\n\nprint("Sẵn sàng!")');
    } else if (ext === 'py') {
      setContent('#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\ndef main():\n    print("Bắt đầu bài học...")\n\nif __name__ == "__main__":\n    main()\n');
    } else if (ext === 'md') {
      setContent('# Tiêu đề tài liệu\n\n## 1. Mục tiêu kiến thức\n- Điểm 1\n- Điểm 2\n\n## 2. Ghi chú chi tiết\n');
    } else if (ext === 'sql') {
      setContent('-- Truy vấn dữ liệu môn học\nSELECT * FROM sinh_vien\nWHERE diem >= 8.0;\n');
    } else if (ext === 'json') {
      setContent('{\n  "name": "Bài tập",\n  "version": "1.0",\n  "tags": ["hoc_tap"]\n}');
    } else if (ext === 'cpp') {
      setContent('#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Xin chào C++" << endl;\n    return 0;\n}\n');
    } else if (ext === 'java') {
      setContent('public class Main {\n    public static void main(String[] args) {\n        System.out.println("Xin chào Java");\n    }\n}\n');
    } else {
      setContent(`Nội dung khởi tạo cho tệp ${fileName || 'tài liệu'}...\n`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    const finalExt = selectedExt === 'custom' ? (customExt.trim() || 'txt') : selectedExt;
    const newFile = createNewStoredFile(fileName, finalExt, content, note);
    onCreateFile(newFile);

    // Reset form
    setFileName('');
    setContent('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <FilePlus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Tạo Tệp Tin Mới
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-sm">
                Vào {weekTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. Tên file */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên tệp tin *
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Ví dụ: Bai_tap_tuan_1, Lab_Vision, Ghi_chu"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <span className="ml-2 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-2 rounded-xl border border-brand-200 dark:border-brand-800 shrink-0">
                .{currentExt || 'txt'}
              </span>
            </div>
          </div>

          {/* 2. Chọn phần mở rộng (.đuôi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn phần mở rộng (.đuôi) bạn muốn
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PRESET_EXTENSIONS.map((item) => {
                const isSelected = selectedExt === item.ext;
                return (
                  <button
                    key={item.ext}
                    type="button"
                    onClick={() => setSelectedExt(item.ext)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Nếu người dùng chọn Tùy chỉnh đuôi khác */}
            {selectedExt === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2 animate-fade-in">
                <span className="text-xs font-bold text-slate-500">Nhập đuôi tùy ý: .</span>
                <input
                  type="text"
                  value={customExt}
                  onChange={(e) => setCustomExt(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="ví dụ: pdf, html, css, csv, r, tex, sh..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
          </div>

          {/* 3. Nội dung khởi tạo (Không bắt buộc) */}
          {selectedExt !== 'docx' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nội dung tệp ban đầu (Tùy chọn)
                </label>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Điền mã mẫu</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập hoặc dán nội dung/mã nguồn ban đầu vào đây..."
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
              />
            </div>
          )}

          {/* 4. Ghi chú file (Tùy chọn) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú về tệp (Tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Bài tập về nhà nộp trước thứ 6"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 active:scale-95 rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <FilePlus className="w-4 h-4" />
              <span>Tạo tệp ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
