"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const MIN_BPM = 40;
const MAX_BPM = 240;
const BEAT_OPTIONS = [2, 3, 4, 5, 6];

interface QueuedNote {
  beat: number;
  time: number;
}

export default function MetronomePage() {
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatCounterRef = useRef(0);
  const notesInQueueRef = useRef<QueuedNote[]>([]);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    notesInQueueRef.current.push({ beat: beatNumber, time });

    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    osc.frequency.value = beatNumber === 0 ? 1000 : 800;
    envelope.gain.setValueAtTime(1, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.connect(envelope);
    envelope.connect(audioContext.destination);
    osc.start(time);
    osc.stop(time + 0.03);
  }, []);

  const scheduler = useCallback(function tick() {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    while (nextNoteTimeRef.current < audioContext.currentTime + SCHEDULE_AHEAD_SEC) {
      scheduleNote(currentBeatCounterRef.current, nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60.0 / bpmRef.current;
      currentBeatCounterRef.current = (currentBeatCounterRef.current + 1) % beatsPerMeasureRef.current;
    }
    timerIdRef.current = setTimeout(tick, LOOKAHEAD_MS);
  }, [scheduleNote]);

  const draw = useCallback(function loop() {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    let lastPast: QueuedNote | null = null;
    while (notesInQueueRef.current.length && notesInQueueRef.current[0].time < audioContext.currentTime) {
      lastPast = notesInQueueRef.current.shift() ?? null;
    }
    if (lastPast) setCurrentBeat(lastPast.beat);

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback(() => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerIdRef.current = null;
    rafRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    notesInQueueRef.current = [];
    setIsPlaying(false);
    setCurrentBeat(-1);
  }, []);

  const start = useCallback(() => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    currentBeatCounterRef.current = 0;
    nextNoteTimeRef.current = audioContext.currentTime + 0.05;
    notesInQueueRef.current = [];
    setIsPlaying(true);
    scheduler();
    rafRef.current = requestAnimationFrame(draw);
  }, [scheduler, draw]);

  useEffect(() => stop, [stop]);

  const toggle = () => (isPlaying ? stop() : start());

  const tapTempo = () => {
    const now = Date.now();
    const taps = tapTimesRef.current.filter((t) => now - t < 2000);
    taps.push(now);
    tapTimesRef.current = taps;

    if (taps.length < 2) return;
    const intervals = taps.slice(1).map((t, i) => t - taps[i]);
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const newBpm = Math.round(60000 / avgMs);
    setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, newBpm)));
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">메트로놈</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          박자를 맞추며 연습하세요.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl font-bold text-zinc-900 dark:text-zinc-50">{bpm}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">BPM</span>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-zinc-900 dark:accent-zinc-50"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setBpm((v) => Math.max(MIN_BPM, v - 1))}
              className="h-8 w-8 rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              -
            </button>
            <button
              onClick={() => setBpm((v) => Math.min(MAX_BPM, v + 1))}
              className="h-8 w-8 rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-colors ${
                currentBeat === i
                  ? i === 0
                    ? "bg-orange-500"
                    : "bg-zinc-900 dark:bg-zinc-50"
                  : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-center gap-2">
          {BEAT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setBeatsPerMeasure(n)}
              className={`h-9 w-9 rounded-full text-sm transition ${
                beatsPerMeasure === n
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggle}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            {isPlaying ? "정지" : "시작"}
          </button>
          <button
            onClick={tapTempo}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            탭 템포
          </button>
        </div>
      </div>
    </div>
  );
}
