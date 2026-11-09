import { useEffect, useState, useRef } from 'react';

interface UseExamTimerProps {
  startTime: number;
  durationMinutes: number;
  onTimeExpired: () => void;
  isPaused?: boolean;
}

export interface ExamTimerState {
  remainingSeconds: number;
  formattedTime: string;
  isWarning15m: boolean;
  isUrgent5m: boolean;
  isExpired: boolean;
  progressPercentage: number;
}

export const useExamTimer = ({
  startTime,
  durationMinutes,
  onTimeExpired,
  isPaused = false,
}: UseExamTimerProps): ExamTimerState => {
  const totalSeconds = durationMinutes * 60;
  const expiredHandledRef = useRef(false);

  const calculateRemaining = () => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const left = Math.max(0, totalSeconds - elapsedSeconds);
    return left;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const left = calculateRemaining();
      setRemainingSeconds(left);

      if (left <= 0 && !expiredHandledRef.current) {
        expiredHandledRef.current = true;
        clearInterval(interval);
        onTimeExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, isPaused, onTimeExpired]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning15m = remainingSeconds <= 15 * 60 && remainingSeconds > 5 * 60;
  const isUrgent5m = remainingSeconds <= 5 * 60;
  const isExpired = remainingSeconds <= 0;
  const progressPercentage = Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));

  return {
    remainingSeconds,
    formattedTime,
    isWarning15m,
    isUrgent5m,
    isExpired,
    progressPercentage,
  };
};
