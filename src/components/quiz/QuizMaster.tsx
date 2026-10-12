import React, { useState } from 'react';
import { QuizProgress, QuizSet } from '../../lib/quiz-types';
import { loadQuizSets } from '../../lib/quiz-storage';
import { QuizListView } from './QuizListView';
import { QuizPlayerView } from './QuizPlayerView';
import { QuizResultView } from './QuizResultView';
import { MockExamRoom } from './MockExamRoom';
import { MockExamResultView } from './MockExamResultView';
import { MockExamResult } from '../../lib/mock-exam-service';

interface QuizMasterProps {
  onDataChanged?: () => void;
}

export const QuizMaster: React.FC<QuizMasterProps> = ({ onDataChanged }) => {
  const [quizzes, setQuizzes] = useState<QuizSet[]>(() => loadQuizSets());
  const [view, setView] = useState<'list' | 'player' | 'result' | 'mock-exam' | 'mock-result'>('list');
  const [activeQuiz, setActiveQuiz] = useState<QuizSet | null>(null);
  const [activeMode, setActiveMode] = useState<'all' | 'wrong'>('all');
  const [lastProgress, setLastProgress] = useState<QuizProgress | null>(null);

  // Trạng thái Mock Exam Simulator
  const [mockExamDuration, setMockExamDuration] = useState<number>(15);
  const [lastMockResult, setLastMockResult] = useState<MockExamResult | null>(null);

  const refreshQuizzes = () => {
    setQuizzes(loadQuizSets());
    onDataChanged?.();
  };

  const handleStartQuiz = (quiz: QuizSet, mode: 'all' | 'wrong' = 'all') => {
    setActiveQuiz(quiz);
    setActiveMode(mode);
    setView('player');
  };

  const handleStartMockExam = (quiz: QuizSet, durationMinutes: number) => {
    setActiveQuiz(quiz);
    setMockExamDuration(durationMinutes);
    setView('mock-exam');
  };

  const handleFinishQuiz = (progress: QuizProgress) => {
    setLastProgress(progress);
    setView('result');
    refreshQuizzes();
  };

  const handleFinishMockExam = (result: MockExamResult) => {
    setLastMockResult(result);
    setView('mock-result');
    refreshQuizzes();
  };

  const handleRedoWrong = () => {
    if (activeQuiz && lastProgress) {
      handleStartQuiz(activeQuiz, 'wrong');
    }
  };

  const handleRedoAll = () => {
    if (activeQuiz) {
      handleStartQuiz(activeQuiz, 'all');
    }
  };

  const handleRetakeMockExam = () => {
    if (activeQuiz) {
      setView('mock-exam');
    }
  };

  // 1. Chế độ Làm bài thông thường (Quiz Player)
  if (view === 'player' && activeQuiz) {
    return (
      <QuizPlayerView
        quiz={activeQuiz}
        initialMode={activeMode}
        onFinish={handleFinishQuiz}
        onExit={() => {
          setView('list');
          refreshQuizzes();
        }}
      />
    );
  }

  // 2. Chế độ Kết quả làm bài thông thường
  if (view === 'result' && activeQuiz && lastProgress) {
    return (
      <QuizResultView
        quiz={activeQuiz}
        progress={lastProgress}
        onRedoWrong={handleRedoWrong}
        onRedoAll={handleRedoAll}
        onExit={() => {
          setView('list');
          refreshQuizzes();
        }}
      />
    );
  }

  // 3. Chế độ Phòng Thi Thử Mô Phỏng (Mock Exam Room)
  if (view === 'mock-exam' && activeQuiz) {
    return (
      <MockExamRoom
        quiz={activeQuiz}
        durationMinutes={mockExamDuration}
        onFinish={handleFinishMockExam}
        onExit={() => {
          setView('list');
          refreshQuizzes();
        }}
      />
    );
  }

  // 4. Chế độ Kết quả Thi Thử & Radar Điểm Yếu
  if (view === 'mock-result' && lastMockResult) {
    return (
      <MockExamResultView
        result={lastMockResult}
        onRetake={handleRetakeMockExam}
        onExit={() => {
          setView('list');
          refreshQuizzes();
        }}
      />
    );
  }

  // 5. Danh sách bài trắc nghiệm
  return (
    <QuizListView
      quizzes={quizzes}
      onStartQuiz={handleStartQuiz}
      onStartMockExam={handleStartMockExam}
      onRefresh={refreshQuizzes}
    />
  );
};
