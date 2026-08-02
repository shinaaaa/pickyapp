"use client";

import { useState } from "react";
import FileBackingTrack from "@/components/FileBackingTrack";
import YoutubeBackingTrack from "@/components/YoutubeBackingTrack";
import GeneratedBackingTrack from "@/components/GeneratedBackingTrack";

type Mode = "file" | "youtube" | "generated";

const TABS: { mode: Mode; label: string }[] = [
  { mode: "generated", label: "자동 생성" },
  { mode: "file", label: "파일 업로드" },
  { mode: "youtube", label: "YouTube" },
];

export default function BackingTracksPage() {
  const [mode, setMode] = useState<Mode>("generated");

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">백킹 트랙</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          자동 생성 코드 반주로 연습하거나, 파일·YouTube 영상으로 템포를 조절하고 구간을 반복하세요.
        </p>
      </div>

      <div className="flex gap-2 rounded-full bg-zinc-200 p-1 dark:bg-zinc-900">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => setMode(tab.mode)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              mode === tab.mode
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "generated" && <GeneratedBackingTrack />}
      {mode === "file" && <FileBackingTrack />}
      {mode === "youtube" && <YoutubeBackingTrack />}
    </div>
  );
}
