import { MistakeVault, MistakeRecord, Question, ExamSession } from '../types';
import { getCompletedExams, getQuestionBank } from './storage';
import { supabase } from './supabaseClient';
import { getSyncKey } from './cloudSync';

const MISTAKE_VAULT_KEY = 'cloudprep_mistake_vault';

export const getMistakeVault = (): MistakeVault => {
  try {
    const raw = localStorage.getItem(MISTAKE_VAULT_KEY);
    const vault: MistakeVault = raw ? JSON.parse(raw) : {};

    // Auto-reconcile with completed exams if vault has fewer records than historical errors
    const completedExams = getCompletedExams();
    let updated = false;

    completedExams.forEach((exam) => {
      exam.questions.forEach((q) => {
        const userAns = exam.answers[q.id] || [];
        const isCorrect =
          userAns.length > 0 &&
          [...userAns].sort().join(',') === [...q.correctOptionIds].sort().join(',');

        if (!isCorrect && userAns.length > 0) {
          if (!vault[q.id]) {
            vault[q.id] = {
              questionId: q.id,
              consecutiveCorrect: 0,
              totalIncorrect: 1,
              lastAttemptedAt: exam.submittedAt || Date.now(),
              lastSelectedOptions: userAns,
            };
            updated = true;
          }
        }
      });
    });

    if (updated) {
      localStorage.setItem(MISTAKE_VAULT_KEY, JSON.stringify(vault));
    }

    return vault;
  } catch {
    return {};
  }
};

export const saveMistakeVault = (vault: MistakeVault): void => {
  try {
    localStorage.setItem(MISTAKE_VAULT_KEY, JSON.stringify(vault));

    // Asynchronously push to Supabase user_sync
    const syncKey = getSyncKey();
    supabase
      .from('user_sync')
      .update({
        settings: {
          ...JSON.parse(localStorage.getItem('cloudprep_settings') || '{}'),
          mistake_vault: vault,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('sync_key', syncKey)
      .then(() => {});
  } catch (err) {
    console.warn('Failed to save mistake vault:', err);
  }
};

export const recordExamMistakes = (exam: ExamSession): MistakeVault => {
  const vault = getMistakeVault();

  exam.questions.forEach((q) => {
    const userAns = exam.answers[q.id] || [];
    const isCorrect =
      userAns.length > 0 &&
      [...userAns].sort().join(',') === [...q.correctOptionIds].sort().join(',');

    if (!isCorrect) {
      if (vault[q.id]) {
        vault[q.id] = {
          ...vault[q.id],
          totalIncorrect: vault[q.id].totalIncorrect + 1,
          consecutiveCorrect: 0, // Reset streak on mistake
          lastAttemptedAt: exam.submittedAt || Date.now(),
          lastSelectedOptions: userAns,
        };
      } else {
        vault[q.id] = {
          questionId: q.id,
          consecutiveCorrect: 0,
          totalIncorrect: 1,
          lastAttemptedAt: exam.submittedAt || Date.now(),
          lastSelectedOptions: userAns,
        };
      }
    }
  });

  saveMistakeVault(vault);
  return vault;
};

export const recordDrillAnswer = (
  questionId: string,
  isCorrect: boolean,
  selectedOptions: string[]
): MistakeRecord => {
  const vault = getMistakeVault();
  const existing = vault[questionId] || {
    questionId,
    consecutiveCorrect: 0,
    totalIncorrect: 1,
    lastAttemptedAt: Date.now(),
  };

  const updatedRecord: MistakeRecord = {
    ...existing,
    consecutiveCorrect: isCorrect ? Math.min(2, existing.consecutiveCorrect + 1) : 0,
    totalIncorrect: isCorrect ? existing.totalIncorrect : existing.totalIncorrect + 1,
    lastAttemptedAt: Date.now(),
    lastSelectedOptions: selectedOptions,
  };

  vault[questionId] = updatedRecord;
  saveMistakeVault(vault);
  return updatedRecord;
};

export interface VaultStats {
  totalTracked: number;
  activeCount: number; // consecutiveCorrect < 2
  masteredCount: number; // consecutiveCorrect >= 2
  graduationRate: number; // % mastered
  domainCounts: Record<string, { total: number; active: number; mastered: number }>;
}

export const getVaultStats = (vault: MistakeVault, questions: Question[]): VaultStats => {
  const qMap = new Map<string, Question>();
  questions.forEach((q) => qMap.set(q.id, q));

  let totalTracked = 0;
  let activeCount = 0;
  let masteredCount = 0;

  const domainCounts: Record<string, { total: number; active: number; mastered: number }> = {
    'domain-1': { total: 0, active: 0, mastered: 0 },
    'domain-2': { total: 0, active: 0, mastered: 0 },
    'domain-3': { total: 0, active: 0, mastered: 0 },
    'domain-4': { total: 0, active: 0, mastered: 0 },
  };

  Object.values(vault).forEach((rec) => {
    const q = qMap.get(rec.questionId);
    if (!q) return;

    totalTracked++;
    const isMastered = rec.consecutiveCorrect >= 2;

    if (isMastered) {
      masteredCount++;
    } else {
      activeCount++;
    }

    if (domainCounts[q.domainId]) {
      domainCounts[q.domainId].total++;
      if (isMastered) {
        domainCounts[q.domainId].mastered++;
      } else {
        domainCounts[q.domainId].active++;
      }
    }
  });

  const graduationRate = totalTracked > 0 ? Math.round((masteredCount / totalTracked) * 100) : 0;

  return {
    totalTracked,
    activeCount,
    masteredCount,
    graduationRate,
    domainCounts,
  };
};

export const getDrillQuestions = (
  vault: MistakeVault,
  allQuestions: Question[],
  options?: { domainId?: string; onlyActive?: boolean; limit?: number }
): Question[] => {
  const qMap = new Map<string, Question>();
  allQuestions.forEach((q) => qMap.set(q.id, q));

  let candidates = Object.values(vault)
    .filter((rec) => {
      if (options?.onlyActive !== false && rec.consecutiveCorrect >= 2) {
        return false; // Skip already mastered questions by default
      }
      return true;
    })
    .map((rec) => ({
      rec,
      question: qMap.get(rec.questionId),
    }))
    .filter((item): item is { rec: MistakeRecord; question: Question } => !!item.question);

  if (options?.domainId && options.domainId !== 'all') {
    candidates = candidates.filter((item) => item.question.domainId === options.domainId);
  }

  // Sort by priority: lowest consecutiveCorrect first, then highest totalIncorrect
  candidates.sort((a, b) => {
    if (a.rec.consecutiveCorrect !== b.rec.consecutiveCorrect) {
      return a.rec.consecutiveCorrect - b.rec.consecutiveCorrect;
    }
    return b.rec.totalIncorrect - a.rec.totalIncorrect;
  });

  const result = candidates.map((item) => item.question);
  if (options?.limit && options.limit > 0) {
    return result.slice(0, options.limit);
  }
  return result;
};
