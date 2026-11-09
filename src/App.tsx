import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MockExamsHub } from './components/MockExamsHub';
import { ExamSimulator } from './components/ExamSimulator';
import { ResultsView } from './components/ResultsView';
import { QuestionBankView } from './components/QuestionBankView';
import { PerformanceView } from './components/PerformanceView';
import { SettingsView } from './components/SettingsView';

import { AppSettings, ExamSession } from './types';
import {
  getActiveExam,
  getCompletedExams,
  getQuestionBank,
  getSettings,
} from './services/storage';
import { generateNewExam, submitExamSession } from './services/examEngine';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [completedExams, setCompletedExams] = useState<ExamSession[]>(getCompletedExams);
  const [activeExam, setActiveExam] = useState<ExamSession | null>(getActiveExam);
  
  // Screen routing states
  const [isExamActive, setIsExamActive] = useState<boolean>(false);
  const [viewingResultsSession, setViewingResultsSession] = useState<ExamSession | null>(null);

  const handleReloadData = () => {
    setSettings(getSettings());
    setCompletedExams(getCompletedExams());
    setActiveExam(getActiveExam());
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
    toast.success('Examination submitted and graded.');
  };

  const handleExitWithoutSubmit = () => {
    setIsExamActive(false);
    toast('Progress saved. You can resume at any time.');
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
      <>
        <Toaster theme="dark" position="top-right" />
        <ExamSimulator
          session={activeExam}
          onUpdateSession={(updated) => setActiveExam(updated)}
          onSubmitExam={handleSubmitExam}
          onExitWithoutSubmit={handleExitWithoutSubmit}
        />
      </>
    );
  }

  // Detailed results review mode
  if (viewingResultsSession) {
    return (
      <div className="min-h-screen bg-[#0c0d10] text-[#f0f2f5] flex flex-col font-sans">
        <Toaster theme="dark" position="top-right" />
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setViewingResultsSession(null);
            setCurrentTab(tab);
          }}
          activeExam={activeExam}
          settings={settings}
          onUpdateSettings={setSettings}
        />
        <main className="flex-1">
          <ResultsView
            session={viewingResultsSession}
            onRetakeExam={handleRetakeFromResults}
            onBackToDashboard={handleBackToDashboard}
          />
        </main>
      </div>
    );
  }

  // Standard tab view
  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f0f2f5] flex flex-col font-sans">
      <Toaster theme="dark" position="top-right" />
      
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeExam={activeExam}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            completedExams={completedExams}
            activeExam={activeExam}
            settings={settings}
            onLaunchNewExam={handleLaunchNewExam}
            onResumeExam={handleResumeExam}
            onViewResults={handleViewResults}
            onNavigateTab={(tab) => setCurrentTab(tab)}
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

      <footer className="border-t border-[#1e222a] py-6 text-center text-xs text-[#5e6676]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CloudPrep • AWS Certified Cloud Practitioner (CLF-C02)</span>
          <span>Aligned with official examination blueprint</span>
        </div>
      </footer>
    </div>
  );
};
