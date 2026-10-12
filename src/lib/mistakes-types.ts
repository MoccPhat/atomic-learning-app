export type MistakeSource = 'quiz' | 'flashcard';

export type MistakeReason =
  | 'careless' // Đọc ẩu / Nhầm lẫn chi tiết nhỏ
  | 'forgot_concept' // Quên kiến thức / Công thức
  | 'tricky' // Bị bẫy / Câu hỏi đánh đố
  | 'unlearned' // Chưa học phần này
  | 'unknown'; // Chưa xác định

export interface MistakeReasonConfig {
  label: string;
  emoji: string;
  color: string;
  desc: string;
}

export const MISTAKE_REASONS: Record<MistakeReason, MistakeReasonConfig> = {
  careless: {
    label: 'Đọc ẩu / Nhầm lẫn',
    emoji: '👀',
    color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    desc: 'Biết làm nhưng nhìn nhầm đề hoặc bấm vội',
  },
  forgot_concept: {
    label: 'Quên công thức / Khái niệm',
    emoji: '🧠',
    color: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
    desc: 'Đã từng học nhưng lâu ngày không ôn lại',
  },
  tricky: {
    label: 'Bị bẫy đề bài',
    emoji: '🪤',
    color: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
    desc: 'Câu hỏi có phương án gây nhiễu tinh vi',
  },
  unlearned: {
    label: 'Chưa học phần này',
    emoji: '📚',
    color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    desc: 'Kiến thức mới toanh cần bổ sung tài liệu',
  },
  unknown: {
    label: 'Chưa phân loại',
    emoji: '❓',
    color: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
    desc: 'Chưa chỉ định nguyên nhân sai',
  },
};

export interface MistakeItem {
  id: string;
  sourceType: MistakeSource;
  sourceId?: string; // ID của đề quiz hoặc ID của thẻ
  sourceName?: string; // Tên đề hoặc môn học
  question: string;
  userChoice?: string; // Lựa chọn sai của người dùng
  correctAnswer: string; // Đáp án đúng
  options?: string[]; // Các phương án nếu là trắc nghiệm
  explanation?: string; // Giải thích chi tiết
  category?: string; // Môn học / Danh mục
  reason: MistakeReason;
  userNote?: string; // Ghi chú cá nhân rút kinh nghiệm
  failCount: number; // Số lần làm sai
  createdAt: number;
  lastFailedAt: number;
  mastered: boolean; // Đã phục thù thành công và làm chủ kiến thức
  masteredAt?: number;
}
