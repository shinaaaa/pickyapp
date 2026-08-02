"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/time";
import { extractYouTubeVideoId, loadYouTubeIframeAPI, YouTubePlayer } from "@/lib/youtube";

const CONTAINER_ID = "youtube-backing-track-player";

export default function YoutubeBackingTrack() {
  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [availableRates, setAvailableRates] = useState<number[]>([1]);

  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const loopEnabledRef = useRef(loopEnabled);
  const loopStartRef = useRef(loopStart);
  const loopEndRef = useRef(loopEnd);

  useEffect(() => {
    loopEnabledRef.current = loopEnabled;
  }, [loopEnabled]);
  useEffect(() => {
    loopStartRef.current = loopStart;
  }, [loopStart]);
  useEffect(() => {
    loopEndRef.current = loopEnd;
  }, [loopEnd]);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    let player: YouTubePlayer | null = null;

    loadYouTubeIframeAPI().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(CONTAINER_ID, {
        videoId,
        events: {
          onReady: (event) => {
            if (cancelled) return;
            playerRef.current = event.target;
            setIsReady(true);
            setDuration(event.target.getDuration());
            const rates = event.target.getAvailablePlaybackRates();
            setAvailableRates(rates.length ? rates : [1]);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === YT.PlayerState.PLAYING);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current = null;
      player?.destroy();
    };
  }, [videoId]);

  useEffect(() => {
    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const time = player.getCurrentTime();
      setCurrentTime(time);

      if (
        loopEnabledRef.current &&
        loopStartRef.current !== null &&
        loopEndRef.current !== null &&
        time >= loopEndRef.current
      ) {
        player.seekTo(loopStartRef.current, true);
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeVideoId(urlInput);
    if (!id) {
      setInputError("올바른 YouTube 링크가 아닙니다.");
      return;
    }
    setInputError(null);
    setCurrentTime(0);
    setLoopEnabled(false);
    setLoopStart(null);
    setLoopEnd(null);
    setIsReady(false);
    setIsPlaying(false);
    setVideoId(id);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    playerRef.current?.seekTo(time, true);
    setCurrentTime(time);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rate = Number(e.target.value);
    playerRef.current?.setPlaybackRate(rate);
    setPlaybackRate(rate);
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
      <form onSubmit={handleLoadUrl} className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="YouTube 링크 붙여넣기"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          불러오기
        </button>
      </form>
      {inputError && <p className="text-sm text-red-500">{inputError}</p>}

      {videoId && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="aspect-video w-full">
            <div id={CONTAINER_ID} className="h-full w-full" />
          </div>
        </div>
      )}

      {videoId && !isReady && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>
      )}

      {videoId && isReady && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
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
            <select
              value={playbackRate}
              onChange={handleRateChange}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {availableRates.map((rate) => (
                <option key={rate} value={rate}>
                  {Math.round(rate * 100)}%
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              YouTube 플레이어는 정해진 배속 단계만 지원하며, 음정이 함께 변할 수 있습니다.
            </p>
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
