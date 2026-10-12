import { describe, it, expect } from 'vitest';
import {
  prepareExamQuestions,
  gradeMockExam,
  calculateRadarSvgPoints,
  categorizeQuestionDimension,
} from '../lib/mock-exam-service';
import { QuizSet } from '../lib/quiz-types';

describe('Mock Exam Simulator Engine', () => {
  const sampleQuiz: QuizSet = {
    id: 'test-quiz',
    name: 'Đề thi Thử Python',
    createdAt: Date.now(),
    questions: [
      {
        n: 1,
        stem: 'Cú pháp khai báo biến trong Python là gì?',
        options: [
          { key: 'A', text: 'var x = 10' },
          { key: 'B', text: 'x = 10' },
          { key: 'C', text: 'int x = 10' },
          { key: 'D', text: 'let x = 10' },
        ],
        answer: 'B',
        explain: 'Python dùng cú pháp gán trực tiếp.',
      },
      {
        n: 2,
        stem: 'Khối lệnh nào dùng để bắt ngoại lệ exception?',
        options: [
          { key: 'A', text: 'try...catch' },
          { key: 'B', text: 'try...except' },
          { key: 'C', text: 'do...catch' },
          { key: 'D', text: 'catch...finally' },
        ],
        answer: 'B',
        explain: 'Python sử dụng try...except.',
      },
      {
        n: 3,
        stem: 'Độ phức tạp thuật toán tìm kiếm nhị phân (Binary Search) là gì?',
        options: [
          { key: 'A', text: 'O(n)' },
          { key: 'B', text: 'O(log n)' },
          { key: 'C', text: 'O(1)' },
          { key: 'D', text: 'O(n^2)' },
        ],
        answer: 'B',
        explain: 'Binary search chia đôi không gian tìm kiếm.',
      },
      {
        n: 4,
        stem: 'Khi nào nên sử dụng pattern Singleton trong ứng dụng thực tế?',
        options: [
          { key: 'A', text: 'Khi cần đa luồng' },
          { key: 'B', text: 'Khi chỉ cần duy nhất một thể hiện instance' },
          { key: 'C', text: 'Luôn luôn' },
          { key: 'D', text: 'Không bao giờ' },
        ],
        answer: 'B',
        explain: 'Singleton đảm bảo chỉ có 1 instance duy nhất.',
      },
    ],
  };

  it('chuẩn bị câu hỏi phòng thi xáo trộn đầy đủ', () => {
    const examQuestions = prepareExamQuestions(sampleQuiz, true, true);
    expect(examQuestions.length).toBe(sampleQuiz.questions.length);
    examQuestions.forEach((eq) => {
      expect(eq.shuffledChoices.length).toBe(4);
      expect(eq.chosenKey).toBeUndefined();
      expect(eq.flagged).toBe(false);
    });
  });

  it('phân loại đúng các khía cạnh nhận thức câu hỏi', () => {
    expect(categorizeQuestionDimension(sampleQuiz.questions[0])).toBe('Cú pháp & Định dạng');
    expect(categorizeQuestionDimension(sampleQuiz.questions[1])).toBe('Xử lý biên & Ngoại lệ');
    expect(categorizeQuestionDimension(sampleQuiz.questions[2])).toBe('Tư duy giải thuật & Tối ưu');
    expect(categorizeQuestionDimension(sampleQuiz.questions[3])).toBe('Ứng dụng & Thực hành');
  });

  it('chấm điểm thi đạt 100% khi trả lời đúng toàn bộ', () => {
    const examQuestions = prepareExamQuestions(sampleQuiz, false, false);
    examQuestions.forEach((eq) => {
      eq.chosenKey = eq.question.answer;
    });

    const result = gradeMockExam(sampleQuiz, examQuestions, 900, 120);
    expect(result.correctCount).toBe(4);
    expect(result.percentage).toBe(100);
    expect(result.scoreOutOf10).toBe(10);
    expect(result.wrongQuestions.length).toBe(0);
    expect(result.weakestDimension).toBeNull();
  });

  it('phát hiện đúng câu sai và chiều điểm yếu khi làm sai', () => {
    const examQuestions = prepareExamQuestions(sampleQuiz, false, false);
    // Đúng câu 0, sai câu 1, 2, 3
    examQuestions[0].chosenKey = 'B'; // Đúng
    examQuestions[1].chosenKey = 'A'; // Sai (Đáp án là B)
    examQuestions[2].chosenKey = 'A'; // Sai (Đáp án là B)
    examQuestions[3].chosenKey = 'A'; // Sai (Đáp án là B)

    const result = gradeMockExam(sampleQuiz, examQuestions, 900, 300);
    expect(result.correctCount).toBe(1);
    expect(result.percentage).toBe(25);
    expect(result.scoreOutOf10).toBe(2.5);
    expect(result.wrongQuestions.length).toBe(3);
    expect(result.weakestDimension).toBeTruthy();
  });

  it('tính toán tọa độ SVG Radar Chart chính xác không bị NaN', () => {
    const examQuestions = prepareExamQuestions(sampleQuiz, false, false);
    examQuestions[0].chosenKey = 'B';
    const result = gradeMockExam(sampleQuiz, examQuestions, 900, 300);

    const { polygonPoints, axisPoints } = calculateRadarSvgPoints(result.dimensions, 150, 100);
    expect(polygonPoints).toBeTruthy();
    expect(polygonPoints).not.toContain('NaN');
    expect(axisPoints.length).toBe(result.dimensions.length);
    axisPoints.forEach((ap) => {
      expect(isNaN(ap.x)).toBe(false);
      expect(isNaN(ap.y)).toBe(false);
    });
  });

  it('đáp án trắc nghiệm khi bị xáo trộn ngẫu nhiên vẫn bảo toàn tính toàn vẹn của key và answer gốc', () => {
    const q = sampleQuiz.questions[0]; // answer: 'B'
    // Giả lập xáo trộn ngẫu nhiên
    const shuffled = [...q.options].reverse();
    
    // Tìm phương án đúng trong mảng xáo trộn
    const correctOpt = shuffled.find((opt) => opt.key === q.answer);
    expect(correctOpt).toBeDefined();
    expect(correctOpt?.text).toBe('x = 10');
    expect(correctOpt?.key).toBe('B');

    // Giả lập người dùng bấm theo vị trí hiển thị trên màn hình (0..3 tương ứng A..D mới)
    const targetIdx = shuffled.findIndex((opt) => opt.key === q.answer);
    const chosenByDisplayPosition = shuffled[targetIdx];
    expect(chosenByDisplayPosition.key).toBe(q.answer);
  });
});
