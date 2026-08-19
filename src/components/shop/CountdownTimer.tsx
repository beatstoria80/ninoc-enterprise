'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: string;
}

export const CountdownTimer = React.memo(function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60))),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) return null;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-100">
      <span>Ends in:</span>
      <div className="flex gap-1 items-center bg-white px-1.5 py-0.5 rounded shadow-sm">
        <span>{pad(timeLeft.hours)}</span>
        <span className="text-rose-400 opacity-60">:</span>
        <span>{pad(timeLeft.minutes)}</span>
        <span className="text-rose-400 opacity-60">:</span>
        <span>{pad(timeLeft.seconds)}</span>
      </div>
    </div>
  );
});
