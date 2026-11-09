import React, { useState } from 'react';
import { Play, ArrowRight, Info, AlertCircle, Sparkles } from 'lucide-react';
import { AppSettings, ExamSession } from '../types';
import { calculateReadiness } from '../services/storage';
import { AWS_DOMAINS, PASSING_PERCENTAGE } from '../data/domains';

interface DashboardProps {
  completedExams: ExamSession[];
  activeExam: ExamSession | null;
  settings: AppSettings;
  onLaunchNewExam: () => void;
  onResumeExam: () => void;
  onViewResults: (exam: ExamSession) => void;
  onNavigateTab: (tab: 'mock-exams' | 'question-bank' | 'performance') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  completedExams,
  activeExam,
  settings,
  onLaunchNewExam,
  onResumeExam,
  onViewResults,
  onNavigateTab,
}) => {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const readiness = calculateReadiness(completedExams);

  const domainAverages = (Object.keys(AWS_DOMAINS) as Array<keyof typeof AWS_DOMAINS>).map((domainId) => {
    let totalQs = 0;
    let correctQs = 0;
    completedExams.forEach((exam) => {
      const match = exam.result?.domainScores.find((d) => d.domainId === domainId);
      if (match) {
        totalQs += match.total;
        correctQs += match.correct;
      }
    });
    const percentage = totalQs > 0 ? Math.round((correctQs / totalQs) * 1000) / 10 : 0;
    return {
      ...AWS_DOMAINS[domainId],
      totalQs,
      correctQs,
      percentage,
      isWeak: percentage < PASSING_PERCENTAGE && totalQs > 0,
    };
  });

  const averageScore = completedExams.length > 0
    ? Math.round(
        (completedExams.reduce((acc, curr) => acc + (curr.result?.percentage || 0), 0) /
          completedExams.length) *
          10
      ) / 10
    : 0;

  const targetTime = new Date(settings.targetExamDate).getTime();
  const nowTime = new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-200">
      
      {/* Primary Readiness & Command Console */}
      <section className="bg-[#111318] border border-white/[0.07] rounded-2xl p-6 sm:p-8 card-highlight relative overflow-hidden">
        {/* Subtle decorative background gradient mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6d8aff]/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          
          {/* Left: Score & Factors */}
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-[#9ea5b3]">Exam Readiness Indicator</span>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="text-[#5e6573] hover:text-[#9ea5b3] transition-colors p-0.5"
                title="View transparent formula"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline space-x-4">
              <span className="text-5xl sm:text-6xl font-semibold font-mono tracking-tight text-[#f4f5f7]">
                {readiness.score}%
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                  readiness.score >= PASSING_PERCENTAGE
                    ? 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20'
                    : readiness.score >= 60
                    ? 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20'
                    : 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20'
                }`}
              >
                {readiness.status}
              </span>
            </div>

            {/* Precision Micro-Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#090a0e]/70 border border-white/[0.04] space-y-1.5">
                <div className="flex justify-between text-[#9ea5b3]">
                  <span>Recent 3 Avg</span>
                  <span className="font-mono text-[#f4f5f7] font-medium">{readiness.recentExamsAverage}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6d8aff] rounded-full transition-all"
                    style={{ width: `${readiness.recentExamsAverage}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090a0e]/70 border border-white/[0.04] space-y-1.5">
                <div className="flex justify-between text-[#9ea5b3]">
                  <span>Lowest Domain</span>
                  <span className="font-mono text-[#f4f5f7] font-medium">{readiness.lowestDomainScore}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      readiness.lowestDomainScore >= PASSING_PERCENTAGE ? 'bg-[#34d399]' : 'bg-[#f87171]'
                    }`}
                    style={{ width: `${readiness.lowestDomainScore}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090a0e]/70 border border-white/[0.04] space-y-1.5">
                <div className="flex justify-between text-[#9ea5b3]">
                  <span>Bank Coverage</span>
                  <span className="font-mono text-[#f4f5f7] font-medium">{readiness.questionBankCoverage}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6d8aff] rounded-full transition-all"
                    style={{ width: `${readiness.questionBankCoverage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Primary Call to Action & Summary */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4 border-t md:border-t-0 md:border-l border-white/[0.06] pt-5 md:pt-0 md:pl-8 shrink-0">
            {activeExam && !activeExam.isSubmitted ? (
              <button
                onClick={onResumeExam}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#090a0e] text-xs font-semibold flex items-center justify-center space-x-2 transition-all duration-150 btn-press shadow-lg shadow-[#fbbf24]/10"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Exam #{activeExam.examNumber} (Q{activeExam.currentQuestionIndex + 1})</span>
              </button>
            ) : (
              <button
                onClick={onLaunchNewExam}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] text-xs font-semibold flex items-center justify-center space-x-2 transition-all duration-150 btn-press glow-accent"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Mock Exam (65 Qs • 90m)</span>
              </button>
            )}

            <div className="flex items-center space-x-3 text-xs text-[#9ea5b3]">
              <span className="font-mono font-medium text-[#f4f5f7]">{completedExams.length}</span>
              <span>completed</span>
              <span className="text-white/20">•</span>
              <span>Avg: <strong className="font-mono text-[#f4f5f7] font-medium">{averageScore}%</strong></span>
              <span className="text-white/20">•</span>
              <span>{diffDays > 0 ? `${diffDays} days left` : 'Today'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* Domain Mastery Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[#f4f5f7]">Domain Accuracy</h2>
            <p className="text-xs text-[#9ea5b3]">Cumulative performance across the four official AWS CLF-C02 domains</p>
          </div>
          <button
            onClick={() => onNavigateTab('performance')}
            className="text-xs text-[#6d8aff] hover:text-[#839cff] flex items-center space-x-1 transition-colors"
          >
            <span>Detailed Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domainAverages.map((domain) => (
            <div
              key={domain.id}
              className="p-4 bg-[#111318] border border-white/[0.06] rounded-xl card-highlight space-y-3 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9ea5b3] font-medium">{domain.name}</span>
                <span className="text-[10px] text-[#5e6573] font-mono px-1.5 py-0.5 rounded bg-white/[0.03]">
                  {domain.weight}%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold font-mono text-[#f4f5f7]">
                  {domain.percentage}%
                </span>
                {domain.isWeak && (
                  <span className="text-[11px] text-[#f87171] flex items-center space-x-1 font-mono">
                    <AlertCircle className="w-3 h-3" />
                    <span>&lt; 72%</span>
                  </span>
                )}
              </div>

              <div className="h-1.5 w-full bg-[#090a0e] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    domain.isWeak ? 'bg-[#f87171]' : 'bg-[#6d8aff]'
                  }`}
                  style={{ width: `${domain.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Examinations Archive */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[#f4f5f7]">Recent Examinations</h2>
            <p className="text-xs text-[#9ea5b3]">Review past test sessions and mistake diagnoses</p>
          </div>
          <button
            onClick={() => onNavigateTab('mock-exams')}
            className="text-xs text-[#6d8aff] hover:text-[#839cff] flex items-center space-x-1 transition-colors"
          >
            <span>All mock tests ({completedExams.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-xl overflow-hidden card-highlight">
          {completedExams.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#9ea5b3] space-y-2">
              <p>No completed examinations yet.</p>
              <button
                onClick={onLaunchNewExam}
                className="text-[#6d8aff] hover:underline"
              >
                Launch your first exam
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {completedExams.slice(0, 4).map((exam) => {
                const passed = exam.result?.passed;
                const dateStr = exam.submittedAt
                  ? new Date(exam.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Completed';

                return (
                  <div
                    key={exam.id}
                    className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-medium text-xs text-[#f4f5f7]">
                          Exam #{exam.examNumber}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            passed
                              ? 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20'
                              : 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20'
                          }`}
                        >
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5e6573] font-mono">{dateStr}</p>
                    </div>

                    <div className="flex items-center space-x-6 text-xs">
                      <div className="text-right">
                        <div className="font-mono font-semibold text-[#f4f5f7]">
                          {exam.result?.percentage}%
                        </div>
                        <div className="text-[11px] text-[#5e6573] font-mono">
                          {exam.result?.correctAnswers} / 65 correct
                        </div>
                      </div>

                      <button
                        onClick={() => onViewResults(exam)}
                        className="px-3 py-1.5 text-xs text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.05] rounded-md transition-colors btn-press border border-white/[0.05]"
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
      </section>

      {/* Transparent Formula Dialog */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 card-highlight-elevated">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#6d8aff]" />
                <h3 className="text-xs font-semibold text-[#f4f5f7]">
                  Readiness Score Breakdown
                </h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-[#9ea5b3] hover:text-[#f4f5f7] text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9ea5b3] leading-relaxed">
              Your readiness score is evaluated objectively using three key criteria:
            </p>

            <div className="p-3 bg-[#090a0e] rounded-lg border border-white/[0.05] font-mono text-[11px] text-[#6d8aff] space-y-1">
              <div>0.50 × Recent Exam Average ({readiness.recentExamsAverage}%)</div>
              <div>+ 0.30 × Lowest Domain Score ({readiness.lowestDomainScore}%)</div>
              <div>+ 0.20 × Question Bank Coverage ({readiness.questionBankCoverage}%)</div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-3.5 py-1.5 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-xs rounded-lg transition-colors btn-press"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
