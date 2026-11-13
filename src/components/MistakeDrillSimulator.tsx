import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, X, Sparkles, AlertCircle } from 'lucide-react';
import { Question, MistakeRecord } from '../types';
import { recordDrillAnswer, getMistakeVault } from '../services/mistakeVault';
import { AWS_DOMAINS } from '../data/domains';

interface MistakeDrillSimulatorProps {
  questions: Question[];
  onExitDrill: () => void;
  onDrillComplete: () => void;
}

export const MistakeDrillSimulator: React.FC<MistakeDrillSimulatorProps> = ({
  questions,
  onExitDrill,
  onDrillComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [drillRecords, setDrillRecords] = useState<Record<string, { isCorrect: boolean; newStreak: number }>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];
  const vault = getMistakeVault();
  const currentMistakeRecord: MistakeRecord | undefined = vault[currentQ?.id];
  const currentStreak = currentMistakeRecord?.consecutiveCorrect || 0;

  if (!currentQ || isFinished) {
    // Drill Summary Screen
    const totalAnswered = Object.keys(drillRecords).length;
    const correctCount = Object.values(drillRecords).filter((r) => r.isCorrect).length;
    const newlyMastered = Object.values(drillRecords).filter((r) => r.newStreak >= 2).length;

    return (
      <div className="min-h-screen bg-[#090a0e] text-[#f4f5f7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 card-highlight text-center animate-in zoom-in-95 duration-150">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#6d8aff]/10 border border-[#6d8aff]/20 flex items-center justify-center text-[#6d8aff]">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[#f4f5f7]">Drill Complete!</h2>
            <p className="text-sm text-[#9ea5b3]">
              Spaced repetition practice strengthens long-term memory.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 py-3 border-y border-white/[0.06] text-center">
            <div>
              <div className="text-xs sm:text-sm text-[#9ea5b3]">Reviewed</div>
              <div className="text-2xl font-mono font-semibold text-[#f4f5f7] mt-0.5">{totalAnswered}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-[#9ea5b3]">Correct</div>
              <div className="text-2xl font-mono font-semibold text-[#34d399] mt-0.5">{correctCount}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-[#9ea5b3]">Graduated</div>
              <div className="text-2xl font-mono font-semibold text-[#6d8aff] mt-0.5">{newlyMastered}</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                onDrillComplete();
                onExitDrill();
              }}
              className="w-full py-3 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-sm rounded-xl transition-colors btn-press shadow-md shadow-[#6d8aff]/15"
            >
              Back to Mistake Vault
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isMulti = currentQ.type === 'multiple';
  const targetCount = currentQ.selectCount || (isMulti ? 2 : 1);

  const handleSelectOption = (optId: string) => {
    if (hasCheckedAnswer) return; // Locked once checked

    if (isMulti) {
      if (selectedOptionIds.includes(optId)) {
        setSelectedOptionIds(selectedOptionIds.filter((id) => id !== optId));
      } else {
        if (selectedOptionIds.length < targetCount) {
          setSelectedOptionIds([...selectedOptionIds, optId]);
        } else {
          // Replace last selection
          setSelectedOptionIds([...selectedOptionIds.slice(1), optId]);
        }
      }
    } else {
      setSelectedOptionIds([optId]);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedOptionIds.length === 0) return;

    const isCorrect =
      [...selectedOptionIds].sort().join(',') === [...currentQ.correctOptionIds].sort().join(',');

    const updated = recordDrillAnswer(currentQ.id, isCorrect, selectedOptionIds);

    setDrillRecords((prev) => ({
      ...prev,
      [currentQ.id]: { isCorrect, newStreak: updated.consecutiveCorrect },
    }));

    setHasCheckedAnswer(true);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptionIds([]);
      setHasCheckedAnswer(false);
    } else {
      setIsFinished(true);
    }
  };

  const isCurrentCorrect =
    hasCheckedAnswer &&
    [...selectedOptionIds].sort().join(',') === [...currentQ.correctOptionIds].sort().join(',');

  const domain = AWS_DOMAINS[currentQ.domainId];

  return (
    <div className="min-h-screen bg-[#090a0e] text-[#f4f5f7] flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="border-b border-white/[0.06] bg-[#111318]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm sm:text-base font-semibold text-[#f4f5f7]">Mistake Vault Drill</span>
            <span className="text-xs sm:text-sm font-mono text-[#9ea5b3]">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Progress bar */}
            <div className="w-24 sm:w-36 h-2 bg-white/[0.06] rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-[#6d8aff] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <button
              onClick={onExitDrill}
              className="text-[#9ea5b3] hover:text-[#f4f5f7] p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              title="Exit Drill"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Question Card */}
        <div className="bg-[#111318] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6 card-highlight">
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.05] text-sm">
            <div className="flex items-center space-x-2 text-[#9ea5b3]">
              <span className="font-mono text-[#6d8aff] font-semibold">{currentQ.id}</span>
              <span>•</span>
              <span className="text-[#f4f5f7] font-medium">{domain.name}</span>
              <span>•</span>
              <span className="text-[#6d8aff]">{isMulti ? `Select ${targetCount}` : 'Single Choice'}</span>
            </div>

            {/* Streak Indicator */}
            <div className="flex items-center space-x-2 font-mono text-xs sm:text-sm">
              <span className="text-[#9ea5b3]">Mastery Streak:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                  currentStreak === 0
                    ? 'bg-white/[0.04] text-[#9ea5b3] border-white/[0.08]'
                    : currentStreak === 1
                    ? 'bg-[#6d8aff]/10 text-[#6d8aff] border-[#6d8aff]/20'
                    : 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20'
                }`}
              >
                {currentStreak}/2
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg lg:text-[19px] font-normal text-[#f4f5f7] leading-[1.65]">
            {currentQ.questionText}
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              const isCorrectKey = currentQ.correctOptionIds.includes(opt.id);

              let style = 'border-white/[0.06] bg-[#14161b] text-[#f4f5f7] hover:border-white/[0.12]';

              if (hasCheckedAnswer) {
                if (isCorrectKey) {
                  style = 'border-[#34d399]/60 bg-[#34d399]/10 text-[#f4f5f7] ring-1 ring-[#34d399]/30';
                } else if (isSelected && !isCorrectKey) {
                  style = 'border-[#f87171]/60 bg-[#f87171]/10 text-[#f4f5f7] ring-1 ring-[#f87171]/30';
                } else {
                  style = 'border-white/[0.03] bg-[#0c0d11] text-[#5e6573] opacity-60';
                }
              } else if (isSelected) {
                style = 'border-[#6d8aff] bg-[#6d8aff]/10 text-[#f4f5f7] ring-1 ring-[#6d8aff]/30';
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-4 sm:p-5 rounded-xl border flex items-start space-x-3.5 sm:space-x-4 cursor-pointer transition-all btn-press touch-manipulation min-h-[52px] ${style}`}
                >
                  <span
                    className={`font-mono font-bold shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs sm:text-sm mt-0.5 border ${
                      isSelected
                        ? 'bg-[#6d8aff] text-[#090a0e] border-[#6d8aff]'
                        : 'bg-white/[0.05] text-[#9ea5b3] border-white/[0.08]'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="flex-1 text-sm sm:text-base leading-relaxed mt-0.5">{opt.text}</span>
                  {hasCheckedAnswer && isCorrectKey && (
                    <CheckCircle2 className="w-5 h-5 text-[#34d399] shrink-0 mt-0.5" />
                  )}
                  {hasCheckedAnswer && isSelected && !isCorrectKey && (
                    <XCircle className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Button: Check Answer or Next */}
          <div className="pt-4 flex items-center justify-between border-t border-white/[0.05]">
            {!hasCheckedAnswer ? (
              <button
                onClick={handleCheckAnswer}
                disabled={selectedOptionIds.length === 0}
                className="w-full sm:w-auto sm:ml-auto px-7 py-3 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-sm rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none btn-press shadow-md shadow-[#6d8aff]/15 touch-manipulation min-h-[46px]"
              >
                Check Answer
              </button>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  {isCurrentCorrect ? (
                    <div className="flex items-center space-x-2 text-sm text-[#34d399] font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct! Streak updated.</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm text-[#f87171] font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Incorrect. Streak reset to 0.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center justify-center space-x-2 px-7 py-3 bg-[#f4f5f7] hover:bg-white text-[#090a0e] font-semibold text-sm rounded-xl transition-colors btn-press shadow-md shadow-white/10 touch-manipulation min-h-[46px]"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Summary'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Instant Explanation on Check */}
          {hasCheckedAnswer && (
            <div className="pt-5 border-t border-white/[0.06] space-y-2.5 text-sm sm:text-[15px] animate-in fade-in duration-200">
              <div className="font-semibold text-base text-[#f4f5f7]">Architecture Rationale</div>
              <p className="leading-relaxed whitespace-pre-line text-[#c2c8d4]">
                {currentQ.explanation}
              </p>
              {currentQ.awsReference && (
                <div className="text-xs sm:text-sm text-[#9ea5b3] pt-1 font-mono">
                  Reference: <span className="text-[#6d8aff]">{currentQ.awsReference}</span>
                </div>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
