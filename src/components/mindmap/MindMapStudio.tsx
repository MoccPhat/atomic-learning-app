import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Menu,
  Plus,
  Network,
  Trash2,
  FolderPlus,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  MindMap,
  MindMapNode,
  MindMapLayoutMode,
} from '../../lib/mindmap-types';
import {
  getMindMaps,
  getMindMapById,
  saveMindMap,
  createMindMap,
  deleteMindMap,
  addNodeToMindMap,
  updateNodeInMindMap,
  deleteNodeFromMindMap,
  toggleNodeCollapse,
  exportMindMapToMarkdown,
} from '../../lib/mindmap-storage';
import {
  calculateAutoLayout,
  generateCurvedPath,
} from '../../lib/mindmap-layout';
import { useCanvasViewport } from './useCanvasViewport';
import { MindMapNodeView } from './MindMapNodeView';
import { MindMapToolbar } from './MindMapToolbar';
import { Category } from '../../lib/types';

interface MindMapStudioProps {
  onToggleSidebar?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onCardsAdded?: () => void;
}

export const MindMapStudio: React.FC<MindMapStudioProps> = ({
  onToggleSidebar,
  onNavigateToTab: _onNavigateToTab,
  onCardsAdded: _onCardsAdded,
}) => {
  const [mindmaps, setMindmaps] = useState<MindMap[]>(() => getMindMaps());
  const [activeMapId, setActiveMapId] = useState<string>(() => {
    const list = getMindMaps();
    return list.length > 0 ? list[0].id : '';
  });

  const [activeMap, setActiveMap] = useState<MindMap | null>(() => {
    return getMindMapById(activeMapId) || (mindmaps.length > 0 ? mindmaps[0] : null);
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<MindMap[]>([]);
  const [future, setFuture] = useState<MindMap[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modals
  const [isNewMapModalOpen, setIsNewMapModalOpen] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');
  const [newMapCategory, setNewMapCategory] = useState<Category>('code');
  const [newMapLayout, setNewMapLayout] = useState<MindMapLayoutMode>('radial');

  const [isEditNodeModalOpen, setIsEditNodeModalOpen] = useState(false);
  const [editNodeLabel, setEditNodeLabel] = useState('');
  const [editNodeDetail, setEditNodeDetail] = useState('');
  const [editNodeColor, setEditNodeColor] = useState('indigo');

  const containerRef = useRef<HTMLDivElement>(null);

  // Hook quản lý Zoom, Pan và Gestures
  const {
    viewport,
    handlers,
    zoomIn,
    zoomOut,
    resetViewport,
  } = useCanvasViewport({ containerRef });

  // Đổi active map khi activeMapId thay đổi
  useEffect(() => {
    const found = getMindMapById(activeMapId);
    if (found) {
      setActiveMap(found);
      setSelectedNodeId(found.rootNodeId);
      setHistory([]);
      setFuture([]);
    }
  }, [activeMapId]);

  // Cập nhật lại mindmaps list
  const refreshMapsList = () => {
    const list = getMindMaps();
    setMindmaps(list);
  };

  // Helper push history state
  const pushHistory = useCallback((current: MindMap) => {
    setHistory((prev) => [...prev.slice(-25), current]);
    setFuture([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || !activeMap) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [activeMap, ...prev]);
    setActiveMap(previous);
    saveMindMap(previous);
  }, [history, activeMap]);

  const handleRedo = useCallback(() => {
    if (future.length === 0 || !activeMap) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, activeMap]);
    setActiveMap(next);
    saveMindMap(next);
  }, [future, activeMap]);

  // Tự động căn chỉnh Auto-Layout
  const handleAutoLayout = useCallback(() => {
    if (!activeMap) return;
    pushHistory(activeMap);
    const newPositions = calculateAutoLayout(activeMap);

    const updatedNodes = { ...activeMap.nodes };
    for (const [id, pos] of Object.entries(newPositions)) {
      if (updatedNodes[id]) {
        updatedNodes[id] = {
          ...updatedNodes[id],
          x: pos.x,
          y: pos.y,
        };
      }
    }

    const updatedMap: MindMap = {
      ...activeMap,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    setActiveMap(updatedMap);
    saveMindMap(updatedMap);
    showToast('Đã căn chỉnh lại sơ đồ tự động!');
  }, [activeMap, pushHistory]);

  // Thêm node con
  const handleAddChild = useCallback(
    (parentId: string) => {
      if (!activeMap) return;
      pushHistory(activeMap);
      const updated = addNodeToMindMap(activeMap, parentId, 'Nhánh mới');
      setActiveMap(updated);
      refreshMapsList();

      // Tự động auto layout nhẹ để sắp xếp node mới
      const newPos = calculateAutoLayout(updated);
      const syncedNodes = { ...updated.nodes };
      for (const [id, pos] of Object.entries(newPos)) {
        if (syncedNodes[id]) {
          syncedNodes[id] = { ...syncedNodes[id], x: pos.x, y: pos.y };
        }
      }
      const finalMap = { ...updated, nodes: syncedNodes };
      setActiveMap(finalMap);
      saveMindMap(finalMap);

      // Focus node mới
      const parent = finalMap.nodes[parentId];
      if (parent && parent.children.length > 0) {
        setSelectedNodeId(parent.children[parent.children.length - 1]);
      }
    },
    [activeMap, pushHistory]
  );

  // Xóa node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!activeMap || nodeId === activeMap.rootNodeId) return;
      pushHistory(activeMap);
      const updated = deleteNodeFromMindMap(activeMap, nodeId);
      setActiveMap(updated);
      setSelectedNodeId(updated.rootNodeId);
      refreshMapsList();
      showToast('Đã xóa nhánh thành công');
    },
    [activeMap, pushHistory]
  );

  // Thu gọn / mở rộng nhánh
  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      if (!activeMap) return;
      pushHistory(activeMap);
      const updated = toggleNodeCollapse(activeMap, nodeId);
      
      // Tính lại vị trí các node sau khi thu gọn
      const newPositions = calculateAutoLayout(updated);
      const syncedNodes = { ...updated.nodes };
      for (const [id, pos] of Object.entries(newPositions)) {
        if (syncedNodes[id]) {
          syncedNodes[id] = { ...syncedNodes[id], x: pos.x, y: pos.y };
        }
      }
      const finalMap = { ...updated, nodes: syncedNodes };
      setActiveMap(finalMap);
      saveMindMap(finalMap);
    },
    [activeMap, pushHistory]
  );

  // Chỉnh sửa node
  const handleOpenEdit = useCallback(
    (nodeId: string) => {
      if (!activeMap) return;
      const target = activeMap.nodes[nodeId];
      if (!target) return;
      setSelectedNodeId(nodeId);
      setEditNodeLabel(target.label);
      setEditNodeDetail(target.detail || '');
      setEditNodeColor(target.color || 'indigo');
      setIsEditNodeModalOpen(true);
    },
    [activeMap]
  );

  const handleSaveEditNode = () => {
    if (!activeMap || !selectedNodeId) return;
    pushHistory(activeMap);
    const updated = updateNodeInMindMap(activeMap, selectedNodeId, {
      label: editNodeLabel.trim() || 'Nhánh không tên',
      detail: editNodeDetail.trim(),
      color: editNodeColor,
    });
    setActiveMap(updated);
    refreshMapsList();
    setIsEditNodeModalOpen(false);
    showToast('Đã lưu thay đổi!');
  };

  // Đổi nhanh màu sắc node
  const handleChangeColor = useCallback(
    (color: string) => {
      if (!activeMap || !selectedNodeId) return;
      pushHistory(activeMap);
      const updated = updateNodeInMindMap(activeMap, selectedNodeId, { color });
      setActiveMap(updated);
      saveMindMap(updated);
    },
    [activeMap, selectedNodeId, pushHistory]
  );

  // Đổi kiểu hiển thị (Radial <-> Horizontal)
  const handleToggleLayoutMode = useCallback(() => {
    if (!activeMap) return;
    pushHistory(activeMap);
    const nextMode: MindMapLayoutMode =
      activeMap.layoutMode === 'radial' ? 'horizontal' : 'radial';
    const updatedWithMode: MindMap = {
      ...activeMap,
      layoutMode: nextMode,
    };
    const newPos = calculateAutoLayout(updatedWithMode);
    const syncedNodes = { ...updatedWithMode.nodes };
    for (const [id, pos] of Object.entries(newPos)) {
      if (syncedNodes[id]) {
        syncedNodes[id] = { ...syncedNodes[id], x: pos.x, y: pos.y };
      }
    }
    const finalMap = { ...updatedWithMode, nodes: syncedNodes };
    setActiveMap(finalMap);
    saveMindMap(finalMap);
    showToast(`Đã chuyển sang kiểu ${nextMode === 'radial' ? 'Tỏa 2 bên' : 'Cây ngang'}`);
  }, [activeMap, pushHistory]);

  // Tạo map mới
  const handleCreateNewMap = () => {
    if (!newMapTitle.trim()) return;
    const newMap = createMindMap(
      newMapTitle.trim(),
      newMapCategory,
      '',
      newMapLayout
    );
    refreshMapsList();
    setActiveMapId(newMap.id);
    setIsNewMapModalOpen(false);
    setNewMapTitle('');
    showToast('Đã tạo sơ đồ tư duy mới!');
  };

  // Xóa map hiện tại
  const handleDeleteCurrentMap = () => {
    if (!activeMap) return;
    if (mindmaps.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 sơ đồ tư duy');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa sơ đồ "${activeMap.title}" không?`)) {
      deleteMindMap(activeMap.id);
      const remaining = getMindMaps();
      setMindmaps(remaining);
      setActiveMapId(remaining[0].id);
      showToast('Đã xóa sơ đồ tư duy');
    }
  };

  // Xuất Markdown
  const handleExportMarkdown = () => {
    if (!activeMap) return;
    const md = exportMindMapToMarkdown(activeMap);
    navigator.clipboard.writeText(md).then(() => {
      showToast('Đã sao chép cấu trúc Markdown Outline vào bộ nhớ tạm!');
    });
  };

  // Xuất file ảnh SVG trực tiếp tải về
  const handleExportPng = () => {
    if (!activeMap) return;
    const svgElem = document.getElementById('mindmap-svg-canvas');
    if (!svgElem) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElem);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeMap.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}_mindmap.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất sơ đồ thành file SVG vector độ nét cao!');
  };

  // Xử lý phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId && activeMap && selectedNodeId !== activeMap.rootNodeId) {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
      } else if (e.key === 'Enter') {
        if (selectedNodeId) {
          e.preventDefault();
          handleAddChild(selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, activeMap, handleUndo, handleRedo, handleDeleteNode, handleAddChild]);

  // Lấy danh sách đường cong Bézier kết nối các Node
  const connectionPaths = useMemo(() => {
    if (!activeMap) return [];
    const paths: { id: string; d: string; color: string }[] = [];

    const traverse = (nodeId: string) => {
      const parent = activeMap.nodes[nodeId];
      if (!parent || parent.collapsed || !parent.children) return;

      for (const childId of parent.children) {
        const child = activeMap.nodes[childId];
        if (!child) continue;

        const isLeftToRight = child.x >= parent.x;
        const d = generateCurvedPath(parent.x, parent.y, child.x, child.y, isLeftToRight);
        paths.push({
          id: `${parent.id}->${child.id}`,
          d,
          color: child.color || parent.color || 'indigo',
        });

        traverse(childId);
      }
    };

    traverse(activeMap.rootNodeId);
    return paths;
  }, [activeMap]);

  // Danh sách các node hiển thị (bỏ qua các node con của node đang bị collapsed)
  const visibleNodes = useMemo(() => {
    if (!activeMap) return [];
    const visible: MindMapNode[] = [];

    const traverse = (nodeId: string) => {
      const node = activeMap.nodes[nodeId];
      if (!node) return;
      visible.push(node);

      if (!node.collapsed && node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(activeMap.rootNodeId);
    return visible;
  }, [activeMap]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">
      {/* Header Studio */}
      <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between gap-3 shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Ẩn / Hiện Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {activeMap?.title || 'Sơ đồ tư duy'}
              </h1>
            </div>
          </div>
        </div>

        {/* Dropdown chọn Map & Tạo mới */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeMapId}
              onChange={(e) => setActiveMapId(e.target.value)}
              className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 pr-8 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30 cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
            >
              {mindmaps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsNewMapModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo mới</span>
          </button>

          {activeMap && (
            <button
              onClick={handleDeleteCurrentMap}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Xóa sơ đồ này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Vùng Canvas SVG tương tác */}
      <div
        ref={containerRef}
        {...handlers}
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-dot-pattern"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(148, 163, 184, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          touchAction: 'none',
          overscrollBehavior: 'contain',
        }}
      >
        {activeMap && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: '50% 50%',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 0,
                height: 0,
              }}
            >
              {/* Lớp SVG vẽ các đường liên kết Bézier */}
              <svg
                id="mindmap-svg-canvas"
                style={{
                  position: 'absolute',
                  left: -5000,
                  top: -5000,
                  width: 10000,
                  height: 10000,
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                <g transform="translate(5000, 5000)">
                  {connectionPaths.map((cp) => (
                    <path
                      key={cp.id}
                      d={cp.d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      className="text-slate-300 dark:text-slate-700 transition-colors duration-200"
                    />
                  ))}
                </g>
              </svg>

              {/* Lớp hiển thị các khối Node */}
              {visibleNodes.map((node) => (
                <MindMapNodeView
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={(id) => setSelectedNodeId(id)}
                  onAddChild={handleAddChild}
                  onDelete={handleDeleteNode}
                  onToggleCollapse={handleToggleCollapse}
                  onEdit={handleOpenEdit}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Toolbar */}
      {activeMap && (
        <MindMapToolbar
          zoom={viewport.zoom}
          layoutMode={activeMap.layoutMode}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={resetViewport}
          onAutoLayout={handleAutoLayout}
          onToggleLayoutMode={handleToggleLayoutMode}
          onExportMarkdown={handleExportMarkdown}
          onExportPng={handleExportPng}
          onUndo={handleUndo}
          onRedo={handleRedo}
          selectedNodeColor={selectedNodeId ? activeMap.nodes[selectedNodeId]?.color : undefined}
          onChangeColor={handleChangeColor}
        />
      )}

      {/* Modal Chỉnh Sửa Node */}
      {isEditNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Chỉnh Sửa Nhánh Ý Tưởng
              </h3>
              <button
                onClick={() => setIsEditNodeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tiêu đề nhánh
                </label>
                <input
                  type="text"
                  value={editNodeLabel}
                  onChange={(e) => setEditNodeLabel(e.target.value)}
                  placeholder="Nhập tiêu đề ý tưởng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-brand-500/30"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Ghi chú chi tiết (Tùy chọn)
                </label>
                <textarea
                  value={editNodeDetail}
                  onChange={(e) => setEditNodeDetail(e.target.value)}
                  placeholder="Ghi chú thêm về nhánh này..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-500/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Màu sắc nhánh
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { key: 'indigo', label: 'Tím Indigo' },
                    { key: 'emerald', label: 'Xanh Ngọc' },
                    { key: 'sky', label: 'Xanh Dương' },
                    { key: 'amber', label: 'Vàng Cam' },
                    { key: 'rose', label: 'Đỏ Hồng' },
                    { key: 'purple', label: 'Tím Mộng' },
                  ].map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setEditNodeColor(c.key)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        editNodeColor === c.key
                          ? 'scale-110 ring-2 ring-brand-500 dark:ring-white border-white dark:border-slate-900'
                          : 'opacity-70 hover:opacity-100 border-transparent'
                      }`}
                      style={{
                        backgroundColor:
                          c.key === 'indigo'
                            ? '#6366f1'
                            : c.key === 'emerald'
                            ? '#10b981'
                            : c.key === 'sky'
                            ? '#0ea5e9'
                            : c.key === 'amber'
                            ? '#f59e0b'
                            : c.key === 'rose'
                            ? '#f43f5e'
                            : '#a855f7',
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsEditNodeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditNode}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Sơ Đồ Mới */}
      {isNewMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Tạo Sơ Đồ Tư Duy Mới</span>
              </h3>
              <button
                onClick={() => setIsNewMapModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Chủ đề trung tâm (Root Concept)
                </label>
                <input
                  type="text"
                  value={newMapTitle}
                  onChange={(e) => setNewMapTitle(e.target.value)}
                  placeholder="Ví dụ: Thiết Kế Hệ Thống, Lịch Sử Triết Học..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-brand-500/30"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Lĩnh vực học tập
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'code', label: 'Lập trình' },
                    { key: 'english', label: 'Ngoại ngữ' },
                    { key: 'book', label: 'Đọc sách' },
                    { key: 'exam', label: 'Ôn thi cử' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setNewMapCategory(cat.key as Category)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        newMapCategory === cat.key
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Kiểu bố trí ban đầu
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewMapLayout('radial')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      newMapLayout === 'radial'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tỏa 2 bên (Radial)
                  </button>
                  <button
                    onClick={() => setNewMapLayout('horizontal')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      newMapLayout === 'horizontal'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Cây ngang (Horizontal)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsNewMapModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateNewMap}
                disabled={!newMapTitle.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm disabled:opacity-40"
              >
                Tạo Sơ Đồ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3 px-4 rounded-2xl bg-slate-900/90 dark:bg-slate-800/90 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-slate-700 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
