"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  NOTE_NAMES,
  ScaleMode,
  getDiatonicChords,
  getRomanNumerals,
} from "@/lib/musicTheory";
import { getChordShape } from "@/lib/chords";
import { playChordPad } from "@/lib/chordAudio";
import ChordDiagram from "@/components/ChordDiagram";

function chordLabel(root: string, quality: string) {
  if (quality === "minor") return `${root}m`;
  if (quality === "diminished") return `${root}dim`;
  return root;
}

export default function HarmonyPage() {
  const [key, setKey] = useState("C");
  const [mode, setMode] = useState<ScaleMode>("major");
  const [progression, setProgression] = useState<number[]>([]);
  const [bpm, setBpm] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const diatonicChords = getDiatonicChords(key, mode);
  const romanNumerals = getRomanNumerals(mode);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const progressionRef = useRef<number[]>(progression);
  const bpmRef = useRef(bpm);
  const diatonicChordsRef = useRef(diatonicChords);

  useEffect(() => {
    progressionRef.current = progression;
  }, [progression]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    diatonicChordsRef.current = diatonicChords;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mode]);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const previewChord = useCallback(
    (degree: number) => {
      const ctx = ensureAudioContext();
      const chord = diatonicChordsRef.current[degree];
      playChordPad(ctx, ctx.destination, chord, ctx.currentTime, 0.6);
    },
    [ensureAudioContext]
  );

  const addChord = (degree: number) => {
    setProgression((prev) => [...prev, degree]);
    previewChord(degree);
  };

  const removeAt = (index: number) => {
    setProgression((prev) => prev.filter((_, i) => i !== index));
  };

  const clearProgression = () => setProgression([]);

  const stopPlayback = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setCurrentIndex(-1);
  }, []);

  const playStep = useCallback(function step() {
    const ctx = audioContextRef.current;
    const seq = progressionRef.current;
    if (!ctx || seq.length === 0) {
      stopPlayback();
      return;
    }
    const chordDurationSec = (4 * 60) / bpmRef.current;
    const degree = seq[indexRef.current % seq.length];
    setCurrentIndex(indexRef.current % seq.length);
    playChordPad(ctx, ctx.destination, diatonicChordsRef.current[degree], ctx.currentTime, chordDurationSec);

    timerRef.current = setTimeout(() => {
      indexRef.current += 1;
      step();
    }, chordDurationSec * 1000);
  }, [stopPlayback]);

  const startPlayback = () => {
    if (progression.length === 0) return;
    ensureAudioContext();
    indexRef.current = 0;
    setIsPlaying(true);
    playStep();
  };

  const togglePlayback = () => (isPlaying ? stopPlayback() : startPlayback());

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">화성학</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          키의 다이어토닉 코드를 확인하고, 코드를 눌러 나만의 진행을 만들어보세요.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          키
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
            onChange={(e) => setMode(e.target.value as ScaleMode)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="major">메이저</option>
            <option value="minor">마이너</option>
          </select>
        </label>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-3 gap-3 sm:grid-cols-7">
        {diatonicChords.map((chord, degree) => {
          const shape = getChordShape(chord.root, chord.quality);
          const label = chordLabel(chord.root, chord.quality);
          return (
            <button
              key={degree}
              onClick={() => addChord(degree)}
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-2 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{romanNumerals[degree]}</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
              {shape ? (
                <ChordDiagram shape={shape} />
              ) : (
                <span className="py-4 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                  다이어그램 없음
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">내 진행</span>
          {progression.length > 0 && (
            <button
              onClick={clearProgression}
              className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              초기화
            </button>
          )}
        </div>

        {progression.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
            위에서 코드를 눌러 진행을 만들어보세요
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {progression.map((degree, i) => (
              <button
                key={i}
                onClick={() => removeAt(i)}
                title="클릭해서 삭제"
                className={`rounded-full px-3 py-1 text-sm transition ${
                  isPlaying && currentIndex === i
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {chordLabel(diatonicChords[degree].root, diatonicChords[degree].quality)}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-300">
            <span>템포</span>
            <span>{bpm} BPM</span>
          </div>
          <input
            type="range"
            min={50}
            max={160}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-zinc-900 dark:accent-zinc-50"
          />
        </div>

        <button
          onClick={togglePlayback}
          disabled={progression.length === 0}
          className="rounded-full bg-zinc-900 px-6 py-2 text-sm text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          {isPlaying ? "정지" : "진행 재생"}
        </button>
      </div>
    </div>
  );
}
