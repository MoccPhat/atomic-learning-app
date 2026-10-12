import { StoredFile } from './tree-types';

/**
 * Giải mã dữ liệu file lưu trong StoredFile thành chuỗi văn bản UTF-8
 * Chuẩn hóa và loại bỏ hoàn toàn mã lặp giữa các component
 */
export function decodeStoredFileData(file: StoredFile): string {
  if (!file || !file.data) return '';

  // 1. Trường hợp data URL dạng text/plain UTF-8
  if (file.data.startsWith('data:text/plain;charset=utf-8,')) {
    try {
      return decodeURIComponent(file.data.replace('data:text/plain;charset=utf-8,', ''));
    } catch {
      return file.data.slice('data:text/plain;charset=utf-8,'.length);
    }
  }

  // 2. Trường hợp data URL dạng application/json UTF-8 (như ipynb, json)
  if (file.data.startsWith('data:application/json;charset=utf-8,')) {
    try {
      return decodeURIComponent(file.data.replace('data:application/json;charset=utf-8,', ''));
    } catch {
      return file.data.slice('data:application/json;charset=utf-8,'.length);
    }
  }

  // 3. Trường hợp Base64
  if (file.data.startsWith('data:') && file.data.includes('base64,')) {
    try {
      const base64 = file.data.split('base64,')[1].trim();
      const binary = atob(base64);
      // Chuyển binary string sang UTF-8 text an toàn
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      // Fallback nếu không phải text
      return '';
    }
  }

  // 4. Nếu là chuỗi raw text thông thường
  return file.data;
}

/**
 * Chuyển đổi chuỗi base64 của data URL thành ArrayBuffer
 */
export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  if (!dataUrl) return new ArrayBuffer(0);

  let base64 = dataUrl;
  if (dataUrl.includes('base64,')) {
    base64 = dataUrl.split('base64,')[1];
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Định dạng dung lượng byte thành chuỗi người đọc được
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
