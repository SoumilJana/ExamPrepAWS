import React, { useState } from 'react';
import { Zap, Play, Shield, Cloud, Server, CreditCard, ChevronRight } from 'lucide-react';
import { DomainId, ExamSession, Question } from '../types';
import { AWS_DOMAINS } from '../data/domains';
import { generateDomainSprint, generateTopicSprint } from '../services/sprintEngine';

interface QuickSprintsViewProps {
  completedExams: ExamSession[];
  allQuestions: Question[];
  onLaunchSprint: (session: ExamSession) => void;
}

const TOPIC_CHIPS = [
  { name: 'AWS IAM & Root User', query: 'IAM', count: 118, icon: 'Shield' },
  { name: 'Amazon S3 & Storage', query: 'S3', count: 160, icon: 'Server' },
  { name: 'Amazon EC2 & Compute', query: 'EC2', count: 348, icon: 'Server' },
  { name: 'Shared Responsibility', query: 'Shared Responsibility', count: 80, icon: 'Shield' },
  { name: 'Amazon VPC & Networking', query: 'VPC', count: 76, icon: 'Cloud' },
  { name: 'Route 53 & CloudFront', query: 'CloudFront', count: 81, icon: 'Cloud' },
  { name: 'Databases (RDS & DynamoDB)', query: 'RDS', count: 89, icon: 'Server' },
  { name: 'CloudWatch & CloudTrail', query: 'CloudTrail', count: 76, icon: 'Shield' },
  { name: 'AWS Trusted Advisor', query: 'Trusted Advisor', count: 94, icon: 'Zap' },
  { name: 'AWS Support Plans', query: 'AWS Support', count: 59, icon: 'CreditCard' },
  { name: 'AWS Organizations', query: 'Organizations', count: 79, icon: 'Shield' },
  { name: 'High Availability & Scaling', query: 'Auto Scaling', count: 45, icon: 'Zap' },
];

export const QuickSprintsView: React.FC<QuickSprintsViewProps> = ({
  completedExams,
  allQuestions,
  onLaunchSprint,
}) => {
  const [selectedCount, setSelectedCount] = useState<number>(15);

  // Compute accuracy by domain from completed exams
  const domainAccuracies: Record<DomainId, { correct: number; total: number; percentage: number }> = {
    'domain-1': { correct: 0, total: 0, percentage: 0 },
    'domain-2': { correct: 0, total: 0, percentage: 0 },
    'domain-3': { correct: 0, total: 0, percentage: 0 },
    'domain-4': { correct: 0, total: 0, percentage: 0 },
  };

  completedExams.forEach((exam) => {
    exam.result?.domainScores.forEach((score) => {
      if (domainAccuracies[score.domainId]) {
        domainAccuracies[score.domainId].correct += score.correct;
        domainAccuracies[score.domainId].total += score.total;
      }
    });
  });

  (Object.keys(domainAccuracies) as DomainId[]).forEach((dId) => {
    const d = domainAccuracies[dId];
    d.percentage = d.total > 0 ? Math.round((d.correct / d.total) * 1000) / 10 : 0;
  });

  const getDomainBankCount = (dId: DomainId): number => {
    return allQuestions.filter((q) => q.domainId === dId).length;
  };

  const handleLaunchDomain = (domainId: DomainId) => {
    const session = generateDomainSprint(domainId, selectedCount);
    onLaunchSprint(session);
  };

  const handleLaunchTopic = (topicQuery: string) => {
    const session = generateTopicSprint(topicQuery, selectedCount);
    onLaunchSprint(session);
  };

  const domainIcons: Record<DomainId, React.ReactNode> = {
    'domain-1': <Cloud className="w-4 h-4 text-[#60a5fa]" />,
    'domain-2': <Shield className="w-4 h-4 text-[#f87171]" />,
    'domain-3': <Server className="w-4 h-4 text-[#a78bfa]" />,
    'domain-4': <CreditCard className="w-4 h-4 text-[#34d399]" />,
  };

  const domainColors: Record<DomainId, string> = {
    'domain-1': 'border-[#60a5fa]/20 hover:border-[#60a5fa]/40',
    'domain-2': 'border-[#f87171]/20 hover:border-[#f87171]/40',
    'domain-3': 'border-[#a78bfa]/20 hover:border-[#a78bfa]/40',
    'domain-4': 'border-[#34d399]/20 hover:border-[#34d399]/40',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#f4f5f7] tracking-tight flex items-center space-x-2.5">
            <span>Quick Sprints</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#6d8aff]/10 text-[#6d8aff] border border-[#6d8aff]/20 font-semibold">
              10–15 Min Blitz
            </span>
          </h1>
          <p className="text-sm text-[#9ea5b3] mt-1">
            Bite-sized, focused practice sessions designed for quick mobile study and targeted domain mastery.
          </p>
        </div>

        {/* Question Count Selector */}
        <div className="flex items-center space-x-2 bg-[#111318] border border-white/[0.07] rounded-xl p-1.5 text-sm card-highlight">
          <span className="text-xs text-[#9ea5b3] px-2 font-mono">Length:</span>
          {[10, 15, 20].map((count) => (
            <button
              key={count}
              onClick={() => setSelectedCount(count)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors font-mono text-xs sm:text-sm ${
                selectedCount === count
                  ? 'bg-[#6d8aff] text-[#090a0e] font-bold shadow-sm'
                  : 'text-[#9ea5b3] hover:text-[#f4f5f7]'
              }`}
            >
              {count} Qs
            </button>
          ))}
        </div>
      </div>

      {/* Official Domain Sprints (4 Curated Blueprint Channels) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#f4f5f7]">Domain Sprints</h2>
          <p className="text-sm text-[#9ea5b3] mt-0.5">Target an entire official CLF-C02 blueprint domain</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(AWS_DOMAINS) as DomainId[]).map((dId) => {
            const domain = AWS_DOMAINS[dId];
            const accuracy = domainAccuracies[dId];
            const totalAvailable = getDomainBankCount(dId);

            return (
              <div
                key={dId}
                className={`bg-[#111318] border rounded-2xl p-5 sm:p-6 space-y-4 card-highlight transition-all ${domainColors[dId]}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      {domainIcons[dId]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#f4f5f7] text-base leading-snug">
                        {domain.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#9ea5b3] font-mono mt-1">
                        Blueprint: {domain.weight}% • {totalAvailable} questions in bank
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm sm:text-base font-semibold text-[#f4f5f7]">
                      {accuracy.total > 0 ? `${accuracy.percentage}%` : 'Unranked'}
                    </div>
                    <div className="text-xs text-[#9ea5b3]">Historical Accuracy</div>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.04]">
                  <span className="text-xs sm:text-sm text-[#9ea5b3] font-mono">
                    ~{selectedCount <= 10 ? '14' : selectedCount <= 15 ? '20' : '28'} mins • Realistic Exam Mode
                  </span>
                  <button
                    onClick={() => handleLaunchDomain(dId)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-[#f4f5f7] font-semibold text-sm rounded-xl transition-colors btn-press border border-white/[0.06]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-[#6d8aff]" />
                    <span>Launch {selectedCount}-Q Sprint</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* High-Yield Topic & Service Sprints */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#f4f5f7]">High-Yield Topic Sprints</h2>
          <p className="text-sm text-[#9ea5b3] mt-0.5">Rapid drills targeting specific AWS services and critical concepts</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {TOPIC_CHIPS.map((topic) => (
            <div
              key={topic.name}
              onClick={() => handleLaunchTopic(topic.query)}
              className="p-4 bg-[#111318] border border-white/[0.06] hover:border-[#6d8aff]/30 rounded-xl flex items-center justify-between cursor-pointer transition-all card-highlight group btn-press"
            >
              <div className="space-y-1">
                <div className="font-medium text-sm sm:text-base text-[#f4f5f7] group-hover:text-white transition-colors">
                  {topic.name}
                </div>
                <div className="text-xs text-[#9ea5b3] font-mono">
                  {topic.count} questions • {selectedCount} Qs sprint
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.03] text-[#5e6573] group-hover:text-[#6d8aff] group-hover:bg-[#6d8aff]/10 transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
