"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/time";

interface PitchPreservingAudio extends HTMLAudioElement {
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
}

function setPreservesPitch(audio: HTMLAudioElement, value: boolean) {
  const el = audio as PitchPreservingAudio;
  el.preservesPitch = value;
  el.mozPreservesPitch = value;
  el.webkitPreservesPitch = value;
}

export default function FileBackingTrack() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setFileName(file.name);
    setIsPlaying(false);
    setCurrentTime(0);
    setLoopEnabled(false);
    setLoopStart(null);
    setLoopEnd(null);

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.playbackRate = playbackRate;
      setPreservesPitch(audioRef.current, true);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);

    if (loopEnabled && loopStart !== null && loopEnd !== null && audio.currentTime >= loopEnd) {
      audio.currentTime = loopStart;
    }
  }, [loopEnabled, loopStart, loopEnd]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = Number(e.target.value);
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const markLoopStart = () => {
    setLoopStart(currentTime);
    if (loopEnd !== null && currentTime >= loopEnd) setLoopEnd(null);
  };

  const markLoopEnd = () => {
    setLoopEnd(currentTime);
    if (loopStart !== null && currentTime <= loopStart) setLoopStart(null);
  };

  const clearLoop = () => {
    setLoopStart(null);
    setLoopEnd(null);
    setLoopEnabled(false);
  };

  const canLoop = loopStart !== null && loopEnd !== null;

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-6 py-8 text-center text-sm text-zinc-500 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500">
        <span>{fileName ?? "오디오 파일 선택 (mp3, wav 등)"}</span>
        <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
      </label>

      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {fileName && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-zinc-900 dark:accent-zinc-50"
            />
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
            >
              {isPlaying ? "정지" : "재생"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-300">
              <span>템포</span>
              <span>{Math.round(playbackRate * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={playbackRate}
              onChange={handleRateChange}
              className="w-full accent-zinc-900 dark:accent-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">구간 반복</span>
              <button
                onClick={() => canLoop && setLoopEnabled((v) => !v)}
                disabled={!canLoop}
                className={`rounded-full px-4 py-1 text-xs transition ${
                  loopEnabled
                    ? "bg-green-500 text-white"
                    : "bg-zinc-200 text-zinc-600 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {loopEnabled ? "반복 켜짐" : "반복 꺼짐"}
              </button>
            </div>

            <div className="flex gap-2 text-sm">
              <button
                onClick={markLoopStart}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                시작 {loopStart !== null ? formatTime(loopStart) : ""}
              </button>
              <button
                onClick={markLoopEnd}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                끝 {loopEnd !== null ? formatTime(loopEnd) : ""}
              </button>
            </div>

            {(loopStart !== null || loopEnd !== null) && (
              <button
                onClick={clearLoop}
                className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                구간 초기화
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
