import React, { useState } from 'react';
import { Download, Upload, RotateCcw } from 'lucide-react';
import { AppSettings } from '../types';
import { exportAppData, importAppData, resetAllData, saveSettings } from '../services/storage';
import { toast } from 'sonner';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReset,
}) => {
  const [targetDate, setTargetDate] = useState(settings.targetExamDate);
  const [targetScore, setTargetScore] = useState(settings.targetScorePercentage);
  const [warning15, setWarning15] = useState(settings.timerWarning15m);
  const [warning5, setWarning5] = useState(settings.timerWarning5m);
  const [shortcuts, setShortcuts] = useState(settings.keyboardShortcutsEnabled);

  const handleSavePreferences = () => {
    const updated: AppSettings = {
      targetExamDate: targetDate,
      targetScorePercentage: targetScore,
      timerWarning15m: warning15,
      timerWarning5m: warning5,
      keyboardShortcutsEnabled: shortcuts,
    };
    onUpdateSettings(updated);
    saveSettings(updated);
    toast.success('Preferences saved');
  };

  const handleExportData = () => {
    const jsonStr = exportAppData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudprep-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exported');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAppData(content);
      if (success) {
        toast.success('Data imported');
        onDataReset();
      } else {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset all local data and reload the demo mock exams?')) {
      resetAllData();
      onDataReset();
      toast('Demo data reloaded');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-150 text-xs">
      
      {/* Header */}
      <div className="pb-4 border-b border-white/[0.06]">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#f4f5f7] tracking-tight">
          Settings
        </h1>
        <p className="text-[#9ea5b3] mt-0.5">
          Exam dates, timer alerts, and data management
        </p>
      </div>

      {/* Target Parameters */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 space-y-4 card-highlight">
        <h2 className="text-xs font-semibold text-[#f4f5f7]">Exam Target</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[#9ea5b3]">Scheduled Exam Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#090a0e] border border-white/[0.07] rounded-lg text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#9ea5b3]">Target Score: <span className="font-mono text-[#f4f5f7]">{targetScore}%</span></label>
            <input
              type="range"
              min="70"
              max="95"
              step="1"
              value={targetScore}
              onChange={(e) => setTargetScore(parseInt(e.target.value, 10))}
              className="w-full accent-[#6d8aff] pt-2"
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 space-y-3 card-highlight">
        <h2 className="text-xs font-semibold text-[#f4f5f7]">Exam Preferences</h2>

        <div className="space-y-2.5 pt-1 text-[#9ea5b3]">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={warning15}
              onChange={(e) => setWarning15(e.target.checked)}
              className="rounded bg-[#090a0e] border-white/[0.1] accent-[#6d8aff]"
            />
            <span className="text-[#f4f5f7]">15-minute remaining amber alert</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={warning5}
              onChange={(e) => setWarning5(e.target.checked)}
              className="rounded bg-[#090a0e] border-white/[0.1] accent-[#6d8aff]"
            />
            <span className="text-[#f4f5f7]">5-minute urgent red alert</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={shortcuts}
              onChange={(e) => setShortcuts(e.target.checked)}
              className="rounded bg-[#090a0e] border-white/[0.1] accent-[#6d8aff]"
            />
            <span className="text-[#f4f5f7]">Enable keyboard shortcuts (← / → for nav, 1-4 for options, F to flag)</span>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSavePreferences}
            className="px-4 py-1.5 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold rounded-lg transition-colors btn-press shadow-md shadow-[#6d8aff]/15"
          >
            Save
          </button>
        </div>
      </div>

      {/* Backups */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 space-y-3 card-highlight">
        <h2 className="text-xs font-semibold text-[#f4f5f7]">Data & Backups</h2>
        <p className="text-[#9ea5b3]">
          All exam data is saved locally in your browser. Export backups to prevent loss.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] rounded-lg transition-colors btn-press border border-white/[0.06]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] rounded-lg cursor-pointer transition-colors btn-press border border-white/[0.06]">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-[#f87171] hover:bg-[#f87171]/10 rounded-lg transition-colors ml-auto btn-press"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

    </div>
  );
};
