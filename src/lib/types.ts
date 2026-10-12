export type Category = 'code' | 'english' | 'book' | 'exam';

export type ReviewGrade = 1 | 2 | 3 | 4;
// 1 = Quên hoàn toàn (Again) -> Ôn lại ngay trong ngày / ngày mai
// 2 = Khó khăn (Hard) -> Tăng nhẹ interval
// 3 = Nhớ tốt (Good) -> Tăng interval chuẩn theo hệ số
// 4 = Quá dễ (Easy) -> Tăng vọt interval và tăng hệ số ghi nhớ

export interface Card {
  id: string;
  category: Category;
  title: string;
  front: string;          // Khái niệm, từ vựng, câu hỏi
  back: string;           // Lời giải thích, định nghĩa, dịch nghĩa
  codeSnippet?: string;   // Đoạn mã lập trình (nếu có)
  codeLanguage?: string;  // Ngôn ngữ: python, javascript, sql, v.v.
  tags: string[];
  
  // SRS (Spaced Repetition System) metadata
  interval: number;       // Khoảng cách ngày đến lần ôn tiếp theo
  repetitions: number;    // Số lần liên tiếp ôn thành công
  easeFactor: number;     // Hệ số độ khó (mặc định 2.5)
  dueDate: string;        // YYYY-MM-DD
  lastReviewedAt?: string;// ISO timestamp
  createdAt: string;      // ISO timestamp
}

export interface ReviewLog {
  id: string;
  cardId: string;
  grade: ReviewGrade;
  reviewedAt: string;
  previousInterval: number;
  newInterval: number;
}

export interface UserStats {
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalReviews: number;
  historyMap: Record<string, number>; // YYYY-MM-DD -> số thẻ đã ôn
}
