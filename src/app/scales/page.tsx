"use client";

import { useState } from "react";
import { NOTE_NAMES } from "@/lib/musicTheory";
import { SCALE_TYPES, getScaleNoteNames } from "@/lib/scales";
import { TUNINGS } from "@/lib/guitarStrings";
import Fretboard from "@/components/Fretboard";

export default function ScalesPage() {
  const [root, setRoot] = useState("C");
  const [scaleTypeId, setScaleTypeId] = useState(SCALE_TYPES[0].id);
  const [tuningId, setTuningId] = useState(TUNINGS[0].id);

  const scaleType = SCALE_TYPES.find((s) => s.id === scaleTypeId) ?? SCALE_TYPES[0];
  const tuning = TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0];
  const scaleNoteNames = getScaleNoteNames(root, scaleType);

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">스케일 트레이너</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          프렛보드 위에서 스케일 운지법을 확인하세요.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          루트
          <select
            value={root}
            onChange={(e) => setRoot(e.target.value)}
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
          스케일
          <select
            value={scaleTypeId}
            onChange={(e) => setScaleTypeId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {SCALE_TYPES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          튜닝
          <select
            value={tuningId}
            onChange={(e) => setTuningId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {TUNINGS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-500" /> 루트음
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-zinc-900 dark:bg-zinc-50" /> 스케일 구성음
        </span>
      </div>

      <div className="w-full max-w-4xl rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <Fretboard tuning={tuning} scaleNoteNames={scaleNoteNames} root={root} />
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        구성음: {scaleNoteNames.join(" - ")}
      </p>
    </div>
  );
}
