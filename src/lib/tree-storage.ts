import { TreeData, StoredFile, getFileExtension, SubjectGroup, FileHighlight, Subject, WeekFolder } from './tree-types';
import { INITIAL_TREE_DATA } from './tree-seed-data';

const DB_NAME = 'AtomicLearnVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'vault_data';
const KEY_TREE_ROOT = 'tree_root';
const LOCAL_STORAGE_BACKUP_KEY = 'atomic_learn_tree_data_backup';

/**
 * Mở kết nối IndexedDB (hoạt động offline trên cả PC & Mobile)
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Tải toàn bộ cây dữ liệu từ IndexedDB (kèm fallback LocalStorage & Seed Data)
 */
export async function loadTreeData(): Promise<TreeData> {
  try {
    const db = await openDB();
    const data = await new Promise<TreeData | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_TREE_ROOT);
      req.onsuccess = () => resolve(req.result as TreeData | undefined);
      req.onerror = () => reject(req.error);
    });

    if (data && Array.isArray(data.groups)) {
      return data;
    }
  } catch (err) {
    console.warn('IndexedDB load error, trying localStorage fallback:', err);
    try {
      const backup = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup) as TreeData;
        if (parsed && Array.isArray(parsed.groups)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // Nếu chưa có dữ liệu, khởi tạo cây rỗng để người dùng tự thêm dữ liệu của mình
  const emptyTree: TreeData = { groups: [] };
  await saveTreeData(emptyTree);
  return emptyTree;
}

/**
 * Lưu cây dữ liệu vào IndexedDB
 */
export async function saveTreeData(data: TreeData): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, KEY_TREE_ROOT);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save error, using localStorage fallback:', err);
    try {
      // Lưu bản sao nhỏ vào LocalStorage nếu file nhỏ
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(data));
    } catch {
      // ignore overflow
    }
  }
}

/**
 * Chuyển đổi đối tượng File từ trình duyệt (kéo thả hoặc upload) thành StoredFile
 */
export function fileToStoredFile(file: File, note?: string): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const ext = getFileExtension(file.name);

      const stored: StoredFile = {
        id: 'f-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        name: file.name,
        extension: ext,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        createdAt: new Date().toISOString(),
        data: dataUrl,
        note: note || '',
      };
      resolve(stored);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Tạo một file mới với phần mở rộng (.đuôi) theo ý muốn của người dùng
 */
export function createNewStoredFile(
  baseName: string,
  extension: string,
  initialContent?: string,
  note?: string
): StoredFile {
  let cleanExt = extension.trim().toLowerCase();
  if (cleanExt.startsWith('.')) {
    cleanExt = cleanExt.slice(1);
  }
  if (!cleanExt) cleanExt = 'txt';

  let fileName = baseName.trim();
  if (!fileName) fileName = 'Tep_tin_moi';
  if (!fileName.toLowerCase().endsWith('.' + cleanExt)) {
    fileName = `${fileName}.${cleanExt}`;
  }

  let dataUrl = '';
  let mimeType = 'text/plain';
  let size = 0;

  if (cleanExt === 'ipynb') {
    mimeType = 'application/x-ipynb+json';
    const starterCells = initialContent?.trim()
      ? [
          {
            cell_type: 'markdown',
            metadata: {},
            source: [`# ${fileName}\n`, 'Tài liệu thực hành Jupyter Notebook.']
          },
          {
            cell_type: 'code',
            execution_count: null,
            metadata: {},
            outputs: [],
            source: initialContent.split('\n').map((l, i, arr) => (i < arr.length - 1 ? l + '\n' : l))
          }
        ]
      : [
          {
            cell_type: 'markdown',
            metadata: {},
            source: [`# ${fileName}\n`, 'Tài liệu thực hành Jupyter Notebook.']
          },
          {
            cell_type: 'code',
            execution_count: null,
            metadata: {},
            outputs: [],
            source: ["# Viết mã nguồn Python ở đây\n", "print('Xin chào!')"]
          }
        ];

    const ipynbJson = JSON.stringify(
      {
        cells: starterCells,
        metadata: {
          kernelspec: {
            display_name: 'Python 3',
            language: 'python',
            name: 'python3'
          }
        },
        nbformat: 4,
        nbformat_minor: 2
      },
      null,
      2
    );
    dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(ipynbJson);
    size = new Blob([ipynbJson]).size;
  } else if (cleanExt === 'docx') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    dataUrl = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABgAIAAAAIQA=';
    size = 1024;
  } else if (cleanExt === 'json') {
    mimeType = 'application/json';
    const jsonContent = initialContent?.trim() || '{\n  "title": "' + fileName + '"\n}';
    dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
    size = new Blob([jsonContent]).size;
  } else {
    if (['py'].includes(cleanExt)) {
      mimeType = 'text/x-python';
    } else if (['md', 'markdown'].includes(cleanExt)) {
      mimeType = 'text/markdown';
    } else if (['html'].includes(cleanExt)) {
      mimeType = 'text/html';
    } else if (['css'].includes(cleanExt)) {
      mimeType = 'text/css';
    } else if (['js', 'ts'].includes(cleanExt)) {
      mimeType = 'text/javascript';
    } else if (['sql'].includes(cleanExt)) {
      mimeType = 'text/x-sql';
    }

    const defaultContent =
      initialContent !== undefined && initialContent !== ''
        ? initialContent
        : cleanExt === 'py'
        ? `# ${fileName}\n# Mã nguồn Python\n\ndef main():\n    print("Bắt đầu bài học...")\n\nif __name__ == '__main__':\n    main()\n`
        : cleanExt === 'md'
        ? `# ${fileName}\n\n## 1. Mục tiêu bài học\n\n- Ghi chú nội dung...\n`
        : cleanExt === 'sql'
        ? `-- ${fileName}\nSELECT * FROM hoc_tap;\n`
        : `Nội dung tệp ${fileName}\n`;

    dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(defaultContent);
    size = new Blob([defaultContent]).size;
  }

  return {
    id: 'f-created-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    name: fileName,
    extension: cleanExt,
    size,
    mimeType,
    createdAt: new Date().toISOString(),
    data: dataUrl,
    note: note || '',
  };
}

/**
 * Thêm một hoặc nhiều file vào một Tuần xác định
 */
export async function addFilesToWeek(
  current: TreeData,
  groupId: string,
  subjectId: string,
  weekId: string,
  newFiles: StoredFile[]
): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        subjects: g.subjects.map((s) => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            weeks: s.weeks.map((w) => {
              if (w.id !== weekId) return w;
              return {
                ...w,
                files: [...w.files, ...newFiles],
              };
            }),
          };
        }),
      };
    }),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Xóa một file trong một Tuần
 */
export async function deleteFileFromWeek(
  current: TreeData,
  groupId: string,
  subjectId: string,
  weekId: string,
  fileId: string
): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        subjects: g.subjects.map((s) => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            weeks: s.weeks.map((w) => {
              if (w.id !== weekId) return w;
              return {
                ...w,
                files: w.files.filter((f) => f.id !== fileId),
              };
            }),
          };
        }),
      };
    }),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Thêm tuần mới cho một môn học
 */
export async function addWeekToSubject(
  current: TreeData,
  groupId: string,
  subjectId: string,
  customTitle?: string
): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        subjects: g.subjects.map((s) => {
          if (s.id !== subjectId) return s;
          const nextWeekNum = s.weeks.length + 1;
          const title = customTitle?.trim() || `Tuần ${nextWeekNum}: Bài học & Thực hành`;
          return {
            ...s,
            weeks: [
              ...s.weeks,
              {
                id: `wk-${subjectId}-${Date.now()}`,
                weekNumber: nextWeekNum,
                title,
                files: [],
              },
            ],
          };
        }),
      };
    }),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Xóa một tuần trong môn học
 */
export async function deleteWeekFromSubject(
  current: TreeData,
  groupId: string,
  subjectId: string,
  weekId: string
): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        subjects: g.subjects.map((s) => {
          if (s.id !== subjectId) return s;
          return {
            ...s,
            weeks: s.weeks.filter((w) => w.id !== weekId),
          };
        }),
      };
    }),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Thêm môn học mới vào nhóm
 */
export async function addSubjectToGroup(
  current: TreeData,
  groupId: string,
  name: string,
  code?: string,
  description?: string
): Promise<TreeData> {
  const newSubject = {
    id: `sub-${Date.now()}`,
    name: name.trim(),
    code: code?.trim(),
    description: description?.trim(),
    weeks: [
      {
        id: `wk-sub-${Date.now()}-1`,
        weekNumber: 1,
        title: 'Tuần 1: Giới thiệu & Cài đặt môi trường',
        files: [],
      },
    ],
  };

  const updated: TreeData = {
    groups: current.groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        subjects: [...g.subjects, newSubject],
      };
    }),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Xóa một môn học
 */
export async function deleteSubjectFromGroup(
  current: TreeData,
  groupId: string,
  subjectId: string
): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        subjects: g.subjects.filter((s) => s.id !== subjectId),
      };
    }),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Thêm một nhóm / ngành / học kỳ mới
 */
export async function addGroup(current: TreeData, name: string): Promise<TreeData> {
  const updated: TreeData = {
    groups: [
      ...current.groups,
      {
        id: `grp-${Date.now()}`,
        name: name.trim(),
        subjects: [],
      },
    ],
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Xóa một nhóm / khối ngành
 */
export async function deleteGroup(current: TreeData, groupId: string): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.filter((g) => g.id !== groupId),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Xóa nhiều nhóm / khối ngành cùng lúc
 */
export async function deleteGroups(current: TreeData, groupIds: string[]): Promise<TreeData> {
  const idSet = new Set(groupIds);
  const updated: TreeData = {
    groups: current.groups.filter((g) => !idSet.has(g.id)),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Xóa tất cả các nhóm / khối ngành
 */
export async function deleteAllGroups(): Promise<TreeData> {
  const updated: TreeData = {
    groups: [],
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Khôi phục lại cây tài liệu mẫu ban đầu
 */
export async function resetTreeToSeedData(): Promise<TreeData> {
  await saveTreeData(INITIAL_TREE_DATA);
  return INITIAL_TREE_DATA;
}

/**
 * Đếm tổng số lượng file trong một nhóm / khối ngành cụ thể
 */
export function countFilesInGroup(group: SubjectGroup): number {
  let count = 0;
  for (const s of group.subjects) {
    for (const w of s.weeks) {
      count += w.files.length;
    }
  }
  return count;
}

/**
 * Đếm tổng số lượng file trong toàn bộ cây tài liệu
 */
export function countTotalFilesInTree(data: TreeData): number {
  let count = 0;
  for (const g of data.groups) {
    for (const s of g.subjects) {
      for (const w of s.weeks) {
        count += w.files.length;
      }
    }
  }
  return count;
}

/**
 * Tải file về máy tính hoặc điện thoại
 */
export function downloadStoredFile(file: StoredFile): void {
  try {
    const a = document.createElement('a');
    a.href = file.data;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
    window.open(file.data, '_blank');
  }
}

/**
 * Tìm file trong toàn bộ cây dữ liệu
 */
export function findFileInTree(
  tree: TreeData,
  fileId: string
): { file: StoredFile; week: WeekFolder; subject: Subject; group: SubjectGroup } | null {
  for (const group of tree.groups) {
    for (const subject of group.subjects) {
      for (const week of subject.weeks) {
        const found = week.files.find((f) => f.id === fileId);
        if (found) {
          return { file: found, week, subject, group };
        }
      }
    }
  }
  return null;
}

/**
 * Cập nhật nội dung văn bản của file và lưu vào IndexedDB
 */
export async function updateStoredFileContent(
  current: TreeData,
  fileId: string,
  newContentText: string
): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.map((group) => ({
      ...group,
      subjects: group.subjects.map((subject) => ({
        ...subject,
        weeks: subject.weeks.map((week) => ({
          ...week,
          files: week.files.map((file) => {
            if (file.id !== fileId) return file;

            const ext = (file.extension || '').toLowerCase();
            let newDataUrl = file.data;
            let newSize = file.size;

            if (ext === 'ipynb' || ext === 'json') {
              newDataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(newContentText);
              newSize = new Blob([newContentText]).size;
            } else {
              newDataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(newContentText);
              newSize = new Blob([newContentText]).size;
            }

            return {
              ...file,
              data: newDataUrl,
              size: newSize,
            };
          }),
        })),
      })),
    })),
  };

  await saveTreeData(updated);
  return updated;
}

/**
 * Cập nhật danh sách bút nhớ dòng (highlights) của file và lưu vào IndexedDB
 */
export async function updateStoredFileHighlights(
  current: TreeData,
  fileId: string,
  highlights: FileHighlight[]
): Promise<TreeData> {
  const updated: TreeData = {
    groups: current.groups.map((group) => ({
      ...group,
      subjects: group.subjects.map((subject) => ({
        ...subject,
        weeks: subject.weeks.map((week) => ({
          ...week,
          files: week.files.map((file) => {
            if (file.id !== fileId) return file;
            return {
              ...file,
              highlights,
            };
          }),
        })),
      })),
    })),
  };

  await saveTreeData(updated);
  return updated;
}

