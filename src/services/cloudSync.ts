import { supabase } from './supabaseClient';
import { AppSettings, ExamSession } from '../types';
import { getCompletedExams, getSettings, saveCompletedExam, saveSettings, getActiveExam, saveActiveExam, hydrateExamQuestions } from './storage';

const SYNC_KEY_STORAGE = 'cloudprep_sync_key';
const DEFAULT_SYNC_KEY = 'soumil-prep';

export interface SyncStatus {
  syncKey: string;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

// 1. Get or initialize the persistent Sync Key
export const getSyncKey = (): string => {
  try {
    // Check URL parameter first: e.g. ?sync=my-code
    const params = new URLSearchParams(window.location.search);
    const urlSync = params.get('sync');
    if (urlSync && urlSync.trim()) {
      const cleanKey = urlSync.trim().toLowerCase();
      localStorage.setItem(SYNC_KEY_STORAGE, cleanKey);
      return cleanKey;
    }

    const saved = localStorage.getItem(SYNC_KEY_STORAGE);
    if (saved && saved.trim()) {
      return saved.trim();
    }

    // Default to soumil-prep
    localStorage.setItem(SYNC_KEY_STORAGE, DEFAULT_SYNC_KEY);
    return DEFAULT_SYNC_KEY;
  } catch {
    return DEFAULT_SYNC_KEY;
  }
};

export const setSyncKey = (newKey: string): void => {
  const clean = newKey.trim().toLowerCase();
  if (clean) {
    localStorage.setItem(SYNC_KEY_STORAGE, clean);
  }
};

// 2. Push user profile (settings + active exam) to Supabase
export const pushProfileToCloud = async (syncKey: string, settings: AppSettings, activeExam: ExamSession | null) => {
  try {
    const { error } = await supabase.from('user_sync').upsert({
      sync_key: syncKey,
      settings: settings,
      active_exam: activeExam,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase profile push warning:', error.message);
  } catch (err) {
    console.warn('Supabase profile push network error:', err);
  }
};

// 3. Push a completed exam to Supabase
export const pushExamToCloud = async (syncKey: string, exam: ExamSession) => {
  try {
    // Explicitly clear active_exam in cloud profile since it is now submitted
    await pushProfileToCloud(syncKey, getSettings(), null);

    const questionIds = exam.questions?.map((q) => q.id) || exam.questionIds || [];
    const enrichedResult = exam.result
      ? {
          ...exam.result,
          questionIds: exam.result.questionIds || questionIds,
          title: exam.result.title || exam.title,
          isSprint: exam.result.isSprint ?? exam.isSprint,
          sprintCategory: exam.result.sprintCategory || exam.sprintCategory,
        }
      : null;

    const { error } = await supabase.from('completed_exams').upsert({
      id: exam.id,
      sync_key: syncKey,
      exam_number: exam.examNumber,
      seed: exam.seed,
      result: enrichedResult,
      answers: exam.answers,
      flagged_question_ids: exam.flaggedQuestionIds || [],
      start_time: exam.startTime,
      duration_minutes: exam.durationMinutes || 90,
      is_submitted: exam.isSubmitted,
      submitted_at: exam.submittedAt || Date.now(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase push exam warning:', error.message);
    }
  } catch (err) {
    console.warn('Supabase push exam error:', err);
  }
};

// 4. Pull full history from cloud and merge with local
export const pullFromCloud = async (
  syncKey: string,
  onRemoteUpdate?: (data: { completedExams: ExamSession[]; settings: AppSettings; activeExam: ExamSession | null }) => void
): Promise<{ completedExams: ExamSession[]; settings: AppSettings; activeExam: ExamSession | null } | null> => {
  try {
    // A. Fetch profile
    const { data: profileData, error: profileErr } = await supabase
      .from('user_sync')
      .select('*')
      .eq('sync_key', syncKey)
      .maybeSingle();

    if (profileErr) {
      console.warn('Supabase pull profile error:', profileErr.message);
    }

    // B. Fetch completed exams
    const { data: examsData, error: examsErr } = await supabase
      .from('completed_exams')
      .select('*')
      .eq('sync_key', syncKey)
      .order('submitted_at', { ascending: false });

    if (examsErr) {
      console.warn('Supabase pull exams error:', examsErr.message);
      return null;
    }

    // Parse remote exams and hydrate questions from question bank
    const remoteExams: ExamSession[] = (examsData || []).map((row: any) => {
      const rawSession: ExamSession = {
        id: row.id,
        examNumber: row.exam_number,
        seed: Number(row.seed),
        questions: [],
        answers: row.answers || {},
        flaggedQuestionIds: row.flagged_question_ids || [],
        currentQuestionIndex: 0,
        startTime: Number(row.start_time),
        durationMinutes: row.duration_minutes,
        isSubmitted: row.is_submitted,
        submittedAt: Number(row.submitted_at),
        result: row.result,
        questionIds: row.result?.questionIds,
        title: row.result?.title,
        isSprint: row.result?.isSprint,
        sprintCategory: row.result?.sprintCategory,
      };
      return hydrateExamQuestions(rawSession);
    });

    // Merge with local completed exams
    const localExams = getCompletedExams();
    const mergedMap = new Map<string, ExamSession>();

    // Add local exams (already hydrated)
    localExams.forEach((e) => mergedMap.set(e.id, hydrateExamQuestions(e)));

    // Upsert remote exams (preserve questions if local has them, else use remote hydrated)
    remoteExams.forEach((remote) => {
      const existing = mergedMap.get(remote.id);
      if (existing && existing.questions && existing.questions.length > 0) {
        mergedMap.set(remote.id, {
          ...remote,
          questions: existing.questions,
        });
      } else {
        mergedMap.set(remote.id, remote);
      }
    });

    const finalExams = Array.from(mergedMap.values())
      .map(hydrateExamQuestions)
      .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

    // Save merged exams to local storage
    localStorage.setItem('cloudprep_completed_exams', JSON.stringify(finalExams));

    // Handle settings
    let finalSettings = getSettings();
    if (profileData?.settings && Object.keys(profileData.settings).length > 0) {
      finalSettings = { ...finalSettings, ...profileData.settings };
      saveSettings(finalSettings);
    }

    // Handle active exam
    let finalActiveExam = getActiveExam();

    if (profileData && profileData.active_exam) {
      const isAlreadyCompleted =
        profileData.active_exam.isSubmitted ||
        finalExams.some((e) => e.id === profileData.active_exam.id);

      if (isAlreadyCompleted) {
        // Discard zombie submitted exam from active slot
        finalActiveExam = null;
        saveActiveExam(null);
        await pushProfileToCloud(syncKey, finalSettings, null);
      } else {
        finalActiveExam = profileData.active_exam;
        saveActiveExam(finalActiveExam);
      }
    } else if (profileData && profileData.active_exam === null) {
      // Cloud explicitly says no active session
      finalActiveExam = null;
      saveActiveExam(null);
    } else if (finalActiveExam) {
      // Validate local active exam against completed list
      const activeId = finalActiveExam.id;
      const isLocalAlreadyCompleted =
        finalActiveExam.isSubmitted ||
        finalExams.some((e) => e.id === activeId);

      if (isLocalAlreadyCompleted) {
        finalActiveExam = null;
        saveActiveExam(null);
      }
    }

    const payload = {
      completedExams: finalExams,
      settings: finalSettings,
      activeExam: finalActiveExam,
    };

    if (onRemoteUpdate) {
      onRemoteUpdate(payload);
    }

    return payload;
  } catch (err) {
    console.warn('Supabase full sync error:', err);
    return null;
  }
};

// 5. Setup Realtime subscription
export const subscribeToCloudChanges = (
  syncKey: string,
  onRemoteChange: () => void
) => {
  const channel = supabase
    .channel(`sync_${syncKey}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'completed_exams',
        filter: `sync_key=eq.${syncKey}`,
      },
      () => {
        onRemoteChange();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_sync',
        filter: `sync_key=eq.${syncKey}`,
      },
      () => {
        onRemoteChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
