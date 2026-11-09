import React, { useState } from 'react';
import { Search, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Question, DomainId } from '../types';
import { AWS_DOMAINS } from '../data/domains';

interface QuestionBankViewProps {
  questions: Question[];
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ questions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  const filtered = questions.filter((q) => {
    const matchesSearch =
      searchTerm === '' ||
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.options.some((o) => o.text.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomain = selectedDomain === 'all' || q.domainId === selectedDomain;
    const matchesType = selectedType === 'all' || q.type === selectedType;

    return matchesSearch && matchesDomain && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#f4f5f7] tracking-tight">
            Question Bank
          </h1>
          <p className="text-xs text-[#9ea5b3] mt-0.5">
            Verified repository of {questions.length} questions mapped to CLF-C02 domains
          </p>
        </div>
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-6 relative">
          <Search className="w-3.5 h-3.5 text-[#5e6573] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions or keywords (e.g. S3, IAM, CloudFront)..."
            className="w-full pl-9 pr-3 py-2 bg-[#111318] border border-white/[0.07] rounded-xl text-xs text-[#f4f5f7] placeholder-[#5e6573] focus:outline-none focus:border-[#6d8aff] transition-colors card-highlight"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full px-3 py-2 bg-[#111318] border border-white/[0.07] rounded-xl text-xs text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] transition-colors card-highlight"
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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-[#111318] border border-white/[0.07] rounded-xl text-xs text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] transition-colors card-highlight"
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
          <div className="p-12 text-center text-xs text-[#9ea5b3]">
            No questions match your search.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] text-xs">
            {filtered.map((q) => {
              const domain = AWS_DOMAINS[q.domainId];
              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestion(q)}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center space-x-2 text-[11px] text-[#5e6573]">
                      <span className="font-mono text-[#6d8aff]">{q.id}</span>
                      <span>•</span>
                      <span>{domain.name}</span>
                      <span>•</span>
                      <span>{q.type === 'single' ? 'Single Choice' : `Select ${q.selectCount || 2}`}</span>
                    </div>
                    <div className="text-xs text-[#f4f5f7] font-normal truncate">
                      {q.questionText}
                    </div>
                  </div>

                  <span className="text-[#5e6573] group-hover:text-[#f4f5f7] transition-colors pr-2">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border border-white/[0.1] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto text-xs card-highlight-elevated">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono text-[#6d8aff] font-semibold">{activeQuestion.id}</span>
                <span className="text-white/20">•</span>
                <span className="text-[#9ea5b3]">{AWS_DOMAINS[activeQuestion.domainId].name}</span>
              </div>
              <button
                onClick={() => setActiveQuestion(null)}
                className="text-[#9ea5b3] hover:text-[#f4f5f7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm font-normal text-[#f4f5f7] leading-relaxed">
              {activeQuestion.questionText}
            </div>

            <div className="space-y-1.5 pt-1">
              {activeQuestion.options.map((opt) => {
                const isCorrect = activeQuestion.correctOptionIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-start space-x-3 ${
                      isCorrect
                        ? 'border-[#34d399]/40 bg-[#34d399]/5 text-[#f4f5f7]'
                        : 'border-white/[0.05] bg-[#090a0e] text-[#9ea5b3]'
                    }`}
                  >
                    <span className="font-mono font-medium shrink-0 mt-0.5">{opt.id}.</span>
                    <span className="flex-1">{opt.text}</span>
                    {isCorrect && (
                      <span className="text-[11px] text-[#34d399] font-medium shrink-0">Correct Key</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/[0.06] space-y-1.5 text-[#9ea5b3]">
              <div className="text-[#f4f5f7] font-medium text-[11px]">Architecture Rationale</div>
              <p className="leading-relaxed">{activeQuestion.explanation}</p>
              {activeQuestion.awsReference && (
                <p className="text-[11px] text-[#5e6573] pt-0.5">
                  Reference: <span className="text-[#6d8aff]">{activeQuestion.awsReference}</span>
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveQuestion(null)}
                className="px-4 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] rounded-lg transition-colors btn-press border border-white/[0.06]"
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
