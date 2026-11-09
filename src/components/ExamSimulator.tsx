import React, { useState, useEffect, useCallback } from 'react';
import { Flag, ArrowLeft, ArrowRight, X, Clock } from 'lucide-react';
import { ExamSession, Question } from '../types';
import { useExamTimer } from '../hooks/useExamTimer';
import { AWS_DOMAINS } from '../data/domains';
import { saveActiveExam } from '../services/storage';
import { toast } from 'sonner';

interface ExamSimulatorProps {
  session: ExamSession;
  onUpdateSession: (updated: ExamSession) => void;
  onSubmitExam: (session: ExamSession) => void;
  onExitWithoutSubmit: () => void;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({
  session,
  onUpdateSession,
  onSubmitExam,
  onExitWithoutSubmit,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  const handleTimeExpired = useCallback(() => {
    toast.error('90-minute limit reached. Submitting examination...', { duration: 5000 });
    onSubmitExam(session);
  }, [onSubmitExam, session]);

  const timer = useExamTimer({
    startTime: session.startTime,
    durationMinutes: session.durationMinutes,
    onTimeExpired: handleTimeExpired,
  });

  const currentQIndex = session.currentQuestionIndex;
  const currentQ: Question = session.questions[currentQIndex];
  const userAnswers = session.answers[currentQ.id] || [];
  const isFlagged = session.flaggedQuestionIds.includes(currentQ.id);

  const updateExam = useCallback((partial: Partial<ExamSession>) => {
    const updated = { ...session, ...partial };
    onUpdateSession(updated);
    saveActiveExam(updated);
  }, [session, onUpdateSession]);

  const handleToggleOption = (optionId: string) => {
    let newAnswers: string[];
    if (currentQ.type === 'single') {
      newAnswers = [optionId];
    } else {
      if (userAnswers.includes(optionId)) {
        newAnswers = userAnswers.filter((id) => id !== optionId);
      } else {
        const requiredCount = currentQ.selectCount || 2;
        if (userAnswers.length >= requiredCount) {
          newAnswers = [...userAnswers.slice(1), optionId];
        } else {
          newAnswers = [...userAnswers, optionId];
        }
      }
    }

    const updatedAnswers = {
      ...session.answers,
      [currentQ.id]: newAnswers,
    };
    updateExam({ answers: updatedAnswers });
  };

  const handleToggleFlag = () => {
    let newFlagged: string[];
    if (isFlagged) {
      newFlagged = session.flaggedQuestionIds.filter((id) => id !== currentQ.id);
      toast('Flag removed', { duration: 1200 });
    } else {
      newFlagged = [...session.flaggedQuestionIds, currentQ.id];
      toast('Question flagged for review', { icon: '⚑', duration: 1200 });
    }
    updateExam({ flaggedQuestionIds: newFlagged });
  };

  const handleNext = () => {
    if (currentQIndex < session.questions.length - 1) {
      updateExam({ currentQuestionIndex: currentQIndex + 1 });
    } else {
      setShowSubmitModal(true);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      updateExam({ currentQuestionIndex: currentQIndex - 1 });
    }
  };

  const handleJumpToQuestion = (index: number) => {
    updateExam({ currentQuestionIndex: index });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || showExitConfirmModal) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFlag();
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (currentQ.options[idx]) {
          e.preventDefault();
          handleToggleOption(currentQ.options[idx].id);
        }
      } else if (['a', 'b', 'c', 'd', 'e'].includes(e.key.toLowerCase())) {
        const targetId = e.key.toUpperCase();
        const found = currentQ.options.find((o) => o.id === targetId);
        if (found) {
          e.preventDefault();
          handleToggleOption(targetId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQIndex, currentQ, userAnswers, isFlagged, showSubmitModal, showExitConfirmModal]);

  const answeredCount = Object.keys(session.answers).filter(
    (qId) => session.answers[qId] && session.answers[qId].length > 0
  ).length;
  const unansweredCount = session.questions.length - answeredCount;
  const flaggedCount = session.flaggedQuestionIds.length;

  const domain = AWS_DOMAINS[currentQ.domainId];

  const unansweredNumbers = session.questions
    .map((q, idx) => (!session.answers[q.id] || session.answers[q.id].length === 0 ? idx + 1 : null))
    .filter((num): num is number => num !== null);

  return (
    <div className="min-h-screen bg-[#090a0e] text-[#f4f5f7] flex flex-col font-sans select-none">
      
      {/* Precision HUD Header */}
      <header className="border-b border-white/[0.06] bg-[#090a0e]/90 backdrop-blur-xl px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => setShowExitConfirmModal(true)}
            className="text-[#9ea5b3] hover:text-[#f4f5f7] transition-colors py-1 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save & Exit</span>
          </button>
          <span className="text-white/10">|</span>
          <span className="text-[#9ea5b3] font-medium">
            Exam #{session.examNumber}
          </span>
        </div>

        {/* Centered Question Index */}
        <div className="text-xs text-[#f4f5f7] font-medium flex items-center space-x-1.5">
          <span>Question</span>
          <span className="font-mono text-[#6d8aff] font-semibold">{currentQIndex + 1}</span>
          <span className="text-[#5e6573]">/</span>
          <span className="font-mono text-[#9ea5b3]">65</span>
        </div>

        {/* Timer & Finish */}
        <div className="flex items-center space-x-4">
          <div
            className={`font-mono text-xs font-semibold tabular-nums px-2.5 py-1 rounded-md border flex items-center space-x-1.5 ${
              timer.isUrgent5m
                ? 'text-[#f87171] border-[#f87171]/30 bg-[#f87171]/10 animate-pulse'
                : timer.isWarning15m
                ? 'text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10'
                : 'text-[#9ea5b3] border-white/[0.06] bg-white/[0.03]'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{timer.formattedTime}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] text-xs font-medium rounded-lg transition-colors btn-press border border-white/[0.06]"
          >
            Finish
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Question & Options (8 cols) */}
        <main className="lg:col-span-8 space-y-6">
          
          <div className="bg-[#111318] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6 card-highlight">
            
            {/* Meta bar */}
            <div className="flex items-center justify-between text-xs text-[#9ea5b3]">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-[#f4f5f7]">{domain.name}</span>
                {currentQ.type === 'multiple' && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-[#6d8aff] font-medium">Select {currentQ.selectCount || 2} options</span>
                  </>
                )}
              </div>

              <button
                onClick={handleToggleFlag}
                className={`flex items-center space-x-1.5 transition-colors py-1 px-2 rounded-md ${
                  isFlagged ? 'text-[#fbbf24] bg-[#fbbf24]/10' : 'text-[#5e6573] hover:text-[#9ea5b3] hover:bg-white/[0.02]'
                }`}
                title="Shortcut: Press 'F'"
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                <span className="text-[11px]">{isFlagged ? 'Flagged' : 'Flag for review'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-[17px] text-[#f4f5f7] leading-[1.65] font-normal max-w-[70ch]">
              {currentQ.questionText}
            </div>

            {/* Options */}
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((option) => {
                const isSelected = userAnswers.includes(option.id);

                return (
                  <button
                    key={option.id}
                    onClick={() => handleToggleOption(option.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-150 flex items-start space-x-3.5 border btn-press ${
                      isSelected
                        ? 'bg-[#181a21] border-[#6d8aff] card-highlight'
                        : 'bg-[#090a0e] border-white/[0.06] hover:bg-[#111318] hover:border-white/[0.12]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono font-semibold shrink-0 mt-0.5 border transition-colors ${
                        isSelected
                          ? 'bg-[#6d8aff] text-[#090a0e] border-[#6d8aff]'
                          : 'bg-[#14161b] text-[#9ea5b3] border-white/[0.08]'
                      }`}
                    >
                      {option.id}
                    </span>

                    <span className="flex-1 text-xs sm:text-sm text-[#f4f5f7] leading-relaxed pt-0.5">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handlePrev}
              disabled={currentQIndex === 0}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors btn-press ${
                currentQIndex === 0
                  ? 'text-[#5e6573] cursor-not-allowed opacity-40'
                  : 'text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] text-xs font-semibold transition-colors btn-press shadow-md shadow-[#6d8aff]/15"
            >
              <span>{currentQIndex === 64 ? 'Review & Submit' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </main>

        {/* Right Column: 65-Tile Navigator (4 cols) */}
        <aside className="lg:col-span-4 bg-[#111318] border border-white/[0.07] rounded-2xl p-5 space-y-4 card-highlight">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#f4f5f7] font-medium">Question Overview</span>
            <span className="text-[#9ea5b3] font-mono text-[11px]">
              {answeredCount} of 65 completed
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-8 gap-1.5">
            {session.questions.map((q, idx) => {
              const isCurrent = idx === currentQIndex;
              const hasAnswer = session.answers[q.id] && session.answers[q.id].length > 0;
              const isFlag = session.flaggedQuestionIds.includes(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`relative w-8 h-8 rounded-md text-xs font-mono flex items-center justify-center transition-all duration-100 btn-press ${
                    isCurrent
                      ? 'bg-[#6d8aff] text-[#090a0e] font-bold shadow-md shadow-[#6d8aff]/20'
                      : hasAnswer
                      ? 'bg-white/[0.08] text-[#f4f5f7] border border-white/[0.1] hover:border-[#6d8aff]'
                      : 'bg-[#090a0e] text-[#5e6573] hover:text-[#9ea5b3] border border-transparent'
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  <span>{idx + 1}</span>
                  {isFlag && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#fbbf24] rounded-full border border-[#111318]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#5e6573] font-mono">
            <span>{flaggedCount} flagged</span>
            <span>{unansweredCount} unanswered</span>
          </div>
        </aside>

      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 card-highlight-elevated">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-xs font-semibold text-[#f4f5f7]">Submit Examination?</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-[#9ea5b3] hover:text-[#f4f5f7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#9ea5b3] space-y-2">
              <p>
                Answered: <strong className="text-[#f4f5f7] font-mono">{answeredCount}</strong> of 65 questions
              </p>
              {unansweredCount > 0 ? (
                <div className="p-3 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl text-[#f87171] space-y-1">
                  <span className="font-medium">You have {unansweredCount} unanswered questions:</span>
                  <div className="font-mono text-[11px] text-[#f4f5f7]">
                    {unansweredNumbers.slice(0, 10).join(', ')}{unansweredNumbers.length > 10 ? '...' : ''}
                  </div>
                </div>
              ) : (
                <p className="text-[#34d399]">All 65 questions have been completed.</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-3 py-1.5 text-xs text-[#9ea5b3] hover:text-[#f4f5f7]"
              >
                Keep Testing
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  onSubmitExam(session);
                }}
                className="px-4 py-1.5 bg-[#34d399] hover:bg-[#10b981] text-[#090a0e] font-semibold text-xs rounded-lg transition-colors btn-press shadow-md shadow-[#34d399]/15"
              >
                Grade & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 card-highlight-elevated">
            <h3 className="text-xs font-semibold text-[#f4f5f7]">Leave Examination?</h3>
            <p className="text-xs text-[#9ea5b3] leading-relaxed">
              Your answers and remaining time are saved automatically. You can resume at any time from the dashboard.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="px-3 py-1.5 text-xs text-[#9ea5b3] hover:text-[#f4f5f7]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  onExitWithoutSubmit();
                }}
                className="px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] text-xs font-medium rounded-lg border border-white/[0.06] transition-colors btn-press"
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
