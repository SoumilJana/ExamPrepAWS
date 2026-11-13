export type DomainId = 'domain-1' | 'domain-2' | 'domain-3' | 'domain-4';

export interface DomainInfo {
  id: DomainId;
  name: string;
  weight: number; // percentage (e.g. 24, 30, 34, 12)
  questionCount: number; // approx out of 65
  color: string;
}

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface Question {
  id: string;
  domainId: DomainId;
  domainName: string;
  type: 'single' | 'multiple';
  selectCount?: number; // 1 for single, 2 for "Select TWO", etc.
  questionText: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  explanation: string;
  awsReference?: string;
  source?: string;
  tags?: string[];
  timesSeen?: number;
  timesCorrect?: number;
}

export interface DomainScore {
  domainId: DomainId;
  domainName: string;
  weight: number;
  correct: number;
  total: number;
  percentage: number;
}

export interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  domainScores: DomainScore[];
  questionIds?: string[];
  title?: string;
  isSprint?: boolean;
  sprintCategory?: string;
}

export interface ExamSession {
  id: string;
  examNumber: number;
  seed: number;
  title?: string;
  isSprint?: boolean;
  sprintCategory?: string;
  questionIds?: string[];
  questions: Question[];
  answers: Record<string, string[]>; // questionId -> selectedOptionIds
  flaggedQuestionIds: string[];
  currentQuestionIndex: number;
  startTime: number; // timestamp ms
  durationMinutes: number; // 90 or proportional for sprints
  isSubmitted: boolean;
  submittedAt?: number;
  result?: ExamResult;
}

export interface AppSettings {
  targetExamDate: string; // ISO date 'YYYY-MM-DD'
  targetScorePercentage: number;
  timerWarning15m: boolean;
  timerWarning5m: boolean;
  keyboardShortcutsEnabled: boolean;
}

export interface ReadinessBreakdown {
  score: number; // 0 - 100
  recentExamsAverage: number;
  lowestDomainScore: number;
  questionBankCoverage: number;
  status: 'Ready' | 'Almost Ready' | 'Needs Practice';
}

export interface MistakeRecord {
  questionId: string;
  consecutiveCorrect: number; // target: 2 for graduation
  totalIncorrect: number;
  lastAttemptedAt: number;
  lastSelectedOptions?: string[];
}

export type MistakeVault = Record<string, MistakeRecord>;

