import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, X, ChevronLeft, Tag } from 'lucide-react';
import { Question, DomainId } from '../types';
import { AWS_DOMAINS } from '../data/domains';

interface QuestionBankViewProps {
  questions: Question[];
}

const PAGE_SIZE = 25;

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ questions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // Extract all unique tags sorted alphabetically
  const availableTags = useMemo(() => {
    const tagMap: Record<string, number> = {};
    questions.forEach((q) => {
      q.tags?.forEach((t) => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });
    return Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1]) // Most frequent first
      .map(([name, count]) => ({ name, count }));
  }, [questions]);

  // Filtered list
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return questions.filter((q) => {
      const matchesSearch =
        term === '' ||
        q.id.toLowerCase().includes(term) ||
        q.questionText.toLowerCase().includes(term) ||
        q.explanation.toLowerCase().includes(term) ||
        q.options.some((o) => o.text.toLowerCase().includes(term)) ||
        q.tags?.some((t) => t.toLowerCase().includes(term));

      const matchesDomain = selectedDomain === 'all' || q.domainId === selectedDomain;
      const matchesType = selectedType === 'all' || q.type === selectedType;
      const matchesTag = selectedTag === 'all' || q.tags?.includes(selectedTag);

      return matchesSearch && matchesDomain && matchesType && matchesTag;
    });
  }, [questions, searchTerm, selectedDomain, selectedType, selectedTag]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  // Paginated items
  const paginatedQuestions = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, safePage]);

  const handleDomainChange = (val: string) => {
    setSelectedDomain(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (val: string) => {
    setSelectedType(val);
    setCurrentPage(1);
  };

  const handleTagChange = (val: string) => {
    setSelectedTag(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#f4f5f7] tracking-tight">
            Question Bank
          </h1>
          <p className="text-sm text-[#9ea5b3] mt-1">
            Verified master repository of {questions.length} questions mapped to CLF-C02 domains and AWS services
          </p>
        </div>
        <div className="text-sm text-[#9ea5b3] font-mono">
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} matching
        </div>
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-sm">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-[#5e6573] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search questions, services (e.g. S3, IAM, CloudFront)..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-[#111318] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] placeholder-[#5e6573] focus:outline-none focus:border-[#6d8aff] transition-colors card-highlight"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#111318] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] transition-colors card-highlight"
          >
            <option value="all">All Domains (4)</option>
            {(Object.keys(AWS_DOMAINS) as DomainId[]).map((dId) => (
              <option key={dId} value={dId}>
                {AWS_DOMAINS[dId].name} ({AWS_DOMAINS[dId].weight}%)
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedTag}
            onChange={(e) => handleTagChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#111318] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] transition-colors card-highlight"
          >
            <option value="all">All Topics ({availableTags.length})</option>
            {availableTags.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.count})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#111318] border border-white/[0.07] rounded-xl text-sm text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] transition-colors card-highlight"
          >
            <option value="all">All Types</option>
            <option value="single">Single Choice</option>
            <option value="multiple">Multi-Response</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden card-highlight">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#9ea5b3] space-y-2">
            <p>No questions match your search filters.</p>
            {(searchTerm || selectedDomain !== 'all' || selectedTag !== 'all' || selectedType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDomain('all');
                  setSelectedTag('all');
                  setSelectedType('all');
                  setCurrentPage(1);
                }}
                className="text-[#6d8aff] hover:underline font-medium"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {paginatedQuestions.map((q) => {
              const domain = AWS_DOMAINS[q.domainId];
              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestion(q)}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <div className="space-y-1.5 max-w-[85%]">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#9ea5b3]">
                      <span className="font-mono text-[#6d8aff] font-semibold">{q.id}</span>
                      <span>•</span>
                      <span className="text-[#f4f5f7] font-medium">{domain.name}</span>
                      <span>•</span>
                      <span className="text-[#9ea5b3]">{q.type === 'single' ? 'Single Choice' : `Select ${q.selectCount || 2}`}</span>
                      {q.tags && q.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex flex-wrap gap-1">
                            {q.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded text-xs bg-white/[0.04] text-[#9ea5b3] border border-white/[0.06]"
                              >
                                {tag}
                              </span>
                            ))}
                            {q.tags.length > 2 && (
                              <span className="text-xs text-[#5e6573]">
                                +{q.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-sm sm:text-base text-[#f4f5f7] font-normal leading-relaxed line-clamp-2">
                      {q.questionText}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm">
          <div className="text-[#9ea5b3] font-mono">
            Page {safePage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-[#111318] text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04] disabled:opacity-30 disabled:pointer-events-none transition-colors btn-press font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-[#111318] text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04] disabled:opacity-30 disabled:pointer-events-none transition-colors btn-press font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Question Details Drawer / Modal */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border-t sm:border border-white/[0.1] rounded-t-3xl sm:rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[88dvh] overflow-y-auto card-highlight-elevated pb-safe animate-in slide-in-from-bottom-4 duration-150">
            
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

            {/* Tags in Drawer */}
            {activeQuestion.tags && activeQuestion.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <Tag className="w-3.5 h-3.5 text-[#5e6573]" />
                {activeQuestion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#6d8aff]/10 text-[#6d8aff] border border-[#6d8aff]/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="text-base sm:text-lg font-normal text-[#f4f5f7] leading-[1.65]">
              {activeQuestion.questionText}
            </div>

            <div className="space-y-2.5 pt-1 text-sm sm:text-base">
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
              {activeQuestion.awsReference && (
                <p className="text-xs sm:text-sm text-[#9ea5b3] pt-1 font-mono">
                  Reference: <span className="text-[#6d8aff]">{activeQuestion.awsReference}</span>
                </p>
              )}
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
