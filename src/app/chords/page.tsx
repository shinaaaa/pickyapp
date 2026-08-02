"use client";

import { useState } from "react";
import { CHORDS } from "@/lib/chords";
import ChordDiagram from "@/components/ChordDiagram";

export default function ChordsPage() {
  const [query, setQuery] = useState("");

  const filtered = CHORDS.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">코드 다이어그램</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          자주 쓰는 오픈 코드 모음입니다.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="코드 검색 (예: Am, D7)"
        className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />

      <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {filtered.map((chord) => (
          <div
            key={chord.name}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {chord.name}
            </span>
            <ChordDiagram shape={chord} />
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-zinc-400 dark:text-zinc-500">
            일치하는 코드가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
