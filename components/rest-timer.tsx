"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

/**
 * Inline rest timer for the active workout session. Counts down the exercise's
 * prescribed rest between sets, with start/pause and reset. Pure client island:
 * its buttons are type="button" so they never submit the surrounding session form.
 * Gives a small haptic buzz on finish (when supported) and respects that an
 * always-announcing live region would be noisy, so the time is not aria-live.
 */
export function RestTimer({ seconds = 90 }: { seconds?: number }) {
  const total = Math.max(10, Math.min(600, Math.round(seconds || 90)));
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (remaining !== 0) return;
    setRunning(false);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(180);
    }
  }, [remaining]);

  const done = remaining === 0;
  const toggle = () => {
    if (done) {
      setRemaining(total);
      setRunning(true);
      return;
    }
    setRunning((value) => !value);
  };
  const reset = () => {
    setRunning(false);
    setRemaining(total);
  };

  const minutes = Math.floor(remaining / 60);
  const secondsLeft = remaining % 60;
  const label = `${minutes}:${String(secondsLeft).padStart(2, "0")}`;
  const pct = total ? Math.round((remaining / total) * 100) : 0;

  return (
    <div className="restTimer" data-done={done ? "true" : undefined} data-running={running ? "true" : undefined}>
      <button
        type="button"
        className="restTimerToggle"
        onClick={toggle}
        aria-label={running ? "Pausar descanso" : done ? "Reiniciar descanso" : "Iniciar descanso"}
      >
        {running ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div className="restTimerBody">
        <span className="restTimerTop">
          <span className="restTimerLabel"><Timer size={13} aria-hidden="true" /> {done ? "Descanso listo" : "Descanso"}</span>
          <span className="restTimerTime" role="timer">{label}</span>
        </span>
        <span className="restTimerTrack" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      </div>
      <button type="button" className="restTimerReset" onClick={reset} aria-label="Reiniciar descanso">
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
