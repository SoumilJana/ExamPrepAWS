import { DomainId, ExamSession, Question } from '../types';
import { AWS_DOMAINS } from '../data/domains';
import { getQuestionBank, saveActiveExam, getCompletedExams } from './storage';

// Helper to shuffle an array
const shuffle = <T>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getSprintDuration = (count: number): number => {
  if (count <= 10) return 14;
  if (count <= 15) return 21;
  return 28;
};

export const generateDomainSprint = (domainId: DomainId, count: number = 15): ExamSession => {
  const allQuestions = getQuestionBank();
  const domainQuestions = allQuestions.filter((q) => q.domainId === domainId);
  const shuffled = shuffle(domainQuestions);
  const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));

  const domainName = AWS_DOMAINS[domainId]?.name || 'Domain';
  const pastExams = getCompletedExams();
  const sprintNumber = pastExams.length + 1;

  const session: ExamSession = {
    id: `sprint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    examNumber: sprintNumber,
    seed: Date.now(),
    title: `${domainName} Sprint`,
    isSprint: true,
    sprintCategory: domainName,
    questions: selectedQuestions,
    answers: {},
    flaggedQuestionIds: [],
    currentQuestionIndex: 0,
    startTime: Date.now(),
    durationMinutes: getSprintDuration(selectedQuestions.length),
    isSubmitted: false,
  };

  saveActiveExam(session);
  return session;
};

export const generateTopicSprint = (topicTag: string, count: number = 15): ExamSession => {
  const allQuestions = getQuestionBank();
  const matching = allQuestions.filter((q) =>
    q.tags?.some((t) => t.toLowerCase().includes(topicTag.toLowerCase()))
  );

  const fallback = matching.length >= count ? matching : allQuestions.filter((q) =>
    q.questionText.toLowerCase().includes(topicTag.toLowerCase()) ||
    q.explanation.toLowerCase().includes(topicTag.toLowerCase())
  );

  const shuffled = shuffle(fallback.length > 0 ? fallback : allQuestions);
  const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));

  const pastExams = getCompletedExams();
  const sprintNumber = pastExams.length + 1;

  const session: ExamSession = {
    id: `sprint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    examNumber: sprintNumber,
    seed: Date.now(),
    title: `${topicTag} Sprint`,
    isSprint: true,
    sprintCategory: topicTag,
    questions: selectedQuestions,
    answers: {},
    flaggedQuestionIds: [],
    currentQuestionIndex: 0,
    startTime: Date.now(),
    durationMinutes: getSprintDuration(selectedQuestions.length),
    isSubmitted: false,
  };

  saveActiveExam(session);
  return session;
};
