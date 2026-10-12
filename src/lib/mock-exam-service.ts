import { QuizQuestion, QuizSet, QuizOption } from './quiz-types';

export interface ExamQuestionState {
  originalIndex: number;
  question: QuizQuestion;
  shuffledChoices: QuizOption[];
  chosenKey?: string;
  flagged?: boolean;
}

export interface DimensionScore {
  dimension: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface MockExamResult {
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  correctCount: number;
  scoreOutOf10: number;
  percentage: number;
  durationSeconds: number;
  timeSpentSeconds: number;
  dimensions: DimensionScore[];
  weakestDimension: string | null;
  wrongQuestions: {
    questionText: string;
    chosenKey?: string;
    chosenText?: string;
    correctKey: string;
    correctText: string;
    explanation?: string;
  }[];
  submittedAt: string;
}

/**
 * Các khía cạnh nhận thức đánh giá trong đề thi
 */
export const EXAM_DIMENSIONS = [
  'Lý thuyết cốt lõi',
  'Cú pháp & Định dạng',
  'Xử lý biên & Ngoại lệ',
  'Ứng dụng & Thực hành',
  'Tư duy giải thuật & Tối ưu',
] as const;

/**
 * Phân loại câu hỏi vào một trong 5 khía cạnh nhận thức dựa vào từ khóa
 */
export function categorizeQuestionDimension(q: QuizQuestion): string {
  const text = (q.stem + ' ' + (q.explain || '')).toLowerCase();

  // 1. Kiểm tra ngoại lệ & lỗi biên trước
  if (
    text.includes('ngoại lệ') ||
    text.includes('exception') ||
    text.includes('lỗi') ||
    text.includes('null') ||
    text.includes('undefined') ||
    text.includes('biên') ||
    text.includes('edge case')
  ) {
    return 'Xử lý biên & Ngoại lệ';
  }
  // 2. Thuật toán & tối ưu
  if (
    text.includes('tối ưu') ||
    text.includes('độ phức tạp') ||
    text.includes('big o') ||
    text.includes('thuật toán') ||
    text.includes('hiệu năng') ||
    text.includes('giải thuật')
  ) {
    return 'Tư duy giải thuật & Tối ưu';
  }
  // 3. Ứng dụng & thực hành
  if (
    text.includes('ứng dụng') ||
    text.includes('thực tế') ||
    text.includes('khi nào nên') ||
    text.includes('best practice') ||
    text.includes('pattern') ||
    text.includes('thiết kế')
  ) {
    return 'Ứng dụng & Thực hành';
  }
  // 4. Cú pháp & định dạng
  if (
    text.includes('cú pháp') ||
    text.includes('syntax') ||
    text.includes('khai báo') ||
    text.includes('toán tử') ||
    text.includes('từ khóa')
  ) {
    return 'Cú pháp & Định dạng';
  }
  return 'Lý thuyết cốt lõi';
}

/**
 * Xáo trộn một mảng ngẫu nhiên (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Chuẩn bị câu hỏi cho phòng thi thử (xáo trộn thứ tự và đáp án)
 */
export function prepareExamQuestions(
  quiz: QuizSet,
  shuffleQuestions = true,
  shuffleChoices = true
): ExamQuestionState[] {
  let indices = quiz.questions.map((_, i) => i);
  if (shuffleQuestions) {
    indices = shuffleArray(indices);
  }

  return indices.map((idx) => {
    const q = quiz.questions[idx];
    let choices: QuizOption[] = [...q.options];

    if (shuffleChoices) {
      choices = shuffleArray(choices);
    }

    return {
      originalIndex: idx,
      question: q,
      shuffledChoices: choices,
      chosenKey: undefined,
      flagged: false,
    };
  });
}

/**
 * Chấm điểm và phân tích radar điểm yếu
 */
export function gradeMockExam(
  quiz: QuizSet,
  questions: ExamQuestionState[],
  durationSeconds: number,
  timeSpentSeconds: number
): MockExamResult {
  const total = questions.length;
  let correctCount = 0;

  const dimensionMap: Record<string, { total: number; correct: number }> = {};
  EXAM_DIMENSIONS.forEach((dim) => {
    dimensionMap[dim] = { total: 0, correct: 0 };
  });

  const wrongQuestions: MockExamResult['wrongQuestions'] = [];

  questions.forEach((qState) => {
    const q = qState.question;
    const dim = categorizeQuestionDimension(q);
    if (!dimensionMap[dim]) {
      dimensionMap[dim] = { total: 0, correct: 0 };
    }
    dimensionMap[dim].total += 1;

    const isCorrect = qState.chosenKey === q.answer;
    if (isCorrect) {
      correctCount += 1;
      dimensionMap[dim].correct += 1;
    } else {
      const chosenChoice = qState.shuffledChoices.find((c) => c.key === qState.chosenKey);
      const correctChoice = q.options.find((c) => c.key === q.answer);

      wrongQuestions.push({
        questionText: q.stem,
        chosenKey: qState.chosenKey,
        chosenText: chosenChoice ? chosenChoice.text : 'Không chọn',
        correctKey: q.answer,
        correctText: correctChoice ? correctChoice.text : q.answer,
        explanation: q.explain,
      });
    }
  });

  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const scoreOutOf10 = total > 0 ? Math.round((correctCount / total) * 100) / 10 : 0;

  // Tính tỷ lệ phần trăm theo từng chiều nhận thức
  const dimensions: DimensionScore[] = EXAM_DIMENSIONS.map((dim) => {
    const data = dimensionMap[dim] || { total: 0, correct: 0 };
    const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 100;
    return {
      dimension: dim,
      total: data.total,
      correct: data.correct,
      percentage: pct,
    };
  });

  // Tìm chiều có điểm thấp nhất (có câu hỏi tham gia)
  const evaluatedDims = dimensions.filter((d) => d.total > 0);
  evaluatedDims.sort((a, b) => a.percentage - b.percentage);
  const weakestDimension =
    evaluatedDims.length > 0 && evaluatedDims[0].percentage < 80 ? evaluatedDims[0].dimension : null;

  return {
    quizId: quiz.id,
    quizTitle: quiz.name,
    totalQuestions: total,
    correctCount,
    scoreOutOf10,
    percentage,
    durationSeconds,
    timeSpentSeconds,
    dimensions,
    weakestDimension,
    wrongQuestions,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Chuyển đổi dữ liệu Radar thành các tọa độ đa giác SVG (Polygon SVG points)
 */
export function calculateRadarSvgPoints(
  dimensions: DimensionScore[],
  center = 120,
  radius = 90
): { polygonPoints: string; axisPoints: { x: number; y: number; label: string; pct: number }[] } {
  const count = dimensions.length;
  const angleStep = (Math.PI * 2) / count;

  const points: { x: number; y: number }[] = [];
  const axisPoints: { x: number; y: number; label: string; pct: number }[] = [];

  dimensions.forEach((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const valueRatio = Math.max(0.1, Math.min(1.0, d.percentage / 100));
    const r = radius * valueRatio;

    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    points.push({ x, y });

    const labelR = radius + 22;
    const lx = center + labelR * Math.cos(angle);
    const ly = center + labelR * Math.sin(angle);
    axisPoints.push({ x: lx, y: ly, label: d.dimension, pct: d.percentage });
  });

  const polygonPoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return { polygonPoints, axisPoints };
}
