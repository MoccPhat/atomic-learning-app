import { CornellNote, ConvertCuesResult } from './cornell-types';
import { addCard } from './storage';

const CORNELL_STORAGE_KEY = 'auto_learning_cornell_notes';

export const INITIAL_CORNELL_NOTES: CornellNote[] = [
  {
    id: 'cornell-demo-1',
    title: 'Thuật toán Tìm kiếm Nhị phân (Binary Search)',
    category: 'code',
    subjectGroup: 'Công nghệ thông tin',
    weekNumber: 3,
    tags: ['algorithm', 'dsa', 'python'],
    cues: [
      {
        id: 'cue-1',
        cue: 'Điều kiện tiên quyết để áp dụng Binary Search là gì?',
        referenceAnswer: 'Mảng dữ liệu đầu vào bắt buộc phải được sắp xếp theo thứ tự (Sorted array).',
      },
      {
        id: 'cue-2',
        cue: 'Độ phức tạp thời gian (Time Complexity) là bao nhiêu?',
        referenceAnswer: 'O(log n) trong cả trường hợp trung bình và tệ nhất; Không gian bộ nhớ O(1).',
      },
      {
        id: 'cue-3',
        cue: 'Cần chú ý gì khi tính mid để tránh lỗi tràn số (Integer Overflow)?',
        referenceAnswer: 'Nên dùng mid = left + (right - left) // 2 thay vì (left + right) // 2 trong các ngôn ngữ có giới hạn kiểu số nguyên.',
      },
    ],
    notes: `### 1. Bản chất thuật toán
Binary Search áp dụng chiến lược **Chia để trị (Divide and Conquer)**:
Mỗi lần so sánh giá trị cần tìm với phần tử chính giữa (\`mid\`), ta loại bỏ được một nửa không gian tìm kiếm còn lại.

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

### 2. Các ứng dụng thực tế
- Tìm vị trí chèn phần tử thích hợp (\`bisect_left\` / \`bisect_right\`).
- Tìm nghiệm của phương trình đơn điệu (Binary Search trên không gian đáp án).`,
    summary: 'Binary Search là thuật toán tìm kiếm tối ưu với độ phức tạp O(log n), điều kiện tiên quyết là mảng phải được sắp xếp. Chú ý công thức tính chỉ số mid an toàn để tránh tràn số.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'cornell-demo-2',
    title: 'Collocations & Idioms trong IELTS Speaking & Writing',
    category: 'english',
    subjectGroup: 'Ngoại ngữ',
    weekNumber: 1,
    tags: ['ielts', 'vocabulary', 'collocation'],
    cues: [
      {
        id: 'cue-eng-1',
        cue: 'Cụm từ nâng cao để thay thế cho "very important"?',
        referenceAnswer: 'Of paramount importance / Play a pivotal role in...',
      },
      {
        id: 'cue-eng-2',
        cue: 'Cụm từ diễn đạt "suy nghĩ sáng tạo, đột phá"?',
        referenceAnswer: 'Think outside the box / Adopt an unconventional approach.',
      },
      {
        id: 'cue-eng-3',
        cue: 'Cách diễn đạt "chịu hậu quả / trả giá"?',
        referenceAnswer: 'Face the music / Bear the brunt of [something].',
      },
    ],
    notes: `### Academic Lexical Resource (Band 7.5+)
Việc sử dụng các cụm từ tự nhiên (Collocations) thay vì ghép từ đơn lẻ giúp tăng band điểm Lexical Resource đáng kể:

1. **Of paramount importance**: Quan trọng hàng đầu.
   * *Example:* "Continuous self-learning is of paramount importance in the era of artificial intelligence."
2. **Pave the way for**: Mở đường cho sự phát triển.
   * *Example:* "Scientific breakthroughs pave the way for modern technological marvels."
3. **Double-edged sword**: Con dao hai lưỡi (dùng rất tốt cho dạng bài thảo luận cả hai mặt Advantages/Disadvantages).`,
    summary: 'Collocations học thuật nâng cao tính tự nhiên cho bài thi IELTS. Tập trung học theo cụm từ và ngữ cảnh câu mẫu thay vì học từng từ vựng riêng lẻ.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

/**
 * Lấy toàn bộ danh sách Cornell Notes (mặc định rỗng để người dùng tự ghi chép bài học)
 */
export function getCornellNotes(): CornellNote[] {
  try {
    const raw = localStorage.getItem(CORNELL_STORAGE_KEY);
    if (!raw) {
      saveCornellNotes([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Lỗi khi đọc Cornell Notes:', e);
    return [];
  }
}

/**
 * Lưu danh sách Cornell Notes vào LocalStorage
 */
export function saveCornellNotes(notes: CornellNote[]): void {
  try {
    localStorage.setItem(CORNELL_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Lỗi khi lưu Cornell Notes:', e);
  }
}

/**
 * Lấy một ghi chú theo ID
 */
export function getCornellNoteById(id: string): CornellNote | undefined {
  const notes = getCornellNotes();
  return notes.find((n) => n.id === id);
}

/**
 * Tạo mới ghi chú Cornell Note
 */
export function createCornellNote(data: Partial<CornellNote>): CornellNote {
  const notes = getCornellNotes();
  const now = new Date().toISOString();
  const newNote: CornellNote = {
    id: `cornell-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: data.title?.trim() || 'Ghi chú bài học mới',
    category: data.category || 'code',
    subjectGroup: data.subjectGroup || undefined,
    weekNumber: data.weekNumber || 1,
    cues: data.cues && data.cues.length > 0 ? data.cues : [
      { id: `cue-${Date.now()}-1`, cue: '', referenceAnswer: '' },
    ],
    notes: data.notes || '',
    summary: data.summary || '',
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  notes.unshift(newNote);
  saveCornellNotes(notes);
  return newNote;
}

/**
 * Cập nhật nội dung một Cornell Note
 */
export function updateCornellNote(id: string, updates: Partial<CornellNote>): CornellNote | null {
  const notes = getCornellNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;

  const updatedNote: CornellNote = {
    ...notes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  notes[index] = updatedNote;
  saveCornellNotes(notes);
  return updatedNote;
}

/**
 * Xóa một Cornell Note
 */
export function deleteCornellNote(id: string): boolean {
  const notes = getCornellNotes();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length !== notes.length) {
    saveCornellNotes(filtered);
    return true;
  }
  return false;
}

/**
 * 1-Click: Chuyển các Cues của Cornell Note thành Flashcard SRS
 */
export function convertCuesToFlashcards(noteId: string, selectedCueIds?: string[]): ConvertCuesResult {
  const note = getCornellNoteById(noteId);
  if (!note) return { createdCount: 0, newCardIds: [] };

  const targetCues = selectedCueIds && selectedCueIds.length > 0
    ? note.cues.filter((c) => selectedCueIds.includes(c.id) && c.cue.trim())
    : note.cues.filter((c) => c.cue.trim());

  if (targetCues.length === 0) {
    return { createdCount: 0, newCardIds: [] };
  }

  const newCardIds: string[] = [];

  targetCues.forEach((cueItem, idx) => {
    const frontText = cueItem.cue.trim();
    // Lấy đáp án đối chiếu từ cue hoặc tóm tắt của bài
    const backText = cueItem.referenceAnswer?.trim()
      ? cueItem.referenceAnswer.trim()
      : note.summary.trim()
      ? `**Tóm tắt bài học:**\n${note.summary.trim()}`
      : `Tham khảo ghi chú: "${note.title}"`;

    const createdCard = addCard({
      title: `${note.title} (Câu hỏi ${idx + 1})`,
      category: note.category,
      front: frontText,
      back: backText,
      tags: [...new Set([...note.tags, 'cornell', note.category])],
    });

    newCardIds.push(createdCard.id);
  });

  return {
    createdCount: newCardIds.length,
    newCardIds,
  };
}

/**
 * Xuất file Markdown chuẩn của bài ghi chú Cornell
 */
export function exportCornellNoteToMarkdown(note: CornellNote): string {
  let md = `# ${note.title}\n`;
  md += `**Danh mục:** ${note.category} | **Môn học:** ${note.subjectGroup || 'Chung'} | **Tuần:** ${note.weekNumber || 1}\n`;
  md += `**Thời gian cập nhật:** ${new Date(note.updatedAt).toLocaleString('vi-VN')}\n\n`;

  md += `## 1. Cột Gợi Nhớ (Cues / Questions)\n`;
  note.cues.forEach((cue, index) => {
    md += `${index + 1}. **${cue.cue}**\n`;
    if (cue.referenceAnswer) {
      md += `   ↳ *Gợi ý đáp án:* ${cue.referenceAnswer}\n`;
    }
  });

  md += `\n## 2. Ghi Chép Chi Tiết (Notes)\n`;
  md += `${note.notes}\n\n`;

  md += `## 3. Tóm Tắt Đúc Kết (Summary)\n`;
  md += `> ${note.summary}\n\n`;

  if (note.tags.length > 0) {
    md += `**Thẻ tag:** ${note.tags.map((t) => `#${t}`).join(' ')}\n`;
  }

  return md;
}
