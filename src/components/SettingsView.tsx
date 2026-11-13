import React, { useState } from 'react';
import { Download, Upload, RotateCcw, Cloud, Copy, Check, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { exportAppData, importAppData, resetAllData, saveSettings } from '../services/storage';
import { getSyncKey, setSyncKey, pullFromCloud, pushProfileToCloud } from '../services/cloudSync';
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

  // Cloud Sync state
  const [syncKeyInput, setSyncKeyInput] = useState<string>(getSyncKey);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasCopiedPhoneLink, setHasCopiedPhoneLink] = useState<boolean>(false);

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
    pushProfileToCloud(syncKeyInput, updated, null);
    toast.success('Preferences saved & synced to cloud');
  };

  const handleUpdateSyncKey = async () => {
    const clean = syncKeyInput.trim().toLowerCase();
    if (!clean) {
      toast.error('Sync key cannot be empty');
      return;
    }
    setSyncKey(clean);
    setIsSyncing(true);
    const pulled = await pullFromCloud(clean);
    setIsSyncing(false);
    if (pulled) {
      onDataReset();
      toast.success(`Connected to cloud profile: "${clean}"`);
    } else {
      toast.success(`Sync key saved: "${clean}". Ready for cross-device sync.`);
    }
  };

  const handleCopyPhoneLink = () => {
    const key = syncKeyInput.trim().toLowerCase() || 'soumil-prep';
    const baseUrl = window.location.origin;
    const phoneUrl = `${baseUrl}?sync=${key}`;
    navigator.clipboard.writeText(phoneUrl);
    setHasCopiedPhoneLink(true);
    setTimeout(() => setHasCopiedPhoneLink(false), 2500);
    toast.success('Link copied! Open this URL on your phone to link automatically.');
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const pulled = await pullFromCloud(syncKeyInput);
    setIsSyncing(false);
    if (pulled) {
      onDataReset();
      toast.success('Cloud sync complete! Up to date with latest attempts.');
    } else {
      toast.error('Could not sync with Supabase. Check internet connection.');
    }
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
    if (confirm('Clear all local exam history? This cannot be undone.')) {
      resetAllData();
      onDataReset();
      toast('Local history cleared');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-150 text-sm">
      
      {/* Header */}
      <div className="pb-4 border-b border-white/[0.06]">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#f4f5f7] tracking-tight">
          Settings & Cloud Sync
        </h1>
        <p className="text-sm text-[#9ea5b3] mt-1">
          Exam timeline, device pairing, and Supabase synchronization
        </p>
      </div>

      {/* Cloud Sync Section */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-2xl p-6 sm:p-7 space-y-5 card-highlight">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#6d8aff]/10 border border-[#6d8aff]/20 text-[#6d8aff]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f4f5f7]">Cross-Device Cloud Sync</h2>
              <p className="text-xs sm:text-sm text-[#9ea5b3]">Powered by Supabase PostgreSQL (Realtime)</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 font-mono text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
            <span>Connected</span>
          </div>
        </div>

        <div className="space-y-3.5 pt-1">
          <div className="space-y-1.5">
            <label className="text-sm text-[#9ea5b3] font-medium">Your Sync Profile Key</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={syncKeyInput}
                onChange={(e) => setSyncKeyInput(e.target.value)}
                placeholder="e.g. soumil-prep"
                className="flex-1 px-3.5 py-2.5 bg-[#090a0e] border border-white/[0.08] rounded-xl text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] font-mono text-sm"
              />
              <button
                onClick={handleUpdateSyncKey}
                disabled={isSyncing}
                className="px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] font-semibold text-sm rounded-xl transition-colors btn-press border border-white/[0.06] shrink-0"
              >
                Set Key
              </button>
            </div>
            <p className="text-xs text-[#9ea5b3]">
              Use this key to pair your phone and laptop so your exam history stays in sync.
            </p>
          </div>

          {/* Quick Actions for Sync */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.04]">
            <button
              onClick={handleCopyPhoneLink}
              className="flex items-center space-x-2 px-4 py-2 bg-[#6d8aff]/10 hover:bg-[#6d8aff]/15 text-[#6d8aff] border border-[#6d8aff]/20 rounded-xl transition-colors btn-press font-semibold text-sm"
            >
              {hasCopiedPhoneLink ? <Check className="w-4 h-4 text-[#34d399]" /> : <Copy className="w-4 h-4" />}
              <span>{hasCopiedPhoneLink ? 'Link Copied!' : 'Copy Phone Link'}</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-[#f4f5f7] rounded-xl transition-colors btn-press border border-white/[0.06] font-medium text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#6d8aff]' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Parameters */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 sm:p-7 space-y-4 card-highlight">
        <h2 className="text-base font-semibold text-[#f4f5f7]">Exam Target</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[#9ea5b3] font-medium">Scheduled Exam Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#090a0e] border border-white/[0.07] rounded-xl text-[#f4f5f7] focus:outline-none focus:border-[#6d8aff] font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-[#9ea5b3] font-medium">Target Score: <span className="font-mono text-[#f4f5f7] font-semibold">{targetScore}%</span></label>
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
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 sm:p-7 space-y-4 card-highlight">
        <h2 className="text-base font-semibold text-[#f4f5f7]">Exam Preferences</h2>

        <div className="space-y-3 pt-1 text-sm text-[#9ea5b3]">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={warning15}
              onChange={(e) => setWarning15(e.target.checked)}
              className="w-4 h-4 rounded bg-[#090a0e] border-white/[0.1] accent-[#6d8aff]"
            />
            <span className="text-[#f4f5f7]">15-minute remaining amber alert</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={warning5}
              onChange={(e) => setWarning5(e.target.checked)}
              className="w-4 h-4 rounded bg-[#090a0e] border-white/[0.1] accent-[#6d8aff]"
            />
            <span className="text-[#f4f5f7]">5-minute urgent red alert</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shortcuts}
              onChange={(e) => setShortcuts(e.target.checked)}
              className="w-4 h-4 rounded bg-[#090a0e] border-white/[0.1] accent-[#6d8aff]"
            />
            <span className="text-[#f4f5f7]">Enable keyboard shortcuts (← / → for nav, 1-4 for options, F to flag)</span>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSavePreferences}
            className="px-5 py-2.5 bg-[#6d8aff] hover:bg-[#839cff] text-[#090a0e] font-semibold text-sm rounded-xl transition-colors btn-press shadow-md shadow-[#6d8aff]/15"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Local Backups */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 sm:p-7 space-y-4 card-highlight">
        <h2 className="text-base font-semibold text-[#f4f5f7]">Manual Backups</h2>
        <p className="text-sm text-[#9ea5b3] leading-relaxed">
          All exam data is automatically synced with Supabase and cached locally in your browser.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] font-medium text-sm rounded-xl transition-colors btn-press border border-white/[0.06]"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center space-x-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-[#f4f5f7] font-medium text-sm rounded-xl cursor-pointer transition-colors btn-press border border-white/[0.06]">
            <Upload className="w-4 h-4" />
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
            className="flex items-center space-x-2 px-4 py-2 text-[#f87171] hover:bg-[#f87171]/10 rounded-xl transition-colors ml-auto btn-press font-medium text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Local History</span>
          </button>
        </div>
      </div>

    </div>
  );
};
