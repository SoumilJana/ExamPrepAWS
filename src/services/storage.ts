import { AppSettings, ExamSession, Question, ReadinessBreakdown } from '../types';
import { INITIAL_QUESTIONS } from '../data/initialQuestions';
import { AWS_DOMAINS, PASSING_PERCENTAGE } from '../data/domains';

const STORAGE_KEYS = {
  SETTINGS: 'cloudprep_settings',
  COMPLETED_EXAMS: 'cloudprep_completed_exams',
  ACTIVE_EXAM: 'cloudprep_active_exam',
  QUESTION_BANK: 'cloudprep_questions',
};

export const DEFAULT_SETTINGS: AppSettings = {
  targetExamDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks from now
  targetScorePercentage: 80,
  timerWarning15m: true,
  timerWarning5m: true,
  keyboardShortcutsEnabled: true,
};

// Seed 3 realistic past exam sessions so the demo immediately showcases realistic analytics
export const SAMPLE_COMPLETED_EXAMS: ExamSession[] = [
  {
    id: 'exam-sample-1',
    examNumber: 1,
    seed: 1001,
    questions: INITIAL_QUESTIONS,
    answers: Object.fromEntries(
      INITIAL_QUESTIONS.map((q, idx) => [q.id, idx % 5 === 0 ? ['B'] : q.correctOptionIds])
    ),
    flaggedQuestionIds: ['Q-004', 'Q-018', 'Q-033'],
    currentQuestionIndex: 64,
    startTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    durationMinutes: 90,
    isSubmitted: true,
    submittedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 + 64 * 60 * 1000,
    result: {
      totalQuestions: 65,
      correctAnswers: 52,
      incorrectAnswers: 13,
      unansweredQuestions: 0,
      percentage: 80.0,
      passed: true,
      timeSpentSeconds: 64 * 60,
      domainScores: [
        { domainId: 'domain-1', domainName: 'Cloud Concepts', weight: 24, correct: 14, total: 16, percentage: 87.5 },
        { domainId: 'domain-2', domainName: 'Security and Compliance', weight: 30, correct: 15, total: 20, percentage: 75.0 },
        { domainId: 'domain-3', domainName: 'Cloud Technology and Services', weight: 34, correct: 17, total: 22, percentage: 77.3 },
        { domainId: 'domain-4', domainName: 'Billing, Pricing and Support', weight: 12, correct: 6, total: 7, percentage: 85.7 },
      ],
    },
  },
  {
    id: 'exam-sample-2',
    examNumber: 2,
    seed: 1002,
    questions: INITIAL_QUESTIONS,
    answers: Object.fromEntries(
      INITIAL_QUESTIONS.map((q, idx) => [q.id, idx % 7 === 0 ? ['C'] : q.correctOptionIds])
    ),
    flaggedQuestionIds: ['Q-012', 'Q-022', 'Q-045'],
    currentQuestionIndex: 64,
    startTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    durationMinutes: 90,
    isSubmitted: true,
    submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 + 71 * 60 * 1000,
    result: {
      totalQuestions: 65,
      correctAnswers: 55,
      incorrectAnswers: 9,
      unansweredQuestions: 1,
      percentage: 84.6,
      passed: true,
      timeSpentSeconds: 71 * 60,
      domainScores: [
        { domainId: 'domain-1', domainName: 'Cloud Concepts', weight: 24, correct: 15, total: 16, percentage: 93.8 },
        { domainId: 'domain-2', domainName: 'Security and Compliance', weight: 30, correct: 16, total: 20, percentage: 80.0 },
        { domainId: 'domain-3', domainName: 'Cloud Technology and Services', weight: 34, correct: 18, total: 22, percentage: 81.8 },
        { domainId: 'domain-4', domainName: 'Billing, Pricing and Support', weight: 12, correct: 6, total: 7, percentage: 85.7 },
      ],
    },
  },
];

export const getSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getCompletedExams = (): ExamSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_EXAMS);
    if (!raw) {
      // Initialize with sample exams on first load
      localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(SAMPLE_COMPLETED_EXAMS));
      return SAMPLE_COMPLETED_EXAMS;
    }
    return JSON.parse(raw);
  } catch {
    return SAMPLE_COMPLETED_EXAMS;
  }
};

export const saveCompletedExam = (exam: ExamSession): void => {
  const current = getCompletedExams();
  const updated = [exam, ...current.filter((e) => e.id !== exam.id)];
  localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(updated));
};

export const getActiveExam = (): ExamSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveActiveExam = (exam: ExamSession | null): void => {
  if (!exam) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM, JSON.stringify(exam));
  }
};

export const getQuestionBank = (): Question[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_QUESTIONS;
  }
};

export const calculateReadiness = (completedExams: ExamSession[]): ReadinessBreakdown => {
  if (completedExams.length === 0) {
    return {
      score: 0,
      recentExamsAverage: 0,
      lowestDomainScore: 0,
      questionBankCoverage: 0,
      status: 'Needs Practice',
    };
  }

  // 1. Average of last 3 exams (or all if < 3)
  const last3 = completedExams.slice(0, 3);
  const recentExamsAverage =
    last3.reduce((acc, curr) => acc + (curr.result?.percentage || 0), 0) / last3.length;

  // 2. Lowest domain score across all completed exams
  const domainTotals: Record<string, { correct: number; total: number }> = {
    'domain-1': { correct: 0, total: 0 },
    'domain-2': { correct: 0, total: 0 },
    'domain-3': { correct: 0, total: 0 },
    'domain-4': { correct: 0, total: 0 },
  };

  completedExams.forEach((exam) => {
    exam.result?.domainScores.forEach((ds) => {
      if (domainTotals[ds.domainId]) {
        domainTotals[ds.domainId].correct += ds.correct;
        domainTotals[ds.domainId].total += ds.total;
      }
    });
  });

  const domainPercentages = Object.values(domainTotals).map((d) =>
    d.total > 0 ? (d.correct / d.total) * 100 : 0
  );
  const lowestDomainScore = Math.min(...domainPercentages);

  // 3. Question Bank Coverage (percentage of questions seen)
  const allBank = getQuestionBank();
  const seenIds = new Set<string>();
  completedExams.forEach((exam) => {
    exam.questions.forEach((q) => seenIds.add(q.id));
  });
  const questionBankCoverage = Math.min(100, (seenIds.size / allBank.length) * 100);

  // Formula: 50% recent avg + 30% lowest domain + 20% coverage
  const compositeScore = Math.round(
    0.5 * recentExamsAverage + 0.3 * lowestDomainScore + 0.2 * questionBankCoverage
  );

  let status: 'Ready' | 'Almost Ready' | 'Needs Practice' = 'Needs Practice';
  if (compositeScore >= PASSING_PERCENTAGE && lowestDomainScore >= 65) {
    status = 'Ready';
  } else if (compositeScore >= 60) {
    status = 'Almost Ready';
  }

  return {
    score: Math.min(100, Math.max(0, compositeScore)),
    recentExamsAverage: Math.round(recentExamsAverage * 10) / 10,
    lowestDomainScore: Math.round(lowestDomainScore * 10) / 10,
    questionBankCoverage: Math.round(questionBankCoverage * 10) / 10,
    status,
  };
};

export const exportAppData = (): string => {
  const data = {
    settings: getSettings(),
    completedExams: getCompletedExams(),
    activeExam: getActiveExam(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(data, null, 2);
};

export const importAppData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) saveSettings(data.settings);
    if (data.completedExams) localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(data.completedExams));
    if (data.activeExam !== undefined) saveActiveExam(data.activeExam);
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
};

export const resetAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.COMPLETED_EXAMS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM);
  localStorage.removeItem(STORAGE_KEYS.QUESTION_BANK);
};
