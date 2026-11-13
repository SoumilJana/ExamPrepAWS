import React, { useState, useEffect, useCallback } from 'react';
import { Flag, ArrowLeft, ArrowRight, X, Clock, LayoutGrid, CheckCircle2 } from 'lucide-react';
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
  const [showQuestionDrawer, setShowQuestionDrawer] = useState(false);

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
    setShowQuestionDrawer(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || showExitConfirmModal || showQuestionDrawer) return;

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
  }, [currentQIndex, currentQ, userAnswers, isFlagged, showSubmitModal, showExitConfirmModal, showQuestionDrawer]);

  const answeredCount = Object.keys(session.answers).filter(
    (qId) => session.answers[qId] && session.answers[qId].length > 0
  ).length;
  const unansweredCount = session.questions.length - answeredCount;
  const flaggedCount = session.flaggedQuestionIds.length;

  const domain = AWS_DOMAINS[currentQ.domainId];

  const unansweredNumbers = session.questions
    .map((q, idx) => (!session.answers[q.id] || session.answers[q.id].length === 0 ? idx + 1 : null))
    .filter((num): num is number => num !== null);

  const renderQuestionGrid = () => (
    <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-8 gap-2">
      {session.questions.map((q, idx) => {
        const isCurrent = idx === currentQIndex;
        const hasAnswer = session.answers[q.id] && session.answers[q.id].length > 0;
        const isFlag = session.flaggedQuestionIds.includes(q.id);

        return (
          <button
            key={q.id}
            onClick={() => handleJumpToQuestion(idx)}
            className={`relative w-9 h-9 rounded-lg text-xs sm:text-sm font-mono flex items-center justify-center transition-all duration-100 btn-press touch-manipulation ${
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
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#fbbf24] rounded-full border border-[#111318]" />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090a0e] text-[#f4f5f7] flex flex-col font-sans select-none">
      
      {/* Precision HUD Header */}
      <header className="border-b border-white/[0.06] bg-[#090a0e]/90 backdrop-blur-xl px-3 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3 text-sm">
          <button
            onClick={() => setShowExitConfirmModal(true)}
            className="text-[#9ea5b3] hover:text-[#f4f5f7] transition-colors py-1.5 flex items-center space-x-1.5 touch-manipulation font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Save & Exit</span>
          </button>
          <span className="text-white/10 hidden sm:inline">|</span>
          <span className="text-[#9ea5b3] font-medium hidden sm:inline truncate max-w-[160px]">
            {session.title || `Exam #${session.examNumber}`}
          </span>
        </div>

        {/* Centered Question Index / Drawer Trigger */}
        <button
          onClick={() => setShowQuestionDrawer(true)}
          className="text-sm text-[#f4f5f7] font-medium flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors touch-manipulation"
          title="Click to view all question tiles"
        >
          <span>Q</span>
          <span className="font-mono text-[#6d8aff] font-bold sm:text-base">{currentQIndex + 1}</span>
          <span className="text-[#5e6573]">/</span>
          <span className="font-mono text-[#9ea5b3]">{session.questions.length}</span>
          <span className="text-xs text-[#5e6573] ml-0.5">▾</span>
        </button>

        {/* Timer & Finish */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div
            className={`font-mono text-sm sm:text-base font-semibold tabular-nums px-3 py-1.5 rounded-lg border flex items-center space-x-2 ${
              timer.isUrgent5m
                ? 'text-[#f87171] border-[#f87171]/30 bg-[#f87171]/10 animate-pulse'
                : timer.isWarning15m
                ? 'text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10'
                : 'text-[#9ea5b3] border-white/[0.06] bg-white/[0.03]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timer.formattedTime}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] text-sm font-semibold rounded-lg transition-colors btn-press border border-white/[0.06] touch-manipulation"
          >
            Finish
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 pb-28 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Question & Options (8 cols) */}
        <main className="lg:col-span-8 space-y-6">
          
          <div className="bg-[#111318] border border-white/[0.07] rounded-2xl p-5 sm:p-8 space-y-6 card-highlight">
            
            {/* Meta bar */}
            <div className="flex items-center justify-between text-sm text-[#9ea5b3] pb-2 border-b border-white/[0.04]">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-[#f4f5f7]">{domain.name}</span>
                {currentQ.type === 'multiple' && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-[#6d8aff] font-semibold">Select {currentQ.selectCount || 2}</span>
                  </>
                )}
              </div>

              <button
                onClick={handleToggleFlag}
                className={`flex items-center space-x-1.5 transition-colors py-1.5 px-2.5 rounded-md touch-manipulation ${
                  isFlagged ? 'text-[#fbbf24] bg-[#fbbf24]/10 font-medium' : 'text-[#7e8695] hover:text-[#9ea5b3] hover:bg-white/[0.02]'
                }`}
                title="Shortcut: Press 'F'"
              >
                <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                <span className="text-xs sm:text-sm hidden sm:inline">{isFlagged ? 'Flagged' : 'Flag for review'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg lg:text-[19px] text-[#f4f5f7] leading-[1.65] font-normal max-w-[72ch]">
              {currentQ.questionText}
            </div>

            {/* Options */}
            <div className="space-y-3 pt-1">
              {currentQ.options.map((option) => {
                const isSelected = userAnswers.includes(option.id);

                return (
                  <button
                    key={option.id}
                    onClick={() => handleToggleOption(option.id)}
                    className={`w-full p-4 sm:p-5 rounded-xl text-left transition-all duration-150 flex items-start space-x-3.5 sm:space-x-4 border btn-press touch-manipulation min-h-[52px] ${
                      isSelected
                        ? 'bg-[#181a21] border-[#6d8aff] card-highlight ring-1 ring-[#6d8aff]/30'
                        : 'bg-[#090a0e] border-white/[0.06] hover:bg-[#111318] hover:border-white/[0.12] active:bg-[#14161b]'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs sm:text-sm font-mono font-bold shrink-0 mt-0.5 border transition-colors ${
                        isSelected
                          ? 'bg-[#6d8aff] text-[#090a0e] border-[#6d8aff]'
                          : 'bg-[#14161b] text-[#9ea5b3] border-white/[0.08]'
                      }`}
                    >
                      {option.id}
                    </span>

                    <span className="flex-1 text-sm sm:text-base text-[#f4f5f7] leading-relaxed pt-0.5">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Desktop-only Navigation Controls */}
          <div className="hidden lg:flex items-center justify-between pt-1">
            <button
              onClick={handlePrev}
              disabled={currentQIndex === 0}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors btn-press ${
                currentQIndex === 0
                  ? 'text-[#5e6573] cursor-not-allowed opacity-40'
                  : 'text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] text-sm font-semibold transition-colors btn-press shadow-md shadow-[#6d8aff]/15"
            >
              <span>{currentQIndex === session.questions.length - 1 ? 'Review & Submit' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </main>

        {/* Right Column: 65-Tile Navigator on Desktop (hidden on mobile, opens via bottom dock / drawer) */}
        <aside className="hidden lg:block lg:col-span-4 bg-[#111318] border border-white/[0.07] rounded-2xl p-5 space-y-4 card-highlight sticky top-20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#f4f5f7] font-semibold">Question Overview</span>
            <span className="text-[#9ea5b3] font-mono text-xs">
              {answeredCount} of {session.questions.length} completed
            </span>
          </div>

          {renderQuestionGrid()}

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9ea5b3] font-mono">
            <span>{flaggedCount} flagged</span>
            <span>{unansweredCount} unanswered</span>
          </div>
        </aside>

      </div>

      {/* Mobile Sticky Thumb-Friendly Bottom Control Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090a0e]/95 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-2.5 pb-safe flex items-center justify-between shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
        {/* Left: Previous */}
        <button
          onClick={handlePrev}
          disabled={currentQIndex === 0}
          className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border border-white/[0.06] bg-white/[0.03] transition-colors touch-manipulation min-h-[44px] ${
            currentQIndex === 0 ? 'text-[#444a57] opacity-40' : 'text-[#9ea5b3] active:text-white active:bg-white/[0.08]'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Center: Flag & Navigator Drawer Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFlag}
            className={`p-2.5 rounded-xl border transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isFlagged
                ? 'bg-[#fbbf24]/15 border-[#fbbf24]/30 text-[#fbbf24]'
                : 'bg-white/[0.03] border-white/[0.06] text-[#7e8695] active:text-white'
            }`}
            title="Flag question"
          >
            <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => setShowQuestionDrawer(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] text-xs sm:text-sm font-mono text-[#9ea5b3] active:text-white touch-manipulation min-h-[44px]"
            title="Open question grid"
          >
            <LayoutGrid className="w-4 h-4 text-[#6d8aff]" />
            <span>{currentQIndex + 1}/{session.questions.length}</span>
            {unansweredCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#f87171]" />
            )}
          </button>
        </div>

        {/* Right: Next / Review */}
        <button
          onClick={handleNext}
          className="flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#6d8aff] active:bg-[#839cff] text-[#090a0e] text-sm font-semibold shadow-lg shadow-[#6d8aff]/20 touch-manipulation min-h-[44px]"
        >
          <span>{currentQIndex === session.questions.length - 1 ? 'Finish' : 'Next'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slide-Up Mobile Question Grid Drawer */}
      {showQuestionDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowQuestionDrawer(false)}
          />
          <div className="relative bg-[#111318] border-t border-white/[0.1] rounded-t-3xl p-5 pb-safe max-h-[85dvh] flex flex-col space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom-8 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#f4f5f7]">Question Overview</h3>
                <span className="text-xs font-mono text-[#9ea5b3]">
                  {answeredCount} of {session.questions.length} answered • {flaggedCount} flagged
                </span>
              </div>
              <button
                onClick={() => setShowQuestionDrawer(false)}
                className="p-1.5 rounded-lg text-[#9ea5b3] hover:text-white touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[55dvh] py-2">
              {renderQuestionGrid()}
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <button
                onClick={() => {
                  setShowQuestionDrawer(false);
                  setShowSubmitModal(true);
                }}
                className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] text-sm font-semibold rounded-xl border border-white/[0.08] touch-manipulation"
              >
                Review & Submit Examination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 card-highlight-elevated animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-base sm:text-lg font-semibold text-[#f4f5f7]">Submit Examination?</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-[#9ea5b3] hover:text-[#f4f5f7] p-1.5 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-[#9ea5b3] space-y-3">
              <p>
                Answered: <strong className="text-[#f4f5f7] font-mono">{answeredCount}</strong> of {session.questions.length} questions
              </p>
              {unansweredCount > 0 ? (
                <div className="p-3.5 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl text-[#f87171] space-y-1.5">
                  <span className="font-semibold text-sm">You have {unansweredCount} unanswered questions:</span>
                  <div className="font-mono text-xs text-[#f4f5f7] leading-relaxed">
                    {unansweredNumbers.slice(0, 10).join(', ')}{unansweredNumbers.length > 10 ? '...' : ''}
                  </div>
                </div>
              ) : (
                <p className="text-[#34d399] flex items-center space-x-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All questions completed! Ready to score.</span>
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 text-sm text-[#9ea5b3] hover:text-[#f4f5f7] touch-manipulation min-h-[44px]"
              >
                Keep Testing
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  onSubmitExam(session);
                }}
                className="px-5 py-2.5 bg-[#34d399] hover:bg-[#10b981] text-[#090a0e] font-semibold text-sm rounded-xl transition-colors btn-press shadow-md shadow-[#34d399]/15 touch-manipulation min-h-[44px]"
              >
                Grade & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#14161b] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 card-highlight-elevated animate-in slide-in-from-bottom-4 duration-150">
            <h3 className="text-base sm:text-lg font-semibold text-[#f4f5f7]">Leave Examination?</h3>
            <p className="text-sm text-[#9ea5b3] leading-relaxed">
              Your answers and remaining time are saved automatically. You can resume at any time from the dashboard.
            </p>
            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="px-4 py-2.5 text-sm text-[#9ea5b3] hover:text-[#f4f5f7] touch-manipulation min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  onExitWithoutSubmit();
                }}
                className="px-5 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] text-sm font-semibold rounded-xl border border-white/[0.06] transition-colors btn-press touch-manipulation min-h-[44px]"
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
