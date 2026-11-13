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

export const getQuestionBank = (): Question[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    const parsed: Question[] = JSON.parse(raw);
    // If cached question count is old (less than 1000), upgrade to full 1050 bank
    if (!Array.isArray(parsed) || parsed.length < 1000) {
      localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    return parsed;
  } catch {
    return INITIAL_QUESTIONS;
  }
};

/**
 * Hydrates an ExamSession to ensure questions are fully populated from the Question Bank.
 * Handles cases where sessions were stored in Supabase/localStorage with only question IDs or answers.
 */
export const hydrateExamQuestions = (exam: ExamSession): ExamSession => {
  if (!exam) return exam;

  const bank = getQuestionBank();
  const bankMap = new Map<string, Question>();
  bank.forEach((q) => bankMap.set(q.id, q));

  // If questions already populated and valid, return with questionIds recorded
  if (exam.questions && exam.questions.length > 0 && exam.questions[0]?.questionText) {
    return {
      ...exam,
      questionIds: exam.questionIds || exam.questions.map((q) => q.id),
      title: exam.title || exam.result?.title || `Exam #${exam.examNumber}`,
      isSprint: exam.isSprint ?? exam.result?.isSprint ?? (exam.durationMinutes < 90 || (exam.result && exam.result.totalQuestions < 65)),
    };
  }

  // 1. Try explicit questionIds list (from exam or result)
  const explicitIds: string[] =
    (exam.questionIds && exam.questionIds.length > 0)
      ? exam.questionIds
      : (exam.result?.questionIds && exam.result.questionIds.length > 0)
      ? exam.result.questionIds
      : [];

  let resolvedQuestions: Question[] = [];

  if (explicitIds.length > 0) {
    resolvedQuestions = explicitIds
      .map((id) => bankMap.get(id))
      .filter((q): q is Question => q !== undefined);
  }

  // 2. Recover any answered questions not already in the list
  if (exam.answers) {
    const answeredIds = Object.keys(exam.answers);
    answeredIds.forEach((id) => {
      const q = bankMap.get(id);
      if (q && !resolvedQuestions.some((rq) => rq.id === id)) {
        resolvedQuestions.push(q);
      }
    });
  }

  // Also include flagged questions if any
  if (exam.flaggedQuestionIds && exam.flaggedQuestionIds.length > 0) {
    exam.flaggedQuestionIds.forEach((id) => {
      const q = bankMap.get(id);
      if (q && !resolvedQuestions.some((rq) => rq.id === id)) {
        resolvedQuestions.push(q);
      }
    });
  }

  // 3. If there are unanswered questions in the exam that were not in answers,
  // reconstruct them matching the domain distribution so totalQuestions matches!
  if (exam.result && resolvedQuestions.length < exam.result.totalQuestions) {
    const existingIds = new Set(resolvedQuestions.map((q) => q.id));

    const missingDomains: ('domain-1' | 'domain-2' | 'domain-3' | 'domain-4')[] = [];
    if (exam.result.domainScores && exam.result.domainScores.length > 0) {
      exam.result.domainScores.forEach((ds) => {
        const inResolved = resolvedQuestions.filter((q) => q.domainId === ds.domainId).length;
        const missingInDomain = ds.total - inResolved;
        for (let i = 0; i < missingInDomain; i++) {
          missingDomains.push(ds.domainId);
        }
      });
    }

    missingDomains.forEach((dId) => {
      const candidate = bank.find((q) => q.domainId === dId && !existingIds.has(q.id));
      if (candidate) {
        resolvedQuestions.push(candidate);
        existingIds.add(candidate.id);
      }
    });
  }

  return {
    ...exam,
    title: exam.title || exam.result?.title || `Exam #${exam.examNumber}`,
    isSprint: exam.isSprint ?? exam.result?.isSprint ?? (exam.durationMinutes < 90 || (exam.result && exam.result.totalQuestions < 65)),
    sprintCategory: exam.sprintCategory || exam.result?.sprintCategory,
    questionIds: resolvedQuestions.map((q) => q.id),
    questions: resolvedQuestions,
  };
};

export const getCompletedExams = (): ExamSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_EXAMS);
    if (!raw) {
      return [];
    }
    const parsed: ExamSession[] = JSON.parse(raw);
    // Purge any legacy demo exam records and hydrate questions
    const cleaned = parsed
      .filter((e) => !e.id.startsWith('exam-sample-'))
      .map(hydrateExamQuestions);
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
};

export const saveCompletedExam = (exam: ExamSession): void => {
  const hydrated = hydrateExamQuestions(exam);
  const current = getCompletedExams();
  const updated = [hydrated, ...current.filter((e) => e.id !== hydrated.id)];
  localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(updated));
};

export const getActiveExam = (): ExamSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM);
    return raw ? hydrateExamQuestions(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

export const saveActiveExam = (exam: ExamSession | null): void => {
  if (!exam) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM, JSON.stringify(hydrateExamQuestions(exam)));
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
