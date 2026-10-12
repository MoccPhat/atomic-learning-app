import { Category } from './types';

export type RecommendationType =
  | 'urgent_deadline'
  | 'neglected_subject'
  | 'pending_reviews'
  | 'study_momentum';

export type RecommendationSeverity = 'urgent' | 'warning' | 'suggestion' | 'praise';

export interface StudyRecommendation {
  id: string;
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  message: string;
  category?: Category;
  actionText: string;
  actionTab: 'cards' | 'pomodoro' | 'tree' | 'quiz' | 'cornell';
}

export type RoadmapTaskStatus = 'today' | 'in_progress' | 'done';

export interface RoadmapTask {
  id: string;
  title: string;
  category: Category;
  status: RoadmapTaskStatus;
  estimatedMinutes: number;
  targetSubject?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  completedAt?: string;
}

export interface AdvisorInsights {
  readinessScore: number; // Điểm sẵn sàng học tập 0 - 100%
  urgentCount: number;
  totalTasksToday: number;
  completedTasksToday: number;
  neglectedCategories: Category[];
  recommendations: StudyRecommendation[];
}
