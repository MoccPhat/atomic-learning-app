import { QuizProgress, QuizSet } from './quiz-types';
import { guessQuizTitle, parseMarkdownQuiz, SAMPLE_QUIZ_MD } from './quiz-parser';

const STORAGE_KEYS = {
  QUIZZES: 'atomic_learning_quizzes',
  PROGRESS_PREFIX: 'atomic_quiz_prog_',
};

/**
 * Khởi tạo dữ liệu mẫu cho bộ đề trắc nghiệm
 */
export function getInitialQuizSet(): QuizSet[] {
  const { questions } = parseMarkdownQuiz(SAMPLE_QUIZ_MD);
  return [
    {
      id: 'quiz-seed-tech',
      name: 'Ôn tập Kiến thức Công nghệ & Lập trình',
      createdAt: Date.now(),
      questions,
    },
  ];
}

/**
 * Tải danh sách bộ đề (mặc định rỗng để người dùng tự thêm dữ liệu của mình)
 */
export function loadQuizSets(): QuizSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    if (raw === null) {
      saveQuizSets([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Lưu danh sách bộ đề
 */
export function saveQuizSets(quizzes: QuizSet[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  } catch (e) {
    console.error('Lỗi khi lưu bộ đề:', e);
  }
}

/**
 * Thêm một bộ đề mới từ Markdown text
 */
export function addQuizSetFromText(
  text: string,
  fallbackName: string = 'Đề trắc nghiệm mới'
): { success: boolean; quiz?: QuizSet; skipped?: number; error?: string } {
  const { questions, skipped } = parseMarkdownQuiz(text);
  if (!questions.length) {
    return {
      success: false,
      error: 'Không đọc được câu hỏi nào. Mỗi câu cần có "Câu N", các dòng A. B. C. D. và dòng "Đáp án: X".',
    };
  }

  const name = guessQuizTitle(text, fallbackName);
  const quizzes = loadQuizSets();
  const existingIndex = quizzes.findIndex((q) => q.name === name);

  const newQuiz: QuizSet = {
    id: existingIndex !== -1 ? quizzes[existingIndex].id : `quiz-${Date.now()}`,
    name,
    createdAt: Date.now(),
    questions,
  };

  if (existingIndex !== -1) {
    quizzes[existingIndex] = newQuiz;
    clearQuizProgress(newQuiz.id);
  } else {
    quizzes.unshift(newQuiz);
  }

  saveQuizSets(quizzes);
  return { success: true, quiz: newQuiz, skipped };
}

/**
 * Xóa một bộ đề
 */
export function deleteQuizSet(id: string): void {
  const quizzes = loadQuizSets();
  const filtered = quizzes.filter((q) => q.id !== id);
  saveQuizSets(filtered);
  clearQuizProgress(id);
}

/**
 * Tải tiến độ làm bài
 */
export function loadQuizProgress(quizId: string): QuizProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS_PREFIX + quizId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Lưu tiến độ làm bài
 */
export function saveQuizProgress(quizId: string, progress: QuizProgress): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS_PREFIX + quizId, JSON.stringify(progress));
  } catch (e) {
    console.error('Lỗi khi lưu tiến độ trắc nghiệm:', e);
  }
}

/**
 * Xóa tiến độ làm bài
 */
export function clearQuizProgress(quizId: string): void {
  localStorage.removeItem(STORAGE_KEYS.PROGRESS_PREFIX + quizId);
}
