import React from 'react';
import { Play, ChevronRight, Clock, Award } from 'lucide-react';
import { ExamSession } from '../types';
import { AWS_DOMAINS, EXAM_DURATION_MINUTES, EXAM_QUESTION_COUNT, PASSING_PERCENTAGE } from '../data/domains';

interface MockExamsHubProps {
  completedExams: ExamSession[];
  activeExam: ExamSession | null;
  onLaunchNewExam: () => void;
  onResumeExam: () => void;
  onViewResults: (exam: ExamSession) => void;
}

export const MockExamsHub: React.FC<MockExamsHubProps> = ({
  completedExams,
  activeExam,
  onLaunchNewExam,
  onResumeExam,
  onViewResults,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#f4f5f7] tracking-tight">
            Mock Examinations
          </h1>
          <p className="text-sm text-[#9ea5b3] mt-1">
            Full-length 65-question practice tests matching official AWS CLF-C02 blueprint weights
          </p>
        </div>

        <button
          onClick={onLaunchNewExam}
          className="px-5 py-2.5 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-sm rounded-xl transition-colors flex items-center space-x-2 self-start sm:self-auto btn-press shadow-md shadow-[#6d8aff]/15"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>New Mock Exam</span>
        </button>
      </div>

      {/* Active in-progress banner */}
      {activeExam && !activeExam.isSubmitted && (
        <div className="p-4 sm:p-5 bg-[#111318] border border-[#fbbf24]/30 rounded-2xl flex items-center justify-between text-sm card-highlight">
          <div className="space-y-1">
            <div className="font-semibold text-sm sm:text-base text-[#f4f5f7] flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-pulse" />
              <span>Exam #{activeExam.examNumber} is currently in progress</span>
            </div>
            <p className="text-xs sm:text-sm text-[#9ea5b3]">
              {Object.keys(activeExam.answers).length} of 65 questions answered
            </p>
          </div>

          <button
            onClick={onResumeExam}
            className="px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-[#090a0e] font-semibold rounded-xl text-sm transition-colors flex items-center space-x-1.5 btn-press shadow-sm shadow-[#fbbf24]/10"
          >
            <span>Resume</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Blueprint Reference Matrix */}
      <div className="p-5 sm:p-6 bg-[#111318] border border-white/[0.06] rounded-2xl space-y-4 card-highlight">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-[#f4f5f7]">Official CLF-C02 Blueprint Distribution</h2>
          <span className="text-[#9ea5b3] font-mono text-xs sm:text-sm">
            {EXAM_QUESTION_COUNT} questions • {EXAM_DURATION_MINUTES}m • {PASSING_PERCENTAGE}% benchmark
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          {(Object.keys(AWS_DOMAINS) as Array<keyof typeof AWS_DOMAINS>).map((key) => {
            const domain = AWS_DOMAINS[key];
            return (
              <div key={domain.id} className="p-3.5 bg-[#090a0e] rounded-xl border border-white/[0.04] space-y-1.5">
                <div className="text-[#f4f5f7] font-medium">{domain.name}</div>
                <div className="text-[#9ea5b3] text-xs flex justify-between font-mono">
                  <span>{domain.questionCount} questions</span>
                  <span className="text-[#6d8aff] font-semibold">{domain.weight}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam Archive Table */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-[#f4f5f7]">Exam History</h2>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden card-highlight">
          {completedExams.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#9ea5b3]">
              No past examinations recorded.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {completedExams.map((exam) => {
                const result = exam.result;
                const passed = result?.passed;
                const dateStr = exam.submittedAt
                  ? new Date(exam.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Completed';

                const minutesTaken = result ? Math.floor(result.timeSpentSeconds / 60) : 0;

                return (
                  <div
                    key={exam.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-sm sm:text-base text-[#f4f5f7]">
                          {exam.title || `Exam #${exam.examNumber}`}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            passed
                              ? 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20'
                              : 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20'
                          }`}
                        >
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <p className="text-xs text-[#9ea5b3] font-mono">
                        {dateStr} • {minutesTaken}m elapsed
                      </p>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-right">
                        <div className="font-mono font-semibold text-base sm:text-lg text-[#f4f5f7]">
                          {result?.percentage}%
                        </div>
                        <div className="text-xs text-[#9ea5b3] font-mono">
                          {result?.correctAnswers} / {result?.totalQuestions || exam.questions?.length || 65} correct
                        </div>
                      </div>

                      <button
                        onClick={() => onViewResults(exam)}
                        className="px-3.5 py-1.5 text-sm text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.05] rounded-lg transition-colors btn-press border border-white/[0.05] font-medium"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
