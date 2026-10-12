export interface QuizOption {
  key: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuizQuestion {
  n: number;
  chapter?: string;
  stem: string;
  options: QuizOption[];
  answer: string; // 'A', 'B', 'C'...
  explain?: string;
  note?: string;
}

export interface QuizSet {
  id: string;
  name: string;
  createdAt: number;
  questions: QuizQuestion[];
}

export interface QuizProgress {
  order: number[];
  pos: number;
  firstTry: Record<number, boolean>;
  wrong: Record<number, number>;
  mode: 'all' | 'wrong';
  done: boolean;
  cur?: {
    pos: number;
    wrong: string[];
    answered: boolean;
  };
}
