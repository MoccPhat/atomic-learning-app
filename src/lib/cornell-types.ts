import { Category } from './types';

export interface CornellCue {
  id: string;
  cue: string;           // Từ khóa, câu hỏi gợi nhớ cốt lõi
  referenceAnswer?: string; // Câu trả lời mẫu / phần giải thích tương ứng (nếu có)
}

export interface CornellNote {
  id: string;
  title: string;
  category: Category;    // 'code' | 'english' | 'book' | 'exam'
  subjectGroup?: string; // Tên môn học / Ngành học liên kết với Cây tài liệu
  weekNumber?: number;   // Tuần học (ví dụ: Tuần 1, Tuần 2...)
  cues: CornellCue[];    // Cột bên trái: Cues / Câu hỏi gợi nhớ
  notes: string;         // Cột bên phải: Ghi chép bài học chính (Markdown, KaTeX, Code)
  summary: string;       // Vùng bên dưới: Tóm tắt 2-3 câu đúc kết
  tags: string[];        // Nhãn tag hỗ trợ tìm kiếm (#react, #algorithm, #vocab...)
  createdAt: string;     // ISO Date
  updatedAt: string;     // ISO Date
}

export interface ConvertCuesResult {
  createdCount: number;
  newCardIds: string[];
}
