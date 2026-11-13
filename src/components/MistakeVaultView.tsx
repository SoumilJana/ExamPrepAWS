import React, { useState, useMemo } from 'react';
import { Search, Play, CheckCircle2, ChevronRight, X, AlertTriangle, Sparkles, Filter } from 'lucide-react';
import { Question, MistakeVault, DomainId } from '../types';
import { AWS_DOMAINS } from '../data/domains';
import { getVaultStats, getDrillQuestions } from '../services/mistakeVault';

interface MistakeVaultViewProps {
  vault: MistakeVault;
  allQuestions: Question[];
  onStartDrill: (drillQuestions: Question[]) => void;
  onNavigateTab: (tab: any) => void;
}

export const MistakeVaultView: React.FC<MistakeVaultViewProps> = ({
  vault,
  allQuestions,
  onStartDrill,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'mastered'>('active');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // Drill options
  const [drillLimit, setDrillLimit] = useState<number>(0); // 0 = all
  const [drillDomain, setDrillDomain] = useState<string>('all');

  const stats = useMemo(() => getVaultStats(vault, allQuestions), [vault, allQuestions]);

  const qMap = useMemo(() => {
    const map = new Map<string, Question>();
    allQuestions.forEach((q) => map.set(q.id, q));
    return map;
  }, [allQuestions]);

  // Filtered mistake list
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return Object.values(vault)
      .map((rec) => ({
        rec,
        question: qMap.get(rec.questionId),
      }))
      .filter((item): item is { rec: typeof item.rec; question: Question } => {
        if (!item.question) return false;

        const isMastered = item.rec.consecutiveCorrect >= 2;
        if (selectedStatus === 'active' && isMastered) return false;
        if (selectedStatus === 'mastered' && !isMastered) return false;

        if (selectedDomain !== 'all' && item.question.domainId !== selectedDomain) return false;

        if (term) {
          const matchId = item.question.id.toLowerCase().includes(term);
          const matchText = item.question.questionText.toLowerCase().includes(term);
          const matchExp = item.question.explanation.toLowerCase().includes(term);
          const matchTag = item.question.tags?.some((t) => t.toLowerCase().includes(term));
          if (!matchId && !matchText && !matchExp && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Active mistakes first, then highest total incorrect
        if (a.rec.consecutiveCorrect !== b.rec.consecutiveCorrect) {
          return a.rec.consecutiveCorrect - b.rec.consecutiveCorrect;
        }
        return b.rec.totalIncorrect - a.rec.totalIncorrect;
      });
  }, [vault, qMap, searchTerm, selectedDomain, selectedStatus]);

  const handleLaunchDrill = () => {
    const drillQs = getDrillQuestions(vault, allQuestions, {
      domainId: drillDomain,
      onlyActive: true,
      limit: drillLimit > 0 ? drillLimit : undefined,
    });

    if (drillQs.length === 0) {
      // If no active, offer to drill all
      const fallback = getDrillQuestions(vault, allQuestions, {
        domainId: drillDomain,
        onlyActive: false,
        limit: drillLimit > 0 ? drillLimit : undefined,
      });
      if (fallback.length > 0) {
        onStartDrill(fallback);
      }
      return;
    }

    onStartDrill(drillQs);
  };

  const activeDrillCandidates = useMemo(() => {
    return getDrillQuestions(vault, allQuestions, {
      domainId: drillDomain,
      onlyActive: true,
      limit: drillLimit > 0 ? drillLimit : undefined,
    });
  }, [vault, allQuestions, drillDomain, drillLimit]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#f4f5f7] tracking-tight flex items-center space-x-2.5">
            <span>Mistake Vault</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#6d8aff]/10 text-[#6d8aff] border border-[#6d8aff]/20 font-semibold">
              Spaced Repetition
            </span>
          </h1>
          <p className="text-sm text-[#9ea5b3] mt-1">
            Every question missed during exams is quarantined here until answered correctly twice in a row.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-2 card-highlight">
          <div className="text-[#9ea5b3] font-medium">Active Mistakes</div>
          <div className="text-3xl font-semibold font-mono text-[#f87171]">
            {stats.activeCount}
          </div>
          <div className="text-xs text-[#9ea5b3]">Needs 2/2 streaks to graduate</div>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-2 card-highlight">
          <div className="text-[#9ea5b3] font-medium">Graduated / Mastered</div>
          <div className="text-3xl font-semibold font-mono text-[#34d399]">
            {stats.masteredCount}
          </div>
          <div className="text-xs text-[#9ea5b3]">Answered correctly 2x in a row</div>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-2 card-highlight">
          <div className="text-[#9ea5b3] font-medium">Vault Graduation Rate</div>
          <div className="text-3xl font-semibold font-mono text-[#6d8aff]">
            {stats.graduationRate}%
          </div>
          <div className="text-xs text-[#9ea5b3]">Target: &gt; 80% before exam day</div>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-2 card-highlight">
          <div className="text-[#9ea5b3] font-medium">Total Tracked</div>
          <div className="text-3xl font-semibold font-mono text-[#f4f5f7]">
            {stats.totalTracked}
          </div>
          <div className="text-xs text-[#9ea5b3]">Distinct questions missed</div>
        </div>
      </div>

      {/* Launch Drill Console */}
      <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-5 card-highlight relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-[#f4f5f7] flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#6d8aff]" />
              <span>Launch Focused Mistake Drill</span>
            </h2>
            <p className="text-sm text-[#9ea5b3]">
              Re-test yourself with instant feedback. Correct answers build towards the 2-in-a-row graduation goal.
            </p>
          </div>

          <button
            onClick={handleLaunchDrill}
            disabled={activeDrillCandidates.length === 0}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-sm rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none btn-press shadow-md shadow-[#6d8aff]/20 shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Drill ({activeDrillCandidates.length} Qs)</span>
          </button>
        </div>

        {/* Drill Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs text-[#9ea5b3] font-medium">Filter by Domain</label>
            <select
              value={drillDomain}
              onChange={(e) => setDrillDomain(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#090a0e] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff]"
            >
              <option value="all">All Domains ({stats.activeCount} active)</option>
              {(Object.keys(AWS_DOMAINS) as DomainId[]).map((dId) => {
                const count = stats.domainCounts[dId]?.active || 0;
                return (
                  <option key={dId} value={dId}>
                    {AWS_DOMAINS[dId].name} ({count} active)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#9ea5b3] font-medium">Session Length</label>
            <select
              value={drillLimit}
              onChange={(e) => setDrillLimit(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-[#090a0e] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff]"
            >
              <option value={0}>All Available Questions</option>
              <option value={10}>Quick Blitz (10 Questions)</option>
              <option value={20}>Standard Set (20 Questions)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 text-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#5e6573] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your mistakes..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-[#111318] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] placeholder-[#5e6573] focus:outline-none focus:border-[#6d8aff] card-highlight"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Tabs */}
          <div className="flex bg-[#111318] border border-white/[0.07] rounded-xl p-1 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedStatus === 'active'
                  ? 'bg-white/[0.08] text-[#f4f5f7] font-semibold'
                  : 'text-[#9ea5b3] hover:text-[#f4f5f7]'
              }`}
            >
              Active ({stats.activeCount})
            </button>
            <button
              onClick={() => setSelectedStatus('mastered')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedStatus === 'mastered'
                  ? 'bg-white/[0.08] text-[#f4f5f7] font-semibold'
                  : 'text-[#9ea5b3] hover:text-[#f4f5f7]'
              }`}
            >
              Mastered ({stats.masteredCount})
            </button>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-white/[0.08] text-[#f4f5f7] font-semibold'
                  : 'text-[#9ea5b3] hover:text-[#f4f5f7]'
              }`}
            >
              All ({stats.totalTracked})
            </button>
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3.5 py-2 bg-[#111318] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] card-highlight"
          >
            <option value="all">All Domains</option>
            {(Object.keys(AWS_DOMAINS) as DomainId[]).map((dId) => (
              <option key={dId} value={dId}>
                {AWS_DOMAINS[dId].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mistake List */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden card-highlight">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#9ea5b3] space-y-2">
            {stats.totalTracked === 0 ? (
              <>
                <p>No mistakes recorded yet!</p>
                <button
                  onClick={() => onNavigateTab('mock-exams')}
                  className="text-[#6d8aff] hover:underline font-medium"
                >
                  Complete your first mock examination
                </button>
              </>
            ) : (
              <p>No questions match your filter.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredList.map(({ rec, question }) => {
              const domain = AWS_DOMAINS[question.domainId];
              const isMastered = rec.consecutiveCorrect >= 2;

              return (
                <div
                  key={question.id}
                  onClick={() => setActiveQuestion(question)}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <div className="space-y-1.5 max-w-[85%]">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#9ea5b3]">
                      <span className="font-mono text-[#6d8aff] font-semibold">{question.id}</span>
                      <span>•</span>
                      <span className="text-[#f4f5f7] font-medium">{domain.name}</span>
                      <span>•</span>
                      <span>Missed {rec.totalIncorrect}x</span>
                      <span>•</span>
                      {/* Streak Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold border ${
                          isMastered
                            ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20'
                            : rec.consecutiveCorrect === 1
                            ? 'bg-[#6d8aff]/10 text-[#6d8aff] border-[#6d8aff]/20'
                            : 'bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20'
                        }`}
                      >
                        {isMastered ? 'Mastered (2/2)' : `Streak: ${rec.consecutiveCorrect}/2`}
                      </span>
                    </div>

                    <div className="text-sm sm:text-base text-[#f4f5f7] font-normal leading-relaxed line-clamp-2">
                      {question.questionText}
                    </div>
                  </div>

                  <span className="text-[#5e6573] group-hover:text-[#f4f5f7] transition-colors pr-2 shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Question Details Drawer */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border border-white/[0.1] rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto card-highlight-elevated">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-mono text-[#6d8aff] font-bold sm:text-base">{activeQuestion.id}</span>
                <span className="text-white/20">•</span>
                <span className="text-[#f4f5f7] font-medium">{AWS_DOMAINS[activeQuestion.domainId].name}</span>
              </div>
              <button
                onClick={() => setActiveQuestion(null)}
                className="text-[#9ea5b3] hover:text-[#f4f5f7] p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-base sm:text-lg font-normal text-[#f4f5f7] leading-[1.65]">
              {activeQuestion.questionText}
            </div>

            <div className="space-y-2 pt-1 text-sm sm:text-base">
              {activeQuestion.options.map((opt) => {
                const isCorrect = activeQuestion.correctOptionIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`p-3.5 sm:p-4 rounded-xl border flex items-start space-x-3.5 ${
                      isCorrect
                        ? 'border-[#34d399]/40 bg-[#34d399]/5 text-[#f4f5f7]'
                        : 'border-white/[0.05] bg-[#090a0e] text-[#9ea5b3]'
                    }`}
                  >
                    <span className="font-mono font-bold shrink-0 mt-0.5">{opt.id}.</span>
                    <span className="flex-1 leading-relaxed">{opt.text}</span>
                    {isCorrect && (
                      <span className="text-xs text-[#34d399] font-semibold px-2 py-0.5 rounded bg-[#34d399]/10 border border-[#34d399]/20 shrink-0">
                        Correct Key
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2 text-sm sm:text-[15px] text-[#9ea5b3]">
              <div className="text-[#f4f5f7] font-semibold text-sm sm:text-base">Architecture Rationale</div>
              <p className="leading-relaxed whitespace-pre-line text-[#c2c8d4]">{activeQuestion.explanation}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveQuestion(null)}
                className="px-5 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] font-semibold text-sm rounded-xl transition-colors btn-press border border-white/[0.06]"
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
