"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nextStrum, Strum, STRUMMING_PRESETS } from "@/lib/strumming";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const STEPS_PER_BAR = 8;
const MIN_BPM = 40;
const MAX_BPM = 200;

interface QueuedStep {
  step: number;
  time: number;
}

const ARROW: Record<Strum, string> = { down: "↓", up: "↑", rest: "·" };
const INTERVAL_OPTIONS = [10, 15, 20, 30, 60];

export default function StrummingPage() {
  const [bpm, setBpm] = useState(90);
  const [pattern, setPattern] = useState<Strum[]>(STRUMMING_PRESETS[1].pattern);
  const [presetIndex, setPresetIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const [rampEnabled, setRampEnabled] = useState(false);
  const [targetBpm, setTargetBpm] = useState(140);
  const [stepBpm, setStepBpm] = useState(2);
  const [intervalSec, setIntervalSec] = useState(15);
  const rampTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bpmRef = useRef(bpm);
  const patternRef = useRef(pattern);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    if (rampTimerRef.current) {
      clearInterval(rampTimerRef.current);
      rampTimerRef.current = null;
    }
    if (isPlaying && rampEnabled) {
      rampTimerRef.current = setInterval(() => {
        setBpm((v) => Math.min(targetBpm, v + stepBpm));
      }, intervalSec * 1000);
    }
    return () => {
      if (rampTimerRef.current) clearInterval(rampTimerRef.current);
    };
  }, [isPlaying, rampEnabled, targetBpm, stepBpm, intervalSec]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const stepCounterRef = useRef(0);
  const queuedStepsRef = useRef<QueuedStep[]>([]);

  const scheduleStep = useCallback((step: number, time: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const idx = step % STEPS_PER_BAR;
    queuedStepsRef.current.push({ step: idx, time });

    const strum = patternRef.current[idx];
    if (strum === "rest") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = strum === "down" ? 700 : 1000;
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const scheduler = useCallback(
    function tick() {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const secondsPerStep = 60.0 / bpmRef.current / 2;
      while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
        scheduleStep(stepCounterRef.current, nextNoteTimeRef.current);
        nextNoteTimeRef.current += secondsPerStep;
        stepCounterRef.current += 1;
      }
      timerIdRef.current = setTimeout(tick, LOOKAHEAD_MS);
    },
    [scheduleStep]
  );

  const draw = useCallback(function loop() {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    let last: QueuedStep | null = null;
    while (queuedStepsRef.current.length && queuedStepsRef.current[0].time < ctx.currentTime) {
      last = queuedStepsRef.current.shift() ?? null;
    }
    if (last) setCurrentStep(last.step);

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback(() => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerIdRef.current = null;
    rafRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    queuedStepsRef.current = [];
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const start = useCallback(() => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    stepCounterRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    queuedStepsRef.current = [];
    setIsPlaying(true);
    scheduler();
    rafRef.current = requestAnimationFrame(draw);
  }, [scheduler, draw]);

  useEffect(() => stop, [stop]);

  const toggle = () => (isPlaying ? stop() : start());

  const applyPreset = (index: number) => {
    setPresetIndex(index);
    setPattern(STRUMMING_PRESETS[index].pattern);
  };

  const toggleSlot = (index: number) => {
    if (isPlaying) return;
    setPattern((prev) => prev.map((s, i) => (i === index ? nextStrum(s) : s)));
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">스트러밍 패턴 트레이너</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          박자에 맞춰 다운/업 스트로크 패턴을 연습하세요.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-6">
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          프리셋
          <select
            value={presetIndex}
            onChange={(e) => applyPreset(Number(e.target.value))}
            disabled={isPlaying}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {STRUMMING_PRESETS.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{bpm} BPM</span>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-zinc-900 dark:accent-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">점진적 속도 증가</span>
            <button
              onClick={() => setRampEnabled((v) => !v)}
              className={`rounded-full px-4 py-1 text-xs transition ${
                rampEnabled
                  ? "bg-green-500 text-white"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {rampEnabled ? "켜짐" : "꺼짐"}
            </button>
          </div>

          {rampEnabled && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>목표 BPM</span>
                  <span>{targetBpm}</span>
                </div>
                <input
                  type="range"
                  min={MIN_BPM}
                  max={MAX_BPM}
                  value={targetBpm}
                  onChange={(e) => setTargetBpm(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>

              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  증가량
                  <select
                    value={stepBpm}
                    onChange={(e) => setStepBpm(Number(e.target.value))}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    {[1, 2, 3, 5].map((n) => (
                      <option key={n} value={n}>
                        +{n} BPM
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  간격
                  <select
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    {INTERVAL_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}초마다
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                {intervalSec}초마다 +{stepBpm} BPM씩, {targetBpm} BPM까지 자동으로 올라가요
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-8 gap-1.5">
          {pattern.map((strum, i) => (
            <button
              key={i}
              onClick={() => toggleSlot(i)}
              disabled={isPlaying}
              className={`flex aspect-square items-center justify-center rounded-lg border text-xl font-medium transition disabled:opacity-100 ${
                currentStep === i && isPlaying
                  ? "border-orange-500 bg-orange-500 text-white"
                  : strum === "rest"
                    ? "border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700"
                    : "border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
              }`}
            >
              {ARROW[strum]}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          칸을 눌러 다운·업·쉼표를 바꿀 수 있어요 (1~4박, & = 엇박)
        </p>

        <div className="flex justify-center">
          <button
            onClick={toggle}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            {isPlaying ? "정지" : "시작"}
          </button>
        </div>
      </div>
    </div>
  );
}
