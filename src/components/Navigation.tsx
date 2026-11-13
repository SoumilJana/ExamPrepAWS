import React, { useState } from 'react';
import {
  Calendar,
  ChevronRight,
  Cloud,
  LayoutDashboard,
  FileText,
  Zap,
  AlertCircle,
  MoreHorizontal,
  Database,
  TrendingUp,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { AppSettings, ExamSession } from '../types';
import { saveSettings } from '../services/storage';
import { toast } from 'sonner';

export type NavTab = 'dashboard' | 'mock-exams' | 'quick-sprints' | 'mistake-vault' | 'question-bank' | 'performance' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeExam: ExamSession | null;
  activeMistakeCount?: number;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeExam,
  activeMistakeCount = 0,
  settings,
  onUpdateSettings,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [tempDate, setTempDate] = useState(settings.targetExamDate);

  const targetTime = new Date(settings.targetExamDate).getTime();
  const nowTime = new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));

  const handleSaveDate = () => {
    const updated = { ...settings, targetExamDate: tempDate };
    onUpdateSettings(updated);
    saveSettings(updated);
    setShowDatePicker(false);
    toast.success('Certification exam date saved');
  };

  const navItems: { id: NavTab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mock-exams', label: 'Mock Exams' },
    { id: 'quick-sprints', label: 'Quick Sprints' },
    { id: 'mistake-vault', label: 'Mistake Vault', badge: activeMistakeCount },
    { id: 'question-bank', label: 'Question Bank' },
    { id: 'performance', label: 'Performance' },
    { id: 'settings', label: 'Settings' },
  ];

  // Primary mobile & tablet bottom navigation items
  const mobilePrimaryTabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'mock-exams', label: 'Exams', icon: FileText },
    { id: 'quick-sprints', label: 'Sprints', icon: Zap },
    { id: 'mistake-vault', label: 'Vault', icon: AlertCircle, badge: activeMistakeCount },
  ];

  const isMoreTabActive = ['question-bank', 'performance', 'settings'].includes(currentTab);

  return (
    <>
      <header className="border-b border-white/[0.06] bg-[#090a0e]/90 backdrop-blur-xl sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3 lg:gap-6">
          
          {/* Left: Brand & Desktop Nav */}
          <div className="flex items-center space-x-3 lg:space-x-6 xl:space-x-8 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center space-x-2 text-left focus:outline-none group touch-manipulation shrink-0"
            >
              <span className="font-semibold text-base sm:text-lg tracking-tight text-[#f4f5f7] group-hover:text-white transition-colors whitespace-nowrap">
                CloudPrep
              </span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-[#9ea5b3] border border-white/[0.06] whitespace-nowrap shrink-0">
                CLF-C02
              </span>
            </button>

            {/* Desktop Navigation Tabs: Shown on laptop & desktop (>= 1024px) */}
            <nav className="hidden lg:flex items-center space-x-1 text-sm shrink-0">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-150 btn-press touch-manipulation whitespace-nowrap shrink-0 font-medium ${
                      isActive
                        ? 'text-[#f4f5f7] bg-white/[0.08] shadow-sm'
                        : 'text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full font-mono text-xs bg-[#f87171]/20 text-[#f87171] font-semibold border border-[#f87171]/30 whitespace-nowrap shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: In-Progress Indicator, Cloud Sync & Countdown Pill */}
          <div className="flex items-center space-x-2 text-sm shrink-0 whitespace-nowrap">
            <button
              onClick={() => onSelectTab('settings')}
              title="Cloud Sync Active (Supabase) - Click to manage"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04] transition-colors btn-press border border-white/[0.05] touch-manipulation whitespace-nowrap shrink-0"
            >
              <Cloud className="w-4 h-4 text-[#34d399] shrink-0" />
              <span className="hidden sm:inline text-xs font-mono text-[#9ea5b3] whitespace-nowrap">Synced</span>
            </button>

            {activeExam && !activeExam.isSubmitted && (
              <button
                onClick={() => onSelectTab('mock-exams')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 hover:bg-[#fbbf24]/15 transition-colors btn-press text-xs font-medium touch-manipulation whitespace-nowrap shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse shrink-0" />
                <span className="whitespace-nowrap">
                  Resume {activeExam.title ? (activeExam.title.length > 16 ? `${activeExam.title.substring(0, 14)}...` : activeExam.title) : `#${activeExam.examNumber}`}
                </span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}

            <div className="relative shrink-0">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04] transition-colors btn-press border border-white/[0.05] touch-manipulation whitespace-nowrap shrink-0"
              >
                <Calendar className="w-4 h-4 text-[#6d8aff] shrink-0" />
                <span className="tabular-nums font-mono text-xs font-semibold whitespace-nowrap">
                  {diffDays > 0 ? `${diffDays}d left` : diffDays === 0 ? 'Exam Today' : 'Done'}
                </span>
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-64 p-4 bg-[#14161b] border border-white/[0.1] rounded-xl shadow-2xl z-50 card-highlight-elevated animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-xs text-[#9ea5b3] mb-2 font-medium">Scheduled Exam Date</div>
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090a0e] border border-white/[0.08] rounded-md text-sm text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] mb-3 font-mono"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-3 py-1.5 text-xs text-[#9ea5b3] hover:text-[#f4f5f7]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDate}
                      className="px-3.5 py-1.5 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-xs rounded-md transition-colors btn-press"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Mobile / Tablet Bottom Navigation Dock (< 1024px) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090a0e]/95 backdrop-blur-2xl border-t border-white/[0.08] pb-safe flex items-stretch justify-around h-16 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
      >
        {mobilePrimaryTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setShowMobileMore(false);
                onSelectTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-colors relative touch-manipulation min-h-[48px] ${
                isActive ? 'text-[#6d8aff]' : 'text-[#7e8695] active:text-[#f4f5f7]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-[#f87171] text-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-[#f4f5f7] font-semibold' : 'text-[#9ea5b3]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6d8aff]" />
              )}
            </button>
          );
        })}

        {/* More Tab Trigger */}
        <button
          onClick={() => setShowMobileMore(!showMobileMore)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-colors relative touch-manipulation min-h-[48px] ${
            isMoreTabActive || showMobileMore ? 'text-[#6d8aff]' : 'text-[#7e8695] active:text-[#f4f5f7]'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className={`w-5 h-5 transition-transform duration-150 ${isMoreTabActive ? 'scale-110' : ''}`} />
            {isMoreTabActive && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#6d8aff]" />
            )}
          </div>
          <span className={`text-xs mt-1 font-medium ${isMoreTabActive ? 'text-[#f4f5f7] font-semibold' : 'text-[#9ea5b3]'}`}>
            More
          </span>
          {isMoreTabActive && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6d8aff]" />
          )}
        </button>
      </nav>

      {/* Slide-Up "More" Sheet for Mobile & Tablet */}
      {showMobileMore && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowMobileMore(false)}
          />
          <div className="relative bg-[#111318] border-t border-white/[0.1] rounded-t-3xl p-5 pb-safe space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom-8 duration-200 max-w-lg mx-auto w-full">
            {/* Sheet Handle */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-1 rounded-full bg-white/20 mx-auto block mb-1" />
              </div>
              <button
                onClick={() => setShowMobileMore(false)}
                className="p-1.5 rounded-lg text-[#9ea5b3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-semibold text-[#9ea5b3] uppercase tracking-wider px-1">
              Additional Tools
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  onSelectTab('question-bank');
                  setShowMobileMore(false);
                }}
                className={`flex items-center space-x-3.5 p-3.5 rounded-xl border text-left transition-colors min-h-[48px] touch-manipulation ${
                  currentTab === 'question-bank'
                    ? 'bg-[#181a21] border-[#6d8aff] text-[#f4f5f7]'
                    : 'bg-[#090a0e] border-white/[0.06] text-[#9ea5b3] active:bg-[#14161b]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#6d8aff]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-medium text-[#f4f5f7]">Question Bank</div>
                  <div className="text-xs text-[#9ea5b3]">Search & browse all 1,050 questions</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('performance');
                  setShowMobileMore(false);
                }}
                className={`flex items-center space-x-3.5 p-3.5 rounded-xl border text-left transition-colors min-h-[48px] touch-manipulation ${
                  currentTab === 'performance'
                    ? 'bg-[#181a21] border-[#6d8aff] text-[#f4f5f7]'
                    : 'bg-[#090a0e] border-white/[0.06] text-[#9ea5b3] active:bg-[#14161b]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#34d399]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-medium text-[#f4f5f7]">Performance Analytics</div>
                  <div className="text-xs text-[#9ea5b3]">Domain breakdown & readiness index</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('settings');
                  setShowMobileMore(false);
                }}
                className={`flex items-center space-x-3.5 p-3.5 rounded-xl border text-left transition-colors min-h-[48px] touch-manipulation ${
                  currentTab === 'settings'
                    ? 'bg-[#181a21] border-[#6d8aff] text-[#f4f5f7]'
                    : 'bg-[#090a0e] border-white/[0.06] text-[#9ea5b3] active:bg-[#14161b]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#fbbf24]">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-medium text-[#f4f5f7]">Settings & Cloud Sync</div>
                  <div className="text-xs text-[#9ea5b3]">Supabase real-time sync & preferences</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
