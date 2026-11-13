import React, { useState, useMemo } from 'react';
import { ArrowLeft, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { ExamSession } from '../types';
import { AWS_DOMAINS, PASSING_PERCENTAGE } from '../data/domains';
import { hydrateExamQuestions } from '../services/storage';

interface ResultsViewProps {
  session: ExamSession;
  onRetakeExam: () => void;
  onBackToDashboard: () => void;
}

type FilterTab = 'all' | 'incorrect' | 'correct' | 'unanswered' | 'flagged';

export const ResultsView: React.FC<ResultsViewProps> = ({
  session: rawSession,
  onRetakeExam,
  onBackToDashboard,
}) => {
  const session = useMemo(() => hydrateExamQuestions(rawSession), [rawSession]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const result = session.result;
  if (!result) return null;

  const passed = result.passed;
  const timeMinutes = Math.floor(result.timeSpentSeconds / 60);
  const timeSeconds = result.timeSpentSeconds % 60;

  const toggleExplanation = (qId: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const filteredQuestions = session.questions.filter((q) => {
    const userAns = session.answers[q.id] || [];
    const isUnanswered = userAns.length === 0;
    const isCorrect =
      !isUnanswered &&
      [...userAns].sort().join(',') === [...q.correctOptionIds].sort().join(',');
    const isFlagged = session.flaggedQuestionIds.includes(q.id);

    if (activeFilter === 'incorrect') return !isCorrect && !isUnanswered;
    if (activeFilter === 'correct') return isCorrect;
    if (activeFilter === 'unanswered') return isUnanswered;
    if (activeFilter === 'flagged') return isFlagged;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-2 text-sm text-[#9ea5b3] hover:text-[#f4f5f7] transition-colors py-1.5 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRetakeExam}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] text-sm font-semibold transition-colors btn-press shadow-md shadow-[#6d8aff]/15"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Exam</span>
          </button>
        </div>
      </div>

      {/* Outcome Summary */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6 card-highlight">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-sm text-[#9ea5b3]">
              {session.title || `Exam #${session.examNumber}`} Result
            </div>
            <div className="flex items-baseline space-x-4">
              <span className="text-5xl sm:text-6xl font-mono font-semibold text-[#f4f5f7]">
                {result.percentage}%
              </span>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full border ${
                  passed
                    ? 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20'
                    : 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20'
                }`}
              >
                {passed ? 'Passed (≥ 72%)' : 'Failed (< 72%)'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-[#9ea5b3] font-mono">
            <div>
              <span className="text-[#34d399] font-bold">{result.correctAnswers}</span> / {result.totalQuestions} correct
            </div>
            <div>
              <span className="text-[#f87171] font-bold">{result.incorrectAnswers}</span> incorrect
            </div>
            <div>
              <span className="text-[#f4f5f7]">{timeMinutes}m {timeSeconds}s</span> spent
            </div>
          </div>
        </div>

        {/* Domain accuracy bars */}
        <div className="pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.domainScores.map((ds) => {
            const isDomainPassed = ds.percentage >= PASSING_PERCENTAGE;
            return (
              <div key={ds.domainId} className="space-y-1.5 text-sm">
                <div className="flex justify-between text-[#9ea5b3]">
                  <span className="font-medium text-[#f4f5f7]">{ds.domainName}</span>
                  <span className="font-mono text-[#f4f5f7] font-semibold">{ds.correct}/{ds.total} ({ds.percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-[#090a0e] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isDomainPassed ? 'bg-[#34d399]' : 'bg-[#f87171]'}`}
                    style={{ width: `${ds.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-sm border-b border-white/[0.06] pb-3">
        {(['all', 'incorrect', 'correct', 'unanswered', 'flagged'] as FilterTab[]).map((tab) => {
          const count =
            tab === 'all'
              ? session.questions.length
              : tab === 'incorrect'
              ? result.incorrectAnswers
              : tab === 'correct'
              ? result.correctAnswers
              : tab === 'unanswered'
              ? result.unansweredQuestions
              : session.flaggedQuestionIds.length;

          const isActive = activeFilter === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-2 rounded-xl transition-colors capitalize font-medium btn-press ${
                isActive
                  ? 'bg-white/[0.08] text-[#f4f5f7] border border-white/[0.06]'
                  : 'text-[#9ea5b3] hover:text-[#f4f5f7]'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => {
          const originalIndex = session.questions.findIndex((item) => item.id === q.id);
          const userAns = session.answers[q.id] || [];
          const isUnanswered = userAns.length === 0;
          const isCorrect =
            !isUnanswered &&
            [...userAns].sort().join(',') === [...q.correctOptionIds].sort().join(',');
          const domain = AWS_DOMAINS[q.domainId];
          const isExpanded = expandedExplanations[q.id] ?? true;

          return (
            <div
              key={q.id}
              className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 sm:p-7 space-y-4 card-highlight"
            >
              <div className="flex items-center justify-between text-sm text-[#9ea5b3]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[#6d8aff] font-bold">Q{originalIndex + 1}</span>
                  <span className="text-white/20">•</span>
                  <span className="font-medium text-[#f4f5f7]">{domain.name}</span>
                  {q.tags && q.tags.length > 0 && (
                    <>
                      <span className="text-white/20">•</span>
                      <div className="flex flex-wrap gap-1">
                        {q.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-xs bg-white/[0.04] text-[#9ea5b3] border border-white/[0.06]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`font-semibold ${
                      isCorrect
                        ? 'text-[#34d399]'
                        : isUnanswered
                        ? 'text-[#fbbf24]'
                        : 'text-[#f87171]'
                    }`}
                  >
                    {isCorrect ? 'Correct' : isUnanswered ? 'Unanswered' : 'Incorrect'}
                  </span>

                  <button
                    onClick={() => toggleExplanation(q.id)}
                    className="text-[#5e6573] hover:text-[#9ea5b3] p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-base sm:text-lg leading-[1.65] font-normal text-[#f4f5f7]">
                {q.questionText}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1 text-sm sm:text-base">
                {q.options.map((opt) => {
                  const isUserChoice = userAns.includes(opt.id);
                  const isCorrectChoice = q.correctOptionIds.includes(opt.id);

                  let borderStyle = 'border-white/[0.05] bg-[#090a0e] text-[#9ea5b3]';
                  if (isCorrectChoice) {
                    borderStyle = 'border-[#34d399]/40 bg-[#34d399]/5 text-[#f4f5f7]';
                  } else if (isUserChoice && !isCorrectChoice) {
                    borderStyle = 'border-[#f87171]/40 bg-[#f87171]/5 text-[#f4f5f7]';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3.5 sm:p-4 rounded-xl border flex items-start space-x-3.5 ${borderStyle}`}
                    >
                      <span className="font-mono font-bold shrink-0 mt-0.5">
                        {opt.id}.
                      </span>
                      <span className="flex-1 leading-relaxed">{opt.text}</span>
                      {isCorrectChoice && (
                        <span className="text-[#34d399] text-xs font-semibold px-2 py-0.5 rounded bg-[#34d399]/10 border border-[#34d399]/20 shrink-0">
                          Correct Key
                        </span>
                      )}
                      {isUserChoice && !isCorrectChoice && (
                        <span className="text-[#f87171] text-xs font-semibold px-2 py-0.5 rounded bg-[#f87171]/10 border border-[#f87171]/20 shrink-0">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Technical Explanation */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] text-sm sm:text-[15px] space-y-2 text-[#9ea5b3]">
                  <div className="text-[#f4f5f7] font-semibold text-sm sm:text-base">Architecture Rationale</div>
                  <p className="leading-relaxed text-[#c2c8d4]">
                    {q.explanation}
                  </p>
                  {q.awsReference && (
                    <p className="text-xs sm:text-sm text-[#9ea5b3] pt-1 font-mono">
                      Reference: <span className="text-[#6d8aff]">{q.awsReference}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
