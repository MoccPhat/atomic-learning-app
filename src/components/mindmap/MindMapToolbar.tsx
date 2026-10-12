import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  GitBranch,
  Download,
  FileText,
  Undo2,
  Redo2,
} from 'lucide-react';
import { MindMapLayoutMode } from '../../lib/mindmap-types';

interface MindMapToolbarProps {
  zoom: number;
  layoutMode: MindMapLayoutMode;
  canUndo?: boolean;
  canRedo?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onAutoLayout: () => void;
  onToggleLayoutMode: () => void;
  onExportMarkdown: () => void;
  onExportPng: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  selectedNodeColor?: string;
  onChangeColor?: (color: string) => void;
}

const COLOR_OPTIONS = [
  { key: 'indigo', label: 'Tím Indigo', bg: 'bg-indigo-500' },
  { key: 'emerald', label: 'Xanh Ngọc', bg: 'bg-emerald-500' },
  { key: 'sky', label: 'Xanh Dương', bg: 'bg-sky-500' },
  { key: 'amber', label: 'Vàng Cam', bg: 'bg-amber-500' },
  { key: 'rose', label: 'Đỏ Hồng', bg: 'bg-rose-500' },
  { key: 'purple', label: 'Tím Mộng', bg: 'bg-purple-500' },
];

export const MindMapToolbar: React.FC<MindMapToolbarProps> = ({
  zoom,
  layoutMode,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onResetView,
  onAutoLayout,
  onToggleLayoutMode,
  onExportMarkdown,
  onExportPng,
  onUndo,
  onRedo,
  selectedNodeColor,
  onChangeColor,
}) => {
  return (
    <div
      data-no-pan="true"
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl select-none"
    >
      {/* Undo & Redo */}
      {onUndo && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Hoàn tác (Ctrl + Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
      )}

      {onRedo && (
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Làm lại (Ctrl + Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      )}

      <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Auto Layout */}
      <button
        onClick={onAutoLayout}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Tự động căn chỉnh và xếp nhánh"
      >
        <LayoutGrid className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        <span className="hidden sm:inline">Căn chỉnh</span>
      </button>

      {/* Toggle Layout Mode (Radial vs Horizontal) */}
      <button
        onClick={onToggleLayoutMode}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={`Chuyển kiểu hiển thị (Hiện tại: ${layoutMode === 'radial' ? 'Tỏa 2 bên' : 'Cây ngang'})`}
      >
        <GitBranch className="w-4 h-4 text-purple-500" />
        <span className="hidden sm:inline">
          {layoutMode === 'radial' ? 'Tỏa 2 bên' : 'Cây ngang'}
        </span>
      </button>

      <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Đổi màu node (nếu có hàm) */}
      {onChangeColor && (
        <div className="flex items-center gap-1 px-1">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.key}
              onClick={() => onChangeColor(c.key)}
              className={`w-4 h-4 rounded-full ${c.bg} transition-transform ${
                selectedNodeColor === c.key ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'hover:scale-110'
              }`}
              title={`Đổi màu sang ${c.label}`}
            />
          ))}
        </div>
      )}

      <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono font-bold text-slate-500 w-11 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={onResetView}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Căn giữa màn hình (100%)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Export Options */}
      <button
        onClick={onExportMarkdown}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Sao chép dạng Markdown Outline"
      >
        <FileText className="w-4 h-4 text-emerald-500" />
      </button>

      <button
        onClick={onExportPng}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Xuất file ảnh SVG/PNG chất lượng cao"
      >
        <Download className="w-4 h-4 text-sky-500" />
      </button>
    </div>
  );
};
