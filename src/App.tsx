import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MockExamsHub } from './components/MockExamsHub';
import { ExamSimulator } from './components/ExamSimulator';
import { ResultsView } from './components/ResultsView';
import { QuestionBankView } from './components/QuestionBankView';
import { PerformanceView } from './components/PerformanceView';
import { SettingsView } from './components/SettingsView';
import { MistakeVaultView } from './components/MistakeVaultView';
import { MistakeDrillSimulator } from './components/MistakeDrillSimulator';

import { AppSettings, ExamSession, MistakeVault, Question } from './types';
import {
  getActiveExam,
  getCompletedExams,
  getQuestionBank,
  getSettings,
} from './services/storage';
import { generateNewExam, submitExamSession } from './services/examEngine';
import {
  getSyncKey,
  pullFromCloud,
  pushExamToCloud,
  pushProfileToCloud,
  subscribeToCloudChanges,
} from './services/cloudSync';
import { getMistakeVault, recordExamMistakes } from './services/mistakeVault';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [completedExams, setCompletedExams] = useState<ExamSession[]>(getCompletedExams);
  const [activeExam, setActiveExam] = useState<ExamSession | null>(getActiveExam);
  const [mistakeVault, setMistakeVault] = useState<MistakeVault>(getMistakeVault);
  
  // Screen routing states
  const [isExamActive, setIsExamActive] = useState<boolean>(false);
  const [activeDrillQuestions, setActiveDrillQuestions] = useState<Question[] | null>(null);
  const [viewingResultsSession, setViewingResultsSession] = useState<ExamSession | null>(null);

  // Active mistakes needing mastery (streak < 2)
  const activeMistakeCount = useMemo(() => {
    return Object.values(mistakeVault).filter((r) => r.consecutiveCorrect < 2).length;
  }, [mistakeVault]);

  // Background Cloud Sync & Realtime on Mount
  useEffect(() => {
    const syncKey = getSyncKey();
    
    // Initial fetch from Supabase
    pullFromCloud(syncKey, (data) => {
      setCompletedExams(data.completedExams);
      setSettings(data.settings);
      if (data.activeExam && !activeExam) {
        setActiveExam(data.activeExam);
      }
      setMistakeVault(getMistakeVault());
    });

    // Realtime channel listener
    const unsubscribe = subscribeToCloudChanges(syncKey, () => {
      pullFromCloud(syncKey, (data) => {
        setCompletedExams(data.completedExams);
        setSettings(data.settings);
        if (data.activeExam) {
          setActiveExam(data.activeExam);
        }
        setMistakeVault(getMistakeVault());
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleReloadData = () => {
    setSettings(getSettings());
    setCompletedExams(getCompletedExams());
    setActiveExam(getActiveExam());
    setMistakeVault(getMistakeVault());
  };

  const handleUpdateSession = (updated: ExamSession) => {
    setActiveExam(updated);
  };

  const handleLaunchNewExam = () => {
    if (activeExam && !activeExam.isSubmitted) {
      if (!confirm('An examination is already in progress. Start a new exam and discard the active session?')) {
        setIsExamActive(true);
        return;
      }
    }

    const newSession = generateNewExam();
    setActiveExam(newSession);
    setViewingResultsSession(null);
    setIsExamActive(true);
    pushProfileToCloud(getSyncKey(), settings, newSession);
    toast.success(`Exam #${newSession.examNumber} started (65 Questions • 90m)`);
  };

  const handleResumeExam = () => {
    if (activeExam && !activeExam.isSubmitted) {
      setViewingResultsSession(null);
      setIsExamActive(true);
    }
  };

  const handleSubmitExam = (session: ExamSession) => {
    const completed = submitExamSession(session);
    setActiveExam(null);
    setIsExamActive(false);
    setCompletedExams(getCompletedExams());
    setViewingResultsSession(completed);
    
    // Automatically record mistakes into the Mistake Vault
    const updatedVault = recordExamMistakes(completed);
    setMistakeVault({ ...updatedVault });

    // Instant sync to Supabase
    pushExamToCloud(getSyncKey(), completed);
    toast.success('Examination submitted, graded, and synced to cloud.');
  };

  const handleExitWithoutSubmit = () => {
    setIsExamActive(false);
    pushProfileToCloud(getSyncKey(), settings, activeExam);
    toast('Progress saved and synced to cloud. You can resume at any time.');
  };

  const handleViewResults = (exam: ExamSession) => {
    setViewingResultsSession(exam);
  };

  const handleRetakeFromResults = () => {
    setViewingResultsSession(null);
    handleLaunchNewExam();
  };

  const handleBackToDashboard = () => {
    setViewingResultsSession(null);
    setCurrentTab('dashboard');
  };

  const questionBank = getQuestionBank();

  // Distraction-free exam simulator mode
  if (isExamActive && activeExam) {
    return (
      <ExamSimulator
        session={activeExam}
        onUpdateSession={handleUpdateSession}
        onSubmitExam={handleSubmitExam}
        onExitWithoutSubmit={handleExitWithoutSubmit}
      />
    );
  }

  // Active Mistake Drill mode (Tutor / Spaced Repetition)
  if (activeDrillQuestions) {
    return (
      <MistakeDrillSimulator
        questions={activeDrillQuestions}
        onExitDrill={() => setActiveDrillQuestions(null)}
        onDrillComplete={() => setMistakeVault(getMistakeVault())}
      />
    );
  }

  // Detailed post-exam review mode
  if (viewingResultsSession) {
    return (
      <ResultsView
        session={viewingResultsSession}
        onRetakeExam={handleRetakeFromResults}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0e] text-[#f4f5f7] flex flex-col font-sans selection:bg-[#6d8aff]/20 selection:text-[#f4f5f7]">
      <Toaster position="bottom-right" theme="dark" richColors />
      
      {/* Top Application Bar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeExam={activeExam}
        activeMistakeCount={activeMistakeCount}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Main Tab Panels */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <Dashboard
            completedExams={completedExams}
            activeExam={activeExam}
            activeMistakesCount={activeMistakeCount}
            settings={settings}
            onLaunchNewExam={handleLaunchNewExam}
            onResumeExam={handleResumeExam}
            onViewResults={handleViewResults}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'mock-exams' && (
          <MockExamsHub
            completedExams={completedExams}
            activeExam={activeExam}
            onLaunchNewExam={handleLaunchNewExam}
            onResumeExam={handleResumeExam}
            onViewResults={handleViewResults}
          />
        )}

        {currentTab === 'mistake-vault' && (
          <MistakeVaultView
            vault={mistakeVault}
            allQuestions={questionBank}
            onStartDrill={(drillQs) => setActiveDrillQuestions(drillQs)}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'question-bank' && (
          <QuestionBankView questions={questionBank} />
        )}

        {currentTab === 'performance' && (
          <PerformanceView
            completedExams={completedExams}
            totalBankQuestions={questionBank.length}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onDataReset={handleReloadData}
          />
        )}
      </main>
    </div>
  );
};
