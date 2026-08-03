"use client";

import { useState } from "react";
import { NOTE_NAMES, qualitySuffix } from "@/lib/musicTheory";
import { getChordShape } from "@/lib/chords";
import ChordDiagram from "@/components/ChordDiagram";

interface OpenShape {
  label: string;
  root: string;
  quality: "major" | "minor";
}

const OPEN_SHAPES: OpenShape[] = [
  { label: "C", root: "C", quality: "major" },
  { label: "A", root: "A", quality: "major" },
  { label: "G", root: "G", quality: "major" },
  { label: "E", root: "E", quality: "major" },
  { label: "D", root: "D", quality: "major" },
  { label: "Am", root: "A", quality: "minor" },
  { label: "Em", root: "E", quality: "minor" },
  { label: "Dm", root: "D", quality: "minor" },
];

function transposeRoot(root: string, semitones: number): string {
  const index = NOTE_NAMES.indexOf(root);
  return NOTE_NAMES[(index + semitones + 12) % 12];
}

export default function CapoPage() {
  const [capoFret, setCapoFret] = useState(0);
  const [targetRoot, setTargetRoot] = useState("C");
  const [targetQuality, setTargetQuality] = useState<"major" | "minor">("major");

  const matchingShapes = OPEN_SHAPES.filter((s) => s.quality === targetQuality).map((s) => {
    const shapeIndex = NOTE_NAMES.indexOf(s.root);
    const targetIndex = NOTE_NAMES.indexOf(targetRoot);
    const fret = (targetIndex - shapeIndex + 12) % 12;
    return { shape: s, fret };
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">카포 계산기</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          카포를 낀 위치에서 오픈 코드 모양이 실제로 어떤 소리인지 확인하세요.
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-col items-center gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          카포 위치: {capoFret === 0 ? "카포 없음" : `${capoFret}프렛`}
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 12 }).map((_, fret) => (
            <button
              key={fret}
              onClick={() => setCapoFret(fret)}
              className={`h-9 w-9 rounded-full text-sm transition ${
                capoFret === fret
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {fret}
            </button>
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-4 gap-3">
        {OPEN_SHAPES.map((s) => {
          const shape = getChordShape(s.root, s.quality);
          const actualRoot = transposeRoot(s.root, capoFret);
          const actualLabel = `${actualRoot}${qualitySuffix(s.quality)}`;
          return (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {s.label} 모양
              </span>
              {shape && <ChordDiagram shape={shape} />}
              <span className="text-xs text-zinc-400 dark:text-zinc-500">실제 소리</span>
              <span className="text-sm font-semibold text-orange-500">{actualLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          반대로: 원하는 코드를 오픈 모양으로 치려면?
        </span>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            원하는 코드 루트
            <select
              value={targetRoot}
              onChange={(e) => setTargetRoot(e.target.value)}
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
            메이저/마이너
            <select
              value={targetQuality}
              onChange={(e) => setTargetQuality(e.target.value as "major" | "minor")}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="major">메이저</option>
              <option value="minor">마이너</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {matchingShapes.map(({ shape, fret }) => (
            <span
              key={shape.label}
              className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {shape.label} 모양 →{" "}
              {fret === 0 ? "카포 없이 바로 연주" : `카포 ${fret}프렛`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
