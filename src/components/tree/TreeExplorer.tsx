import React, { useState, useRef, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Upload,
  Plus,
  Trash2,
  Eye,
  Download,
  ChevronRight,
  ChevronDown,
  Search,
  BookOpen,
  Code,
  Sparkles,
  Layers,
  FileCode2,
  FileArchive,
  Image as ImageIcon,
  Check,
  X,
  FilePlus,
  Clock
} from 'lucide-react';
import {
  TreeData,
  StoredFile,
  groupFilesByExtension,
  ExtensionGroup,
  FileHighlight,
  Subject
} from '../../lib/tree-types';
import {
  addFilesToWeek,
  deleteFileFromWeek,
  addWeekToSubject,
  deleteWeekFromSubject,
  addSubjectToGroup,
  deleteSubjectFromGroup,
  addGroup,
  deleteGroup,
  deleteGroups,
  deleteAllGroups,
  resetTreeToSeedData,
  fileToStoredFile,
  downloadStoredFile,
  updateStoredFileContent,
  updateStoredFileHighlights
} from '../../lib/tree-storage';
import { searchVaultFullText, VaultSearchResult } from '../../lib/vault-search-service';
import { FilePreviewModal } from './FilePreviewModal';
import { SplitScreenReaderModal } from './SplitScreenReaderModal';
import { CreateFileModal } from './CreateFileModal';
import { AddDeadlineModal } from '../deadlines/AddDeadlineModal';
import { DeleteGroupModal } from './DeleteGroupModal';
import { StudyDigestModal } from './StudyDigestModal';
import { CornellNote } from '../../lib/cornell-types';
import { Card } from '../../lib/types';

interface TreeExplorerProps {
  treeData: TreeData;
  onUpdateTree: (newData: TreeData) => void;
  cornellNotes?: CornellNote[];
  cards?: Card[];
  onExtractCards?: (content: string, title: string) => void;
}

export const TreeExplorer: React.FC<TreeExplorerProps> = ({
  treeData,
  onUpdateTree,
  cornellNotes = [],
  cards = [],
  onExtractCards
}) => {
  // Modal xuất cẩm nang ôn tập môn học (E-Book Packager)
  const [digestSubject, setDigestSubject] = useState<Subject | null>(null);

  // Trạng thái mở rộng các node cây (Set các ID)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const s = new Set<string>();
    // Mở sẵn nhóm đầu tiên và môn học đầu tiên để tiện xem
    if (treeData.groups[0]) {
      s.add(treeData.groups[0].id);
      if (treeData.groups[0].subjects[0]) {
        s.add(treeData.groups[0].subjects[0].id);
      }
    }
    return s;
  });

  // Môn học và Tuần đang được chọn để xem chi tiết
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    treeData.groups[0]?.id || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    treeData.groups[0]?.subjects[0]?.id || ''
  );
  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    treeData.groups[0]?.subjects[0]?.weeks[0]?.id || ''
  );

  // Bộ lọc tìm kiếm: theo tên file hoặc toàn văn nội dung
  const [searchMode, setSearchMode] = useState<'name' | 'fulltext'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullTextResults, setFullTextResults] = useState<VaultSearchResult[]>([]);
  const [isSearchingFullText, setIsSearchingFullText] = useState(false);

  // Xem trước file & Đọc chia đôi màn hình
  const [previewingFile, setPreviewingFile] = useState<StoredFile | null>(null);
  const [splitScreenFile, setSplitScreenFile] = useState<StoredFile | null>(null);

  // Kéo thả file upload
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal thêm môn học / Tuần mới
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Modal xóa khối ngành (1 hoặc nhiều hoặc tất cả)
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false);

  const [addWeekModalOpen, setAddWeekModalOpen] = useState(false);
  const [newWeekTitle, setNewWeekTitle] = useState('');

  // Modal tạo tệp tin mới với đuôi tùy chọn
  const [createFileModalOpen, setCreateFileModalOpen] = useState(false);

  // Modal tạo Deadline bài tập gắn với môn và tuần
  const [addDeadlineModalOpen, setAddDeadlineModalOpen] = useState(false);

  // Thông báo toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Tìm đối tượng đang chọn
  const activeGroup = useMemo(
    () => treeData.groups.find((g) => g.id === selectedGroupId) || treeData.groups[0],
    [treeData, selectedGroupId]
  );

  const activeSubject = useMemo(
    () => activeGroup?.subjects.find((s) => s.id === selectedSubjectId) || activeGroup?.subjects[0],
    [activeGroup, selectedSubjectId]
  );

  const activeWeek = useMemo(
    () => activeSubject?.weeks.find((w) => w.id === selectedWeekId) || activeSubject?.weeks[0],
    [activeSubject, selectedWeekId]
  );

  // Danh sách các nhóm đuôi file của Tuần đang chọn
  const extensionGroups = useMemo(() => {
    if (!activeWeek) return [];
    return groupFilesByExtension(activeWeek.files);
  }, [activeWeek]);

  // Xử lý upload file(s)
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeGroup || !activeSubject || !activeWeek) return;

    try {
      const storedList: StoredFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const stored = await fileToStoredFile(files[i]);
        storedList.push(stored);
      }

      const updated = await addFilesToWeek(
        treeData,
        activeGroup.id,
        activeSubject.id,
        activeWeek.id,
        storedList
      );
      onUpdateTree(updated);
      showToast(`Đã nạp ${storedList.length} file và tự động gom vào folder đuôi file!`);
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi nạp file vào hệ thống');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Kéo & Thả file vào vùng
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Tạo file mới với đuôi tùy chọn
  const handleCreateFile = async (newFile: StoredFile) => {
    if (!activeGroup || !activeSubject || !activeWeek) return;
    const updated = await addFilesToWeek(
      treeData,
      activeGroup.id,
      activeSubject.id,
      activeWeek.id,
      [newFile]
    );
    onUpdateTree(updated);
    showToast(`Đã tạo tệp "${newFile.name}" thành công!`);
  };

  // Tìm kiếm toàn văn (Debounce)
  React.useEffect(() => {
    if (searchMode !== 'fulltext' || !searchQuery.trim()) {
      setFullTextResults([]);
      setIsSearchingFullText(false);
      return;
    }

    setIsSearchingFullText(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchVaultFullText(treeData, searchQuery);
        setFullTextResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingFullText(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchMode, searchQuery, treeData]);

  // Lưu nội dung chỉnh sửa từ In-Vault Editor
  const handleSaveFileContent = async (fileId: string, newContent: string) => {
    const updated = await updateStoredFileContent(treeData, fileId, newContent);
    onUpdateTree(updated);
    if (previewingFile && previewingFile.id === fileId) {
      setPreviewingFile((prev) => (prev ? { ...prev, data: newContent } : null));
    }
  };

  // Lưu bút nhớ dòng từ Highlighter
  const handleSaveFileHighlights = async (fileId: string, highlights: FileHighlight[]) => {
    const updated = await updateStoredFileHighlights(treeData, fileId, highlights);
    onUpdateTree(updated);
    if (previewingFile && previewingFile.id === fileId) {
      setPreviewingFile((prev) => (prev ? { ...prev, highlights } : null));
    }
  };

  // Xóa file
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!activeGroup || !activeSubject || !activeWeek) return;
    const updated = await deleteFileFromWeek(
      treeData,
      activeGroup.id,
      activeSubject.id,
      activeWeek.id,
      fileId
    );
    onUpdateTree(updated);
    showToast(`Đã xóa file "${fileName}" thành công!`);
  };

  // Thêm tuần mới
  const handleAddWeekSubmit = async () => {
    if (!activeGroup || !activeSubject) return;
    const updated = await addWeekToSubject(
      treeData,
      activeGroup.id,
      activeSubject.id,
      newWeekTitle
    );
    onUpdateTree(updated);
    setNewWeekTitle('');
    setAddWeekModalOpen(false);
    showToast('Đã thêm Tuần học mới!');
  };

  // Xóa tuần
  const handleDeleteWeek = async (weekId: string, weekTitle: string) => {
    if (!activeGroup || !activeSubject) return;
    const updated = await deleteWeekFromSubject(
      treeData,
      activeGroup.id,
      activeSubject.id,
      weekId
    );
    onUpdateTree(updated);
    showToast(`Đã xóa "${weekTitle}" thành công!`);
  };

  // Thêm môn học mới
  const handleAddSubjectSubmit = async () => {
    if (!activeGroup || !newSubjectName.trim()) return;
    const updated = await addSubjectToGroup(
      treeData,
      activeGroup.id,
      newSubjectName,
      newSubjectCode
    );
    onUpdateTree(updated);
    setNewSubjectName('');
    setNewSubjectCode('');
    setAddSubjectModalOpen(false);
    showToast(`Đã thêm môn học "${newSubjectName}"!`);
  };

  // Xóa môn học
  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!activeGroup) return;
    const updated = await deleteSubjectFromGroup(treeData, activeGroup.id, subjectId);
    onUpdateTree(updated);
    showToast(`Đã xóa môn học "${subjectName}" thành công!`);
  };

  // Thêm nhóm mới
  const handleAddGroupSubmit = async () => {
    if (!newGroupName.trim()) return;
    const updated = await addGroup(treeData, newGroupName);
    onUpdateTree(updated);
    setNewGroupName('');
    setAddGroupModalOpen(false);
    showToast(`Đã thêm khối ngành "${newGroupName}"!`);
  };

  // Đồng bộ lựa chọn hiển thị sau khi xóa một hoặc nhiều ngành học
  const syncSelectionAfterGroupDeletion = (updatedTree: TreeData) => {
    onUpdateTree(updatedTree);
    if (updatedTree.groups.length === 0) {
      setSelectedGroupId('');
      setSelectedSubjectId('');
      setSelectedWeekId('');
      return;
    }

    const currentGroupStillExists = updatedTree.groups.some((g) => g.id === selectedGroupId);
    if (!currentGroupStillExists) {
      const nextGroup = updatedTree.groups[0];
      setSelectedGroupId(nextGroup.id);
      const nextSub = nextGroup.subjects[0];
      if (nextSub) {
        setSelectedSubjectId(nextSub.id);
        if (nextSub.weeks[0]) {
          setSelectedWeekId(nextSub.weeks[0].id);
        } else {
          setSelectedWeekId('');
        }
      } else {
        setSelectedSubjectId('');
        setSelectedWeekId('');
      }
    }
  };

  // Xóa 1 nhóm / ngành học
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const updated = await deleteGroup(treeData, groupId);
    syncSelectionAfterGroupDeletion(updated);
    showToast(`Đã xóa khối ngành "${groupName}" thành công!`);
  };

  // Xóa nhiều nhóm / ngành học đã chọn
  const handleDeleteMultipleGroups = async (groupIds: string[], count: number) => {
    const updated = await deleteGroups(treeData, groupIds);
    syncSelectionAfterGroupDeletion(updated);
    showToast(`Đã xóa thành công ${count} khối ngành học đã chọn!`);
  };

  // Xóa tất cả các nhóm / ngành học
  const handleDeleteAllGroups = async () => {
    const total = treeData.groups.length;
    const updated = await deleteAllGroups();
    syncSelectionAfterGroupDeletion(updated);
    showToast(`Đã xóa toàn bộ ${total} khối ngành học thành công!`);
  };

  // Khôi phục dữ liệu cây mẫu ban đầu
  const handleRestoreTreeSeed = async () => {
    const updated = await resetTreeToSeedData();
    onUpdateTree(updated);
    if (updated.groups[0]) {
      setSelectedGroupId(updated.groups[0].id);
      if (updated.groups[0].subjects[0]) {
        setSelectedSubjectId(updated.groups[0].subjects[0].id);
        if (updated.groups[0].subjects[0].weeks[0]) {
          setSelectedWeekId(updated.groups[0].subjects[0].weeks[0].id);
        }
      }
    }
    showToast('Đã nạp lại dữ liệu cây môn học mẫu ban đầu!');
  };

  // Render icon tương ứng đuôi file
  const renderExtensionIcon = (iconType: ExtensionGroup['iconType']) => {
    switch (iconType) {
      case 'word':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'notebook':
        return <FileCode2 className="w-4 h-4 text-amber-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'code':
        return <Code className="w-4 h-4 text-emerald-500" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-slate-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-brand-500" />;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-6 text-left animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Tài Liệu Học Tập
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Quản lý tài liệu theo cây thư mục môn học
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAddSubjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Thêm môn học</span>
          </button>

          <button
            onClick={() => setAddGroupModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Thêm khối ngành</span>
          </button>

          <button
            type="button"
            onClick={() => setDeleteGroupModalOpen(true)}
            disabled={treeData.groups.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Xóa 1 hoặc nhiều khối ngành học"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Xóa ngành học</span>
            {treeData.groups.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-mono">
                {treeData.groups.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Tree Sidebar + File Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI (4 cols): CÂY THƯ MỤC CÁC MÔN HỌC & TUẦN */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col max-h-[75vh]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-brand-500" /> Cây môn học
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {treeData.groups.length} nhóm
            </span>
          </div>

          {/* Switch chế độ tìm kiếm: Tên file vs Toàn văn nội dung */}
          <div className="flex items-center gap-1 mb-2.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setSearchMode('name')}
              className={`flex-1 py-1 rounded-lg transition-all ${
                searchMode === 'name'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tên file
            </button>
            <button
              onClick={() => setSearchMode('fulltext')}
              className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                searchMode === 'fulltext'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Toàn văn tài liệu</span>
            </button>
          </div>

          {/* Search input */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === 'fulltext'
                  ? 'Tìm từ khóa bên trong tài liệu...'
                  : 'Tìm nhanh file trong cây...'
              }
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* HIỂN THỊ KẾT QUẢ TÌM KIẾM TOÀN VĂN (FULL-TEXT) NẾU ĐANG CHỌN */}
          {searchMode === 'fulltext' && searchQuery.trim() ? (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between pb-1">
                <span>KẾT QUẢ TÌM KIẾM ({fullTextResults.length})</span>
                {isSearchingFullText && (
                  <span className="text-amber-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Đang quét...
                  </span>
                )}
              </div>

              {fullTextResults.length === 0 && !isSearchingFullText ? (
                <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                  <p className="font-bold">Không tìm thấy tài liệu phù hợp</p>
                  <p className="text-[11px]">Thử tìm với từ khóa ngắn hơn hoặc kiểm tra chính tả</p>
                </div>
              ) : (
                fullTextResults.map((res, rIdx) => (
                  <div
                    key={rIdx}
                    onClick={() => {
                      setPreviewingFile(res.file);
                      setSelectedGroupId(res.groupId);
                      setSelectedSubjectId(res.subjectId);
                      setSelectedWeekId(res.weekId);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-brand-50/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 cursor-pointer transition-all space-y-1 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                        {res.file.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                        {res.matchType === 'filename'
                          ? 'Tên file'
                          : res.matchType === 'highlight'
                          ? 'Bút nhớ'
                          : res.lineIndex
                          ? `Dòng ${res.lineIndex}`
                          : 'Nội dung'}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      {res.subjectName} · {res.weekTitle}
                    </div>

                    {res.matchSnippet && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans line-clamp-2 leading-relaxed bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        "{res.matchSnippet}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Danh sách nhánh cây (Scrollable) */
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
            {treeData.groups.length === 0 ? (
              <div className="py-12 px-3 text-center text-slate-400 space-y-2">
                <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto opacity-60" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Chưa có ngành học nào
                </p>
                <p className="text-[11px] text-slate-400">
                  Bấm "Thêm khối ngành" ở trên để bắt đầu tạo cây môn học
                </p>
              </div>
            ) : (
              treeData.groups.map((group) => {
                const isGroupExpanded = expandedNodes.has(group.id);

                return (
                  <div key={group.id} className="space-y-1">
                    {/* Tầng 1: Khối ngành / Học kỳ */}
                    <div
                      className={`group/group-row flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${
                        selectedGroupId === group.id
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-brand-700 dark:text-brand-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        onClick={() => {
                          toggleNode(group.id);
                          setSelectedGroupId(group.id);
                        }}
                        className="flex items-center gap-2 truncate cursor-pointer flex-1"
                      >
                        {isGroupExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate">{group.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[10px] font-mono text-slate-400 px-1">
                          {group.subjects.length} môn
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id, group.name);
                          }}
                          title={`Xóa riêng ngành học "${group.name}"`}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  {/* Tầng 2: Môn học trong nhóm */}
                  {isGroupExpanded && (
                    <div className="pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                      {group.subjects.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic py-1 pl-2">
                          Chưa có môn học nào
                        </div>
                      ) : (
                        group.subjects.map((sub) => {
                          const isSubExpanded = expandedNodes.has(sub.id);
                          const isSubActive = selectedSubjectId === sub.id;

                          return (
                            <div key={sub.id} className="space-y-1">
                              <div
                                onClick={() => {
                                  toggleNode(sub.id);
                                  setSelectedGroupId(group.id);
                                  setSelectedSubjectId(sub.id);
                                  if (sub.weeks[0]) setSelectedWeekId(sub.weeks[0].id);
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                  isSubActive
                                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {isSubExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <BookOpen className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                  <span className="truncate">{sub.name}</span>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                  {sub.weeks.length} tuần
                                </span>
                              </div>

                              {/* Tầng 3: Các Tuần trong môn học */}
                              {isSubExpanded && (
                                <div className="pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                                  {sub.weeks.map((wk) => {
                                    const isWkActive = selectedWeekId === wk.id;

                                    return (
                                      <div
                                        key={wk.id}
                                        onClick={() => {
                                          setSelectedGroupId(group.id);
                                          setSelectedSubjectId(sub.id);
                                          setSelectedWeekId(wk.id);
                                        }}
                                        className={`flex items-center justify-between p-1.5 rounded-lg text-[11px] cursor-pointer transition-colors ${
                                          isWkActive
                                            ? 'bg-brand-500 text-white font-bold shadow-xs'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <FolderOpen className="w-3 h-3 shrink-0" />
                                          <span className="truncate">{wk.title}</span>
                                        </div>
                                        <span className={`text-[10px] font-mono shrink-0 ${isWkActive ? 'text-white/80' : 'text-slate-400'}`}>
                                          {wk.files.length} file
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (8 cols): NỘI DUNG TUẦN & CÁC FOLDER THEO ĐUÔI FILE */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {activeSubject && activeWeek ? (
            <>
              {/* Card thông tin Môn học & Tuần */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                {/* Hàng 1: Tiêu đề Môn học, Tuần hiện tại và Quản lý Tuần/Môn */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-[10px] font-mono font-bold tracking-wide">
                        {activeSubject.code || 'MÔN HỌC'}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 break-words">
                        {activeSubject.name}
                      </h3>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 max-w-full">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{activeWeek.title}</span>
                    </div>
                  </div>

                  {/* Thao tác cấp Tuần & Môn (Thêm tuần, Xóa tuần, Xóa môn) */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => setAddWeekModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                      title="Thêm tuần kế tiếp"
                    >
                      <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Thêm tuần</span>
                    </button>

                    <button
                      onClick={() => handleDeleteWeek(activeWeek.id, activeWeek.title)}
                      className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Xóa tuần này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSubject(activeSubject.id, activeSubject.name)}
                      className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Xóa môn học này"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Hàng 2: Thanh công cụ tạo & nạp tệp tin, xuất cẩm nang và hạn chót */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Nút Tạo file mới theo đuôi mong muốn */}
                  <button
                    onClick={() => setCreateFileModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Tạo file mới (.đuôi)</span>
                  </button>

                  {/* Nút Nạp file có sẵn từ máy */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-colors"
                  >
                    <Upload className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Nạp file từ máy</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleUploadFiles(e.target.files)}
                    multiple
                    className="hidden"
                  />

                  {/* Nút Xuất Cẩm Nang Môn Học E-Book Packager */}
                  {activeSubject && (
                    <button
                      onClick={() => setDigestSubject(activeSubject)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold text-xs shadow-xs transition-colors"
                      title="Đóng gói môn học thành Cẩm nang ôn thi cấp tốc (E-Book Reader & Markdown)"
                    >
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      <span>Xuất Cẩm Nang Môn Học</span>
                    </button>
                  )}

                  {/* Nút Đặt Deadline cho tuần này */}
                  <button
                    onClick={() => setAddDeadlineModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900/60 shadow-xs transition-colors"
                    title="Thêm nhắc nhở deadline bài tập cho tuần này"
                  >
                    <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Deadline tuần</span>
                  </button>
                </div>
              </div>

              {/* Vùng Drag & Drop upload */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                className={`p-6 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                  isDraggingOver
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-101'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Kéo thả file vào đây hoặc bấm để chọn tệp từ thiết bị
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tự động phân loại: <code className="text-brand-600">.docx</code> vào folder .docx, <code className="text-amber-600">.ipynb</code> vào folder .ipynb, code vào .py...
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateFileModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Hoặc bấm vào đây để tạo file mới</span>
                  </button>
                </div>
              </div>

              {/* DANH SÁCH CÁC THƯ MỤC PHÂN LOẠI THEO ĐUÔI FILE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                  <span>CÁC FOLDER PHÂN THEO ĐUÔI FILE ({extensionGroups.length})</span>
                  <span>Tổng {activeWeek.files.length} tệp tin</span>
                </div>

                {extensionGroups.length === 0 ? (
                  <div className="py-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Chưa có tệp tin nào trong {activeWeek.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Kéo thả file .docx, .ipynb, .pdf, .py vào vùng trên để lưu trữ ngay!
                    </p>
                  </div>
                ) : (
                  extensionGroups.map((group) => (
                    <div
                      key={group.extension}
                      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
                    >
                      {/* Tiêu đề Folder đuôi file */}
                      <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                            {renderExtensionIcon(group.iconType)}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            📁 Thư mục {group.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {group.files.length} file
                        </span>
                      </div>

                      {/* Danh sách các file trong folder này */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {group.files.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => setPreviewingFile(file)}
                            className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                            title={`Bấm để mở và đọc nội dung tệp "${file.name}"`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                              <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase shrink-0">
                                .{file.extension}
                              </span>
                              <div className="overflow-hidden flex-1 min-w-0">
                                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                  {file.name}
                                </span>
                                <span className="block text-[11px] text-slate-400 font-mono">
                                  {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>

                            {/* Nút thao tác trên file */}
                            <div
                              className="flex items-center gap-1.5 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setSplitScreenFile(file)}
                                className="p-1.5 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors"
                                title="Đọc chia đôi màn hình (Split-Screen) cùng Ghi chú / Flashcard"
                              >
                                <Layers className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setPreviewingFile(file)}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors"
                                title="Xem trước file"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => downloadStoredFile(file)}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors"
                                title="Tải file về máy"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteFile(file.id, file.name)}
                                className="p-1.5 rounded-xl text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="Xóa file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
              {treeData.groups.length === 0 ? (
                <>
                  <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                    Chưa có ngành học nào trong hệ thống
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Hãy thêm khối ngành mới để quản lý môn học và lưu trữ tài liệu.
                  </p>
                  <div className="flex items-center justify-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAddGroupModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Thêm khối ngành ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreTreeSeed}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                      title="Nạp lại các ngành học và môn học mẫu ban đầu"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Nạp dữ liệu mẫu ban đầu</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Hãy chọn một môn học hoặc tạo môn học mới từ thanh bên trái
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal xem trước tệp tin */}
      <FilePreviewModal
        file={previewingFile}
        onClose={() => setPreviewingFile(null)}
        onSaveContent={handleSaveFileContent}
        onSaveHighlights={handleSaveFileHighlights}
        onOpenSplitView={(f) => setSplitScreenFile(f)}
      />

      {/* Modal Đọc chia đôi màn hình Split-Screen */}
      <SplitScreenReaderModal
        isOpen={Boolean(splitScreenFile)}
        file={splitScreenFile}
        onClose={() => setSplitScreenFile(null)}
        onCardAdded={() => showToast('Đã thêm thẻ Flashcard thành công!')}
        onCornellUpdated={() => showToast('Đã cập nhật bài ghi chú Cornell!')}
      />

      {/* Modal Thêm Môn Học Mới */}
      {addSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Thêm môn học mới vào {activeGroup?.name}
              </h3>
              <button
                onClick={() => setAddSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên môn học *
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Ví dụ: Xử lý ảnh nâng cao, Cấu trúc dữ liệu..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã môn học (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  placeholder="Ví dụ: CS402, IT301"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddSubjectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleAddSubjectSubmit}
                disabled={!newSubjectName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-md"
              >
                Tạo môn học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Khối Ngành Mới */}
      {addGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Thêm khối ngành / học kỳ mới
              </h3>
              <button
                onClick={() => setAddGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên khối ngành hoặc học kỳ *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ví dụ: Năm 3 - Học kỳ 2, Khối Khoa học Dữ liệu..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddGroupModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleAddGroupSubmit}
                disabled={!newGroupName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-md"
              >
                Tạo khối ngành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Tuần Mới */}
      {addWeekModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Thêm tuần học cho {activeSubject?.name}
              </h3>
              <button
                onClick={() => setAddWeekModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề tuần học
                </label>
                <input
                  type="text"
                  value={newWeekTitle}
                  onChange={(e) => setNewWeekTitle(e.target.value)}
                  placeholder={`Ví dụ: Tuần ${(activeSubject?.weeks.length || 0) + 1}: Bài tập thực hành`}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddWeekModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleAddWeekSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
              >
                Thêm tuần
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Tệp Tin Mới Với Đuôi Tùy Chọn */}
      <CreateFileModal
        isOpen={createFileModalOpen}
        onClose={() => setCreateFileModalOpen(false)}
        weekTitle={activeWeek?.title || 'Tuần học'}
        onCreateFile={handleCreateFile}
      />

      {/* Modal Tạo Deadline gắn với môn và tuần hiện tại */}
      <AddDeadlineModal
        isOpen={addDeadlineModalOpen}
        onClose={() => setAddDeadlineModalOpen(false)}
        treeData={treeData}
        initialSubjectId={activeSubject?.id}
        initialWeekId={activeWeek?.id}
        onAdded={(newTask) => {
          showToast(`Đã tạo Deadline: "${newTask.title}"`);
        }}
      />

      {/* Modal Xóa 1 hoặc Nhiều Ngành Học */}
      <DeleteGroupModal
        isOpen={deleteGroupModalOpen}
        onClose={() => setDeleteGroupModalOpen(false)}
        groups={treeData.groups}
        onDeleteSingle={handleDeleteGroup}
        onDeleteMultiple={handleDeleteMultipleGroups}
        onDeleteAll={handleDeleteAllGroups}
      />

      {/* Modal Xuất Cẩm Nang Môn Học E-Book Packager */}
      {digestSubject && (
        <StudyDigestModal
          subject={digestSubject}
          cornellNotes={cornellNotes}
          cards={cards}
          onClose={() => setDigestSubject(null)}
        />
      )}

      {/* Modal Xem Trước & Soạn Thảo Tệp Tin (In-Vault Reader & Editor) */}
      {previewingFile && (
        <FilePreviewModal
          file={previewingFile}
          onClose={() => setPreviewingFile(null)}
          onSaveContent={handleSaveFileContent}
          onSaveHighlights={handleSaveFileHighlights}
          onOpenSplitView={(f) => {
            setPreviewingFile(null);
            setSplitScreenFile(f);
          }}
          onExtractCards={onExtractCards}
        />
      )}

      {/* Modal Đọc Chia Đôi Màn Hình (Split-Screen Reader song song Cornell/Flashcards) */}
      {splitScreenFile && (
        <SplitScreenReaderModal
          isOpen={!!splitScreenFile}
          file={splitScreenFile}
          onClose={() => setSplitScreenFile(null)}
          onCardAdded={() => {
            showToast('Đã thêm Flashcard từ tài liệu!');
          }}
          onCornellUpdated={() => {
            showToast('Đã cập nhật Ghi chú Cornell từ tài liệu!');
          }}
        />
      )}
    </div>
  );
};
