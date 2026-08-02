"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { autoCorrelate, frequencyToNote, NoteInfo } from "@/lib/pitchDetect";
import { closestString } from "@/lib/guitarStrings";

export default function TunerPage() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setIsListening(false);
    setNote(null);
  }, []);

  const tick = useCallback(function loop() {
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;
    if (!analyser || !audioContext) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const frequency = autoCorrelate(buffer, audioContext.sampleRate);

    if (frequency !== -1) {
      setNote(frequencyToNote(frequency));
    } else {
      setNote(null);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(
    async (deviceId?: string) => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        streamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;

        const list = await navigator.mediaDevices.enumerateDevices();
        const inputs = list.filter((d) => d.kind === "audioinput");
        setDevices(inputs);

        const activeTrackSettings = stream.getAudioTracks()[0]?.getSettings();
        if (activeTrackSettings?.deviceId) {
          setSelectedDeviceId(activeTrackSettings.deviceId);
        }

        setIsListening(true);
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setError(
          "마이크/오디오 인터페이스에 접근할 수 없습니다. 브라우저 권한을 확인해주세요."
        );
      }
    },
    [tick]
  );

  const handleDeviceChange = async (deviceId: string) => {
    stop();
    setSelectedDeviceId(deviceId);
    await start(deviceId);
  };

  useEffect(() => stop, [stop]);

  const string = note ? closestString(note.frequency) : null;
  const cents = note?.cents ?? 0;
  const inTune = note !== null && Math.abs(cents) <= 5;
  const clampedCents = Math.max(-50, Math.min(50, cents));

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">튜너</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Scarlett Solo 등 오디오 인터페이스를 연결한 뒤, 아래에서 입력 장치를 선택하세요.
        </p>
      </div>

      {!isListening ? (
        <button
          onClick={() => start()}
          className="rounded-full bg-zinc-900 px-8 py-3 text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          튜너 시작
        </button>
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <select
            value={selectedDeviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "오디오 입력 장치"}
              </option>
            ))}
          </select>

          <div className="flex h-64 w-64 flex-col items-center justify-center rounded-full border-8 border-zinc-200 dark:border-zinc-800">
            <span
              className={`text-6xl font-bold ${
                inTune
                  ? "text-green-500"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {note ? note.name : "-"}
            </span>
            <span className="text-lg text-zinc-500 dark:text-zinc-400">
              {note ? note.octave : ""}
            </span>
            <span className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
              {note ? `${note.frequency.toFixed(1)} Hz` : "소리를 내주세요"}
            </span>
          </div>

          <div className="w-full">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-400 dark:bg-zinc-600" />
              <div
                className={`absolute top-0 h-full w-2 rounded-full transition-all ${
                  inTune ? "bg-green-500" : "bg-orange-500"
                }`}
                style={{ left: `calc(${50 + clampedCents}% - 4px)` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
              <span>-50</span>
              <span>0</span>
              <span>+50</span>
            </div>
          </div>

          {string && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              가장 가까운 기타 줄:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {string.name}
              </span>{" "}
              ({string.frequency} Hz)
            </p>
          )}

          <button
            onClick={stop}
            className="rounded-full border border-zinc-300 px-6 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            중지
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
