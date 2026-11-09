import { DomainId, ExamResult, ExamSession, Question } from '../types';
import { AWS_DOMAINS, EXAM_DURATION_MINUTES, EXAM_QUESTION_COUNT, PASSING_PERCENTAGE } from '../data/domains';
import { getCompletedExams, getQuestionBank, saveActiveExam, saveCompletedExam } from './storage';

export const generateNewExam = (): ExamSession => {
  const allQuestions = getQuestionBank();

  // Group questions by domain
  const byDomain: Record<DomainId, Question[]> = {
    'domain-1': allQuestions.filter((q) => q.domainId === 'domain-1'),
    'domain-2': allQuestions.filter((q) => q.domainId === 'domain-2'),
    'domain-3': allQuestions.filter((q) => q.domainId === 'domain-3'),
    'domain-4': allQuestions.filter((q) => q.domainId === 'domain-4'),
  };

  // Helper to shuffle an array
  const shuffle = <T>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Select questions according to blueprint weights (16, 20, 22, 7 = 65)
  const selected: Question[] = [];
  (Object.keys(AWS_DOMAINS) as DomainId[]).forEach((domainId) => {
    const count = AWS_DOMAINS[domainId].questionCount;
    const available = shuffle(byDomain[domainId]);
    selected.push(...available.slice(0, count));
  });

  // Final shuffle so questions from different domains appear mixed throughout the exam
  const randomizedExamQuestions = shuffle(selected);

  const pastExams = getCompletedExams();
  const nextExamNumber = pastExams.length + 1;

  const newSession: ExamSession = {
    id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    examNumber: nextExamNumber,
    seed: Date.now(),
    questions: randomizedExamQuestions,
    answers: {},
    flaggedQuestionIds: [],
    currentQuestionIndex: 0,
    startTime: Date.now(),
    durationMinutes: EXAM_DURATION_MINUTES,
    isSubmitted: false,
  };

  saveActiveExam(newSession);
  return newSession;
};

export const gradeExam = (session: ExamSession): ExamResult => {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  // Domain score tracking
  const domainStats: Record<DomainId, { correct: number; total: number }> = {
    'domain-1': { correct: 0, total: 0 },
    'domain-2': { correct: 0, total: 0 },
    'domain-3': { correct: 0, total: 0 },
    'domain-4': { correct: 0, total: 0 },
  };

  session.questions.forEach((q) => {
    const userAnswers = session.answers[q.id] || [];
    domainStats[q.domainId].total += 1;

    if (userAnswers.length === 0) {
      unansweredCount++;
      return;
    }

    // Strict all-or-nothing official AWS evaluation:
    // Sorted user choices must exactly equal sorted correct choices
    const sortedUser = [...userAnswers].sort().join(',');
    const sortedCorrect = [...q.correctOptionIds].sort().join(',');

    if (sortedUser === sortedCorrect) {
      correctCount++;
      domainStats[q.domainId].correct += 1;
    } else {
      incorrectCount++;
    }
  });

  const percentage = Math.round((correctCount / session.questions.length) * 1000) / 10; // 1 decimal place
  const passed = percentage >= PASSING_PERCENTAGE;

  const domainScores = (Object.keys(AWS_DOMAINS) as DomainId[]).map((dId) => {
    const stats = domainStats[dId];
    return {
      domainId: dId,
      domainName: AWS_DOMAINS[dId].name,
      weight: AWS_DOMAINS[dId].weight,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 1000) / 10 : 0,
    };
  });

  const elapsedSeconds = Math.min(
    session.durationMinutes * 60,
    Math.round((Date.now() - session.startTime) / 1000)
  );

  return {
    totalQuestions: session.questions.length,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unansweredQuestions: unansweredCount,
    percentage,
    passed,
    timeSpentSeconds: elapsedSeconds,
    domainScores,
  };
};

export const submitExamSession = (session: ExamSession): ExamSession => {
  const result = gradeExam(session);
  const completedSession: ExamSession = {
    ...session,
    isSubmitted: true,
    submittedAt: Date.now(),
    result,
  };

  // Save to completed exams and clear active
  saveCompletedExam(completedSession);
  saveActiveExam(null);

  return completedSession;
};
