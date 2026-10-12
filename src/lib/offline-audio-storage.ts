/**
 * Offline Audio Storage Helper - Lưu trữ và phát file nhạc cá nhân Offline qua IndexedDB
 */

export interface CustomOfflineAudioFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  dataUrl: string;
  addedAt: string;
}

const DB_NAME = 'atomic_offline_audio_db';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ trong môi trường này'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lấy danh sách tất cả các file nhạc đã lưu trong máy
 */
export async function getAllOfflineAudios(): Promise<CustomOfflineAudioFile[]> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Lỗi đọc IndexedDB audio:', e);
    return [];
  }
}

/**
 * Lưu 1 file âm thanh mới vào máy
 */
export async function saveOfflineAudio(file: File): Promise<CustomOfflineAudioFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const record: CustomOfflineAudioFile = {
          id: `local-audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          size: file.size,
          mimeType: file.type || 'audio/mpeg',
          dataUrl,
          addedAt: new Date().toISOString(),
        };

        const db = await openAudioDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);

        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Xóa 1 file âm thanh khỏi bộ nhớ
 */
export async function deleteOfflineAudio(id: string): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Lỗi xóa IndexedDB audio:', e);
  }
}
