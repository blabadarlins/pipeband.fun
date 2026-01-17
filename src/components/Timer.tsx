"use client";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
}

export default function Timer({ timeRemaining, totalTime }: TimerProps) {
  const progress = (timeRemaining / totalTime) * 100;

  return (
    <div className="flex items-center gap-4 w-full max-w-md">
      <span className="text-accent font-black text-xl tracking-wide min-w-[30px] text-right">
        {timeRemaining}
      </span>
      <div className="flex-1 relative">
        <div className="timer-track w-full" />
        <div 
          className="timer-progress absolute top-0 left-0"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
