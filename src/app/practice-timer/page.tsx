"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/time";

type Mode = "stopwatch" | "countdown";

const TARGET_MINUTES_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

function playChime(ctx: AudioContext) {
  [880, 1320].forEach((freq, i) => {
    const time = ctx.currentTime + i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.6);
  });
}

export default function PracticeTimerPage() {
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [targetMinutes, setTargetMinutes] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionTotalMs, setSessionTotalMs] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);

  const lastTickRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    lastTickRef.current = Date.now();
    const targetMs = targetMinutes * 60000;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setSessionTotalMs((prev) => prev + delta);
      setElapsedMs((prev) => {
        const next = prev + delta;
        if (mode === "countdown" && next >= targetMs) {
          setIsRunning(false);
          setJustCompleted(true);
          if (!audioContextRef.current) audioContextRef.current = new AudioContext();
          playChime(audioContextRef.current);
          return targetMs;
        }
        return next;
      });
    }, 200);

    return () => clearInterval(intervalId);
  }, [isRunning, mode, targetMinutes]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const toggle = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setJustCompleted(false);
      setIsRunning(true);
    }
  };

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedMs(0);
    setJustCompleted(false);
  }, []);

  const switchMode = (next: Mode) => {
    if (isRunning) return;
    setMode(next);
    reset();
  };

  const targetMs = targetMinutes * 60000;
  const displayMs = mode === "countdown" ? Math.max(0, targetMs - elapsedMs) : elapsedMs;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">연습 세션 타이머</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          연습 시간을 재거나, 목표 시간을 정해두고 연습하세요.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex gap-2 rounded-full bg-zinc-200 p-1 dark:bg-zinc-900">
          <button
            onClick={() => switchMode("stopwatch")}
            disabled={isRunning}
            className={`rounded-full px-4 py-1.5 text-sm transition disabled:opacity-50 ${
              mode === "stopwatch"
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            스톱워치
          </button>
          <button
            onClick={() => switchMode("countdown")}
            disabled={isRunning}
            className={`rounded-full px-4 py-1.5 text-sm transition disabled:opacity-50 ${
              mode === "countdown"
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            타이머
          </button>
        </div>

        {mode === "countdown" && (
          <label className="flex flex-col items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            목표 시간
            <select
              value={targetMinutes}
              onChange={(e) => {
                setTargetMinutes(Number(e.target.value));
                reset();
              }}
              disabled={isRunning}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {TARGET_MINUTES_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
          </label>
        )}

        <div
          className={`flex h-56 w-56 flex-col items-center justify-center rounded-full border-8 transition-colors ${
            justCompleted
              ? "border-green-500"
              : "border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <span className="text-5xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatTime(displayMs / 1000)}
          </span>
          {justCompleted && (
            <span className="mt-2 text-sm text-green-500">연습 시간이 끝났어요!</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            {isRunning ? "정지" : "시작"}
          </button>
          <button
            onClick={reset}
            disabled={isRunning}
            className="rounded-full border border-zinc-300 px-6 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            초기화
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 px-6 py-3 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">오늘 누적 연습 시간</span>
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {formatTime(sessionTotalMs / 1000)}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            새로고침하면 초기화돼요 (저장되지 않음)
          </span>
        </div>
      </div>
    </div>
  );
}
