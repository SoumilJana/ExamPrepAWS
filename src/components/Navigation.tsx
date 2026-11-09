import React, { useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { AppSettings, ExamSession } from '../types';
import { saveSettings } from '../services/storage';
import { toast } from 'sonner';

export type NavTab = 'dashboard' | 'mock-exams' | 'question-bank' | 'performance' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeExam: ExamSession | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeExam,
  settings,
  onUpdateSettings,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mock-exams', label: 'Mock Exams' },
    { id: 'question-bank', label: 'Question Bank' },
    { id: 'performance', label: 'Performance' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="border-b border-white/[0.06] bg-[#090a0e]/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Left: Brand & Clean Nav */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center space-x-2 text-left focus:outline-none group"
          >
            <span className="font-semibold text-sm tracking-tight text-[#f4f5f7] group-hover:text-white transition-colors">
              CloudPrep
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-[#9ea5b3] border border-white/[0.06]">
              CLF-C02
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-1 text-xs">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-md transition-all duration-150 btn-press ${
                    isActive
                      ? 'text-[#f4f5f7] font-medium bg-white/[0.06]'
                      : 'text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.03]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: In-Progress Indicator & Countdown Pill */}
        <div className="flex items-center space-x-3 text-xs">
          {activeExam && !activeExam.isSubmitted && (
            <button
              onClick={() => onSelectTab('mock-exams')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 hover:bg-[#fbbf24]/15 transition-colors btn-press text-[11px]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse" />
              <span>Resume Exam #{activeExam.examNumber}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[#9ea5b3] hover:text-[#f4f5f7] hover:bg-white/[0.04] transition-colors btn-press border border-white/[0.05]"
            >
              <Calendar className="w-3.5 h-3.5 text-[#6d8aff]" />
              <span className="tabular-nums font-mono text-[11px]">
                {diffDays > 0 ? `${diffDays}d to exam` : diffDays === 0 ? 'Exam Today' : 'Target Passed'}
              </span>
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-64 p-3.5 bg-[#14161b] border border-white/[0.1] rounded-xl shadow-2xl z-50 card-highlight-elevated animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] text-[#9ea5b3] mb-2 font-medium">Scheduled Exam Date</div>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#090a0e] border border-white/[0.08] rounded-md text-xs text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] mb-3 font-mono"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-2.5 py-1 text-xs text-[#9ea5b3] hover:text-[#f4f5f7]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDate}
                    className="px-3 py-1 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-xs rounded-md transition-colors btn-press"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-around border-t border-white/[0.06] bg-[#090a0e] px-2 py-2 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`py-1 px-2.5 rounded ${
              currentTab === item.id ? 'text-[#f4f5f7] font-semibold bg-white/[0.06]' : 'text-[#9ea5b3]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
