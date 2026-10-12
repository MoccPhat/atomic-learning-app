import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  Layers,
  CheckSquare,
  Square,
  BookOpen,
  FileText
} from 'lucide-react';
import { SubjectGroup } from '../../lib/tree-types';
import { countFilesInGroup } from '../../lib/tree-storage';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: SubjectGroup[];
  onDeleteSingle: (groupId: string, groupName: string) => void;
  onDeleteMultiple: (groupIds: string[], count: number) => void;
  onDeleteAll: () => void;
}

export const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
  isOpen,
  onClose,
  groups,
  onDeleteSingle,
  onDeleteMultiple,
  onDeleteAll,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Tự động làm sạch trạng thái lựa chọn mỗi khi mở modal hoặc danh sách groups thay đổi
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validSelectedIds = Array.from(selectedIds).filter((id) =>
    groups.some((g) => g.id === id)
  );
  const totalGroups = groups.length;
  const isAllSelected = totalGroups > 0 && validSelectedIds.length === totalGroups;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(groups.map((g) => g.id)));
    }
  };

  const handleSingleDelete = (groupId: string, groupName: string) => {
    onDeleteSingle(groupId, groupName);
    onClose();
  };

  const handleBatchDelete = () => {
    if (validSelectedIds.length === 0) return;
    onDeleteMultiple(validSelectedIds, validSelectedIds.length);
    onClose();
  };

  const handleAllDelete = () => {
    onDeleteAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Xóa Ngành Học (Khối Ngành)
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Chọn 1 hoặc nhiều ngành cần xóa, hoặc dọn sạch toàn bộ cây ngành học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {totalGroups === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Hiện tại không có ngành học nào trong hệ thống.
            </div>
          ) : (
            <>
              {/* Thanh chọn nhanh & thống kê */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${totalGroups} ngành)`}
                  </span>
                </button>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Đã chọn: <span className="font-bold text-brand-600 dark:text-brand-400">{validSelectedIds.length}</span>/{totalGroups} ngành
                </div>
              </div>

              {/* Danh sách các ngành học để tick chọn 1 hoặc nhiều */}
              <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                {groups.map((group) => {
                  const isChecked = selectedIds.has(group.id);
                  const filesCount = countFilesInGroup(group);

                  return (
                    <div
                      key={group.id}
                      onClick={() => handleToggleSelect(group.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate flex-1">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-rose-600 text-white'
                              : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isChecked && <CheckSquare className="w-3.5 h-3.5" />}
                        </div>

                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>

                        <div className="truncate">
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {group.name}
                          </span>
                          <span className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-brand-500" />
                              {group.subjects.length} môn học
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-sky-500" />
                              {filesCount} file
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Nút xóa nhanh riêng lẻ 1 ngành */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleDelete(group.id, group.name);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:border-rose-900 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                        title={`Xóa chỉ riêng ngành "${group.name}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Nút hành động xóa các mục đã chọn */}
              {validSelectedIds.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 animate-fade-in">
                  <div>
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                      Đã chọn {validSelectedIds.length} ngành học
                    </span>
                    <span className="text-[11px] text-rose-700/80 dark:text-rose-300/80 block mt-0.5">
                      Xóa tất cả các ngành đã đánh dấu cùng toàn bộ môn học và file bên trong.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md shadow-rose-600/30 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa {validSelectedIds.length} ngành</span>
                  </button>
                </div>
              )}

              {/* Tùy chọn 2: Xóa tất cả các ngành học */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Xóa tất cả ({totalGroups} ngành học)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Dọn dẹp sạch toàn bộ các ngành học trong cây lưu trữ để thiết lập lại từ đầu.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAllDelete}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all shrink-0 flex items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ⚡ Thao tác thực hiện tức thì, có thông báo thành công
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
