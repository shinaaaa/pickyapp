"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { autoCorrelate, frequencyToNote, NoteInfo } from "@/lib/pitchDetect";
import {
  buildProgression,
  Chord,
  MAJOR_PROGRESSION_PRESETS,
  MINOR_PROGRESSION_PRESETS,
  NOTE_NAMES,
  ScaleMode,
} from "@/lib/musicTheory";
import { getChordShape } from "@/lib/chords";
import ChordDiagram from "@/components/ChordDiagram";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const BEATS_PER_CHORD = 4;
const ONSET_RMS_THRESHOLD = 0.05;
const MAX_BEAT_HISTORY = 40;

interface QueuedBeat {
  beatInChord: number;
  chordIndex: number;
  time: number;
}

interface RhythmFeedback {
  offsetMs: number;
  label: string;
}

function classifyOffset(offsetMs: number): string {
  const abs = Math.abs(offsetMs);
  if (abs <= 60) return "정확해요";
  if (abs <= 150) return offsetMs > 0 ? "약간 느려요" : "약간 빨라요";
  return offsetMs > 0 ? "많이 느려요" : "많이 빨라요";
}

export default function GeneratedBackingTrack() {
  const [key, setKey] = useState("C");
  const [mode, setMode] = useState<ScaleMode>("major");
  const [presetIndex, setPresetIndex] = useState(0);
  const [bpm, setBpm] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentBeat, setCurrentBeat] = useState(-1);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  const [micError, setMicError] = useState<string | null>(null);
  const [detectedNote, setDetectedNote] = useState<NoteInfo | null>(null);
  const [matchStatus, setMatchStatus] = useState<"match" | "mismatch" | null>(null);
  const [rhythmFeedback, setRhythmFeedback] = useState<RhythmFeedback | null>(null);

  const presets = mode === "major" ? MAJOR_PROGRESSION_PRESETS : MINOR_PROGRESSION_PRESETS;
  const chords = buildProgression(key, mode, presets[presetIndex].degrees);

  const chordsRef = useRef<Chord[]>(chords);
  const bpmRef = useRef(bpm);
  useEffect(() => {
    chordsRef.current = chords;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mode, presetIndex]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawRafRef = useRef<number | null>(null);
  const analysisRafRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatCounterRef = useRef(0);
  const queuedBeatsRef = useRef<QueuedBeat[]>([]);
  const beatTimesRef = useRef<number[]>([]);

  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const aboveThresholdRef = useRef(false);

  const scheduleBeat = useCallback((beatNumber: number, time: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const beatInChord = beatNumber % BEATS_PER_CHORD;
    const chordIndex = Math.floor(beatNumber / BEATS_PER_CHORD) % chordsRef.current.length;
    queuedBeatsRef.current.push({ beatInChord, chordIndex, time });

    beatTimesRef.current.push(time);
    if (beatTimesRef.current.length > MAX_BEAT_HISTORY) beatTimesRef.current.shift();

    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.frequency.value = beatInChord === 0 ? 1000 : 800;
    clickGain.gain.setValueAtTime(0.25, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(time);
    click.stop(time + 0.03);

    if (beatInChord === 0) {
      const chord = chordsRef.current[chordIndex];
      const chordDurationSec = (BEATS_PER_CHORD * 60) / bpmRef.current;
      chord.frequencies.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
        gain.gain.setValueAtTime(0.1, Math.max(time + 0.05, time + chordDurationSec - 0.1));
        gain.gain.linearRampToValueAtTime(0, time + chordDurationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + chordDurationSec + 0.05);
      });
    }
  }, []);

  const scheduler = useCallback(
    function tick() {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
        scheduleBeat(beatCounterRef.current, nextNoteTimeRef.current);
        nextNoteTimeRef.current += 60.0 / bpmRef.current;
        beatCounterRef.current += 1;
      }
      timerIdRef.current = setTimeout(tick, LOOKAHEAD_MS);
    },
    [scheduleBeat]
  );

  const drawLoop = useCallback(function loop() {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    let lastPast: QueuedBeat | null = null;
    while (queuedBeatsRef.current.length && queuedBeatsRef.current[0].time < ctx.currentTime) {
      lastPast = queuedBeatsRef.current.shift() ?? null;
    }
    if (lastPast) {
      setCurrentBeat(lastPast.beatInChord);
      setCurrentChordIndex(lastPast.chordIndex);
    }

    drawRafRef.current = requestAnimationFrame(loop);
  }, []);

  const analysisLoop = useCallback(function loop() {
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    let rms = 0;
    for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / buffer.length);

    if (rms > ONSET_RMS_THRESHOLD && !aboveThresholdRef.current) {
      aboveThresholdRef.current = true;
      const now = ctx.currentTime;
      const times = beatTimesRef.current;
      if (times.length > 0) {
        let nearest = times[0];
        let minDiff = Math.abs(now - nearest);
        for (const t of times) {
          const diff = Math.abs(now - t);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = t;
          }
        }
        const offsetMs = (now - nearest) * 1000;
        setRhythmFeedback({ offsetMs, label: classifyOffset(offsetMs) });
      }
    } else if (rms < ONSET_RMS_THRESHOLD * 0.6) {
      aboveThresholdRef.current = false;
    }

    const frequency = autoCorrelate(buffer, ctx.sampleRate);
    if (frequency !== -1) {
      const note = frequencyToNote(frequency);
      setDetectedNote(note);
      const currentChord = chordsRef.current[currentChordIndex];
      setMatchStatus(currentChord?.noteNames.includes(note.name) ? "match" : "mismatch");
    } else {
      setDetectedNote(null);
      setMatchStatus(null);
    }

    analysisRafRef.current = requestAnimationFrame(loop);
  }, [currentChordIndex]);

  const stop = useCallback(() => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current);
    if (analysisRafRef.current) cancelAnimationFrame(analysisRafRef.current);
    timerIdRef.current = null;
    drawRafRef.current = null;
    analysisRafRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    analyserRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    queuedBeatsRef.current = [];
    beatTimesRef.current = [];

    setIsPlaying(false);
    setCurrentBeat(-1);
    setDetectedNote(null);
    setMatchStatus(null);
    setRhythmFeedback(null);
  }, []);

  const start = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      micStreamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      beatCounterRef.current = 0;
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      queuedBeatsRef.current = [];
      beatTimesRef.current = [];

      setIsPlaying(true);
      scheduler();
      drawRafRef.current = requestAnimationFrame(drawLoop);
      analysisRafRef.current = requestAnimationFrame(analysisLoop);
    } catch {
      setMicError("마이크/오디오 인터페이스에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.");
    }
  }, [scheduler, drawLoop, analysisLoop]);

  useEffect(() => stop, [stop]);

  const toggle = () => (isPlaying ? stop() : start());

  const currentChord = chords[currentChordIndex];
  const cents = detectedNote?.cents ?? 0;
  const clampedCents = Math.max(-50, Math.min(50, cents));

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          키
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={isPlaying}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {NOTE_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          모드
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as ScaleMode);
              setPresetIndex(0);
            }}
            disabled={isPlaying}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="major">메이저</option>
            <option value="minor">마이너</option>
          </select>
        </label>

        <label className="col-span-2 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          코드 진행
          <select
            value={presetIndex}
            onChange={(e) => setPresetIndex(Number(e.target.value))}
            disabled={isPlaying}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {presets.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{bpm} BPM</span>
        <input
          type="range"
          min={50}
          max={160}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-50"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {chords.map((c, i) => {
          const shape = getChordShape(c.root, c.quality);
          const label = `${c.root}${c.quality === "minor" ? "m" : c.quality === "diminished" ? "dim" : ""}`;
          const isCurrent = isPlaying && i === currentChordIndex;
          return (
            <div
              key={i}
              className={`flex flex-col items-center gap-1 rounded-lg border bg-white p-2 transition dark:bg-zinc-950 ${
                isCurrent
                  ? "border-2 border-orange-500"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  isCurrent ? "text-orange-500" : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {label}
              </span>
              {shape ? (
                <ChordDiagram shape={shape} />
              ) : (
                <span className="py-4 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                  다이어그램 없음
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: BEATS_PER_CHORD }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-colors ${
              isPlaying && currentBeat === i
                ? i === 0
                  ? "bg-orange-500"
                  : "bg-zinc-900 dark:bg-zinc-50"
                : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={toggle}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          {isPlaying ? "정지" : "시작"}
        </button>
      </div>
      {micError && <p className="text-center text-sm text-red-500">{micError}</p>}

      {isPlaying && (
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`text-4xl font-bold ${
                matchStatus === "match"
                  ? "text-green-500"
                  : matchStatus === "mismatch"
                    ? "text-orange-500"
                    : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {detectedNote ? detectedNote.name : "-"}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {currentChord ? `현재 코드: ${currentChord.root}${currentChord.quality === "minor" ? "m" : currentChord.quality === "diminished" ? "dim" : ""} (${currentChord.noteNames.join(", ")})` : ""}
            </span>
            <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-400 dark:bg-zinc-600" />
              <div
                className={`absolute top-0 h-full w-2 rounded-full transition-all ${
                  matchStatus === "match" ? "bg-green-500" : "bg-orange-400"
                }`}
                style={{ left: `calc(${50 + clampedCents}% - 4px)` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">박자 정확도</span>
            <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {rhythmFeedback ? `${rhythmFeedback.label} (${rhythmFeedback.offsetMs > 0 ? "+" : ""}${Math.round(rhythmFeedback.offsetMs)}ms)` : "연주를 시작해보세요"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
