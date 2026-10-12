export interface FileHighlight {
  id: string;
  text: string;
  color: 'yellow' | 'green' | 'pink' | 'blue';
  createdAt: string;
  note?: string;
}

export interface StoredFile {
  id: string;
  name: string;
  extension: string; // e.g. 'docx', 'ipynb', 'pdf', 'py'
  size: number; // bytes
  mimeType: string;
  createdAt: string; // ISO date string
  data: string; // Data URL (base64) or text content
  note?: string;
  highlights?: FileHighlight[];
}

export interface WeekFolder {
  id: string;
  weekNumber: number;
  title: string;
  files: StoredFile[];
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  weeks: WeekFolder[];
}

export interface SubjectGroup {
  id: string;
  name: string; // e.g. "Khối ngành CNTT" or "Học kỳ 1"
  subjects: Subject[];
}

export interface TreeData {
  groups: SubjectGroup[];
}

export interface ExtensionGroup {
  extension: string;
  label: string;
  iconType: 'word' | 'notebook' | 'pdf' | 'code' | 'slide' | 'sheet' | 'image' | 'archive' | 'file';
  files: StoredFile[];
}

/**
 * Phân tích và chuẩn hóa phần mở rộng của file
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return 'unknown';
  return parts.pop()!.toLowerCase().trim();
}

/**
 * Phân loại icon và nhãn hiển thị theo đuôi file
 */
export function getExtensionMeta(ext: string): {
  label: string;
  iconType: ExtensionGroup['iconType'];
  color: string;
} {
  const e = ext.toLowerCase();
  switch (e) {
    case 'docx':
    case 'doc':
      return { label: `Tài liệu Word (.${e})`, iconType: 'word', color: 'text-blue-600 dark:text-blue-400' };
    case 'ipynb':
      return { label: `Jupyter Notebook (.${e})`, iconType: 'notebook', color: 'text-amber-600 dark:text-amber-400' };
    case 'pdf':
      return { label: `Tài liệu PDF (.${e})`, iconType: 'pdf', color: 'text-rose-600 dark:text-rose-400' };
    case 'py':
    case 'js':
    case 'ts':
    case 'cpp':
    case 'c':
    case 'java':
    case 'html':
    case 'css':
      return { label: `Mã nguồn Code (.${e})`, iconType: 'code', color: 'text-emerald-600 dark:text-emerald-400' };
    case 'pptx':
    case 'ppt':
      return { label: `Slide thuyết trình (.${e})`, iconType: 'slide', color: 'text-orange-600 dark:text-orange-400' };
    case 'xlsx':
    case 'xls':
    case 'csv':
      return { label: `Bảng tính Excel (.${e})`, iconType: 'sheet', color: 'text-green-600 dark:text-green-400' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return { label: `Hình ảnh (.${e})`, iconType: 'image', color: 'text-purple-600 dark:text-purple-400' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
      return { label: `File nén (.${e})`, iconType: 'archive', color: 'text-slate-600 dark:text-slate-400' };
    default:
      return { label: `Tập tin .${e}`, iconType: 'file', color: 'text-slate-500 dark:text-slate-400' };
  }
}

/**
 * Tự động gom nhóm các file trong một Tuần theo đuôi file (.docx theo .docx, .ipynb theo .ipynb...)
 */
export function groupFilesByExtension(files: StoredFile[]): ExtensionGroup[] {
  const map = new Map<string, StoredFile[]>();

  for (const f of files) {
    const ext = f.extension || getFileExtension(f.name);
    if (!map.has(ext)) {
      map.set(ext, []);
    }
    map.get(ext)!.push(f);
  }

  // Chuyển Map thành mảng ExtensionGroup sắp xếp theo tên đuôi file
  const groups: ExtensionGroup[] = [];
  for (const [ext, groupFiles] of map.entries()) {
    const meta = getExtensionMeta(ext);
    groups.push({
      extension: ext,
      label: meta.label,
      iconType: meta.iconType,
      files: groupFiles,
    });
  }

  return groups.sort((a, b) => a.extension.localeCompare(b.extension));
}
