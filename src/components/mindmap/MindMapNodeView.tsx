import React, { memo } from 'react';
import { Plus, ChevronDown, Trash2, Edit2, Sparkles } from 'lucide-react';
import { MindMapNode } from '../../lib/mindmap-types';
import { NODE_CONFIG } from '../../lib/mindmap-layout';

interface MindMapNodeViewProps {
  node: MindMapNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
}

const COLOR_MAP: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    badge: string;
    glow: string;
  }
> = {
  indigo: {
    border: 'border-indigo-500 dark:border-indigo-400',
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-indigo-900 dark:text-indigo-100',
    badge: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300',
    glow: 'shadow-indigo-500/20',
  },
  emerald: {
    border: 'border-emerald-500 dark:border-emerald-400',
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-emerald-900 dark:text-emerald-100',
    badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300',
    glow: 'shadow-emerald-500/20',
  },
  sky: {
    border: 'border-sky-500 dark:border-sky-400',
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-sky-900 dark:text-sky-100',
    badge: 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300',
    glow: 'shadow-sky-500/20',
  },
  amber: {
    border: 'border-amber-500 dark:border-amber-400',
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-amber-900 dark:text-amber-100',
    badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300',
    glow: 'shadow-amber-500/20',
  },
  rose: {
    border: 'border-rose-500 dark:border-rose-400',
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-rose-900 dark:text-rose-100',
    badge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300',
    glow: 'shadow-rose-500/20',
  },
  purple: {
    border: 'border-purple-500 dark:border-purple-400',
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-purple-900 dark:text-purple-100',
    badge: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300',
    glow: 'shadow-purple-500/20',
  },
};

export const MindMapNodeView: React.FC<MindMapNodeViewProps> = memo(
  ({
    node,
    isSelected,
    onSelect,
    onAddChild,
    onDelete,
    onToggleCollapse,
    onEdit,
  }) => {
    const colorStyle = COLOR_MAP[node.color || 'indigo'] || COLOR_MAP.indigo;
    const hasChildren = node.children && node.children.length > 0;

    const width = NODE_CONFIG.WIDTH;
    const height = NODE_CONFIG.HEIGHT;
    const left = node.x - width / 2;
    const top = node.y - height / 2;

    return (
      <div
        data-no-pan="true"
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onEdit(node.id);
        }}
        className={`group select-none cursor-pointer rounded-2xl border-2 transition-all duration-200 shadow-md ${
          colorStyle.bg
        } ${colorStyle.border} ${
          isSelected
            ? `ring-4 ring-offset-2 ring-brand-500 dark:ring-offset-slate-950 scale-105 z-20 shadow-xl ${colorStyle.glow}`
            : 'hover:scale-[1.02] hover:shadow-lg z-10'
        } ${node.isRoot ? 'font-bold ring-2 ring-brand-400/50' : ''}`}
      >
        <div className="w-full h-full px-3 py-1.5 flex items-center justify-between gap-1.5 overflow-hidden">
          {/* Nhãn và chi tiết */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              {node.isRoot && (
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-spin-slow" />
              )}
              <span
                className={`text-xs font-bold truncate block ${colorStyle.text}`}
                title={node.label}
              >
                {node.label}
              </span>
            </div>
            {node.detail && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                {node.detail}
              </span>
            )}
          </div>

          {/* Nút thu gọn / mở rộng nhánh (nếu có con) */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(node.id);
              }}
              className={`p-1 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 ${
                node.collapsed ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' : ''
              }`}
              title={node.collapsed ? `Mở rộng (${node.children.length} nhánh)` : 'Thu gọn'}
            >
              {node.collapsed ? (
                <span className="text-[10px] font-bold px-1">{node.children.length}</span>
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Quick Action buttons khi hover */}
          <div className="hidden group-hover:flex items-center gap-0.5 absolute -top-3.5 right-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 p-0.5 z-30">
            {/* Nút Thêm con */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node.id);
              }}
              className="p-1 rounded-full hover:bg-brand-50 dark:hover:bg-brand-950 text-brand-600 dark:text-brand-400 transition-colors"
              title="Thêm nhánh con"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Nút Sửa */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node.id);
              }}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Chỉnh sửa node"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            {/* Nút Xóa (trừ root) */}
            {!node.isRoot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                }}
                className="p-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 transition-colors"
                title="Xóa nhánh này"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MindMapNodeView.displayName = 'MindMapNodeView';
