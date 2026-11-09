import React from 'react';
import { ExamSession } from '../types';
import { AWS_DOMAINS, PASSING_PERCENTAGE } from '../data/domains';

interface PerformanceViewProps {
  completedExams: ExamSession[];
  totalBankQuestions: number;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  completedExams,
  totalBankQuestions,
}) => {
  const totalAttempts = completedExams.length;

  const scores = completedExams.map((e) => e.result?.percentage || 0);
  const avgScore = totalAttempts > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / totalAttempts) * 10) / 10
    : 0;
  const highestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
  const lowestScore = totalAttempts > 0 ? Math.min(...scores) : 0;

  let totalSecondsSpent = 0;
  let totalQuestionsAnswered = 0;
  completedExams.forEach((e) => {
    if (e.result) {
      totalSecondsSpent += e.result.timeSpentSeconds;
      totalQuestionsAnswered += 65;
    }
  });

  const avgSecondsPerQ = totalQuestionsAnswered > 0
    ? Math.round(totalSecondsSpent / totalQuestionsAnswered)
    : 0;

  const seenIds = new Set<string>();
  completedExams.forEach((e) => {
    e.questions.forEach((q) => seenIds.add(q.id));
  });
  const coveragePercentage = totalBankQuestions > 0
    ? Math.round((seenIds.size / totalBankQuestions) * 1000) / 10
    : 0;

  const domainStats = (Object.keys(AWS_DOMAINS) as Array<keyof typeof AWS_DOMAINS>).map((dId) => {
    let correct = 0;
    let total = 0;
    completedExams.forEach((e) => {
      const match = e.result?.domainScores.find((d) => d.domainId === dId);
      if (match) {
        correct += match.correct;
        total += match.total;
      }
    });

    const percentage = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
    return {
      ...AWS_DOMAINS[dId],
      correct,
      total,
      percentage,
      isWeak: percentage < PASSING_PERCENTAGE && total > 0,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="pb-4 border-b border-white/[0.06]">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#f4f5f7] tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-xs text-[#9ea5b3] mt-0.5">
          Longitudinal progress tracking and domain mastery
        </p>
      </div>

      {/* Aggregate Strip */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs card-highlight">
        <div className="space-y-1">
          <div className="text-[#9ea5b3]">Average Score</div>
          <div className="text-2xl font-semibold font-mono text-[#f4f5f7]">{avgScore}%</div>
          <div className="text-[11px] text-[#5e6573] font-mono">{totalAttempts} mock tests</div>
        </div>

        <div className="space-y-1">
          <div className="text-[#9ea5b3]">Score Range</div>
          <div className="text-2xl font-semibold font-mono text-[#f4f5f7]">{highestScore}%</div>
          <div className="text-[11px] text-[#5e6573] font-mono">Lowest: {lowestScore}%</div>
        </div>

        <div className="space-y-1">
          <div className="text-[#9ea5b3]">Average Pace</div>
          <div className="text-2xl font-semibold font-mono text-[#f4f5f7]">{avgSecondsPerQ}s</div>
          <div className="text-[11px] text-[#5e6573] font-mono">per question (target &lt; 83s)</div>
        </div>

        <div className="space-y-1">
          <div className="text-[#9ea5b3]">Question Coverage</div>
          <div className="text-2xl font-semibold font-mono text-[#f4f5f7]">{coveragePercentage}%</div>
          <div className="text-[11px] text-[#5e6573] font-mono">{seenIds.size} of {totalBankQuestions} questions</div>
        </div>
      </div>

      {/* Progression Bar Chart */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 space-y-4 card-highlight">
        <div className="flex items-center justify-between text-xs">
          <h2 className="font-semibold text-[#f4f5f7]">Score Trajectory</h2>
          <span className="text-[#5e6573] font-mono text-[11px]">72% pass target</span>
        </div>

        {completedExams.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-[#9ea5b3]">
            Complete mock exams to generate progression trend.
          </div>
        ) : (
          <div className="h-56 w-full flex items-end space-x-3 pt-6 pb-2 px-2 border-b border-white/[0.06] relative">
            <div
              className="absolute left-0 right-0 border-b border-dashed border-[#f87171]/40 pointer-events-none"
              style={{ bottom: `${PASSING_PERCENTAGE}%` }}
            />

            {completedExams
              .slice()
              .reverse()
              .map((exam) => {
                const score = exam.result?.percentage || 0;
                const passed = score >= PASSING_PERCENTAGE;
                return (
                  <div
                    key={exam.id}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div
                      className={`w-full max-w-[36px] rounded-t transition-all ${
                        passed ? 'bg-[#6d8aff] hover:bg-[#839cff]' : 'bg-[#f87171]/80 hover:bg-[#f87171]'
                      }`}
                      style={{ height: `${score}%` }}
                    />
                    <span className="text-[10px] text-[#5e6573] font-mono mt-2">
                      #{exam.examNumber}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Domain Breakdown */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 space-y-4 card-highlight">
        <h2 className="text-xs font-semibold text-[#f4f5f7]">Cumulative Domain Mastery</h2>

        <div className="space-y-4 pt-1">
          {domainStats.map((ds) => (
            <div key={ds.id} className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#f4f5f7] font-medium">{ds.name}</span>
                <span className="font-mono text-[#9ea5b3]">
                  {ds.correct}/{ds.total} ({ds.percentage}%)
                </span>
              </div>

              <div className="h-1.5 w-full bg-[#090a0e] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    ds.percentage >= PASSING_PERCENTAGE ? 'bg-[#34d399]' : 'bg-[#f87171]'
                  }`}
                  style={{ width: `${ds.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
