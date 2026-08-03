"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AMP_TYPES, makeDistortionCurve } from "@/lib/ampTypes";
import { createReverbImpulse } from "@/lib/ampEffects";

export default function AmpPage() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [ampTypeId, setAmpTypeId] = useState(AMP_TYPES[0].id);
  const [drive, setDrive] = useState(5);
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.7);

  const [chorusRate, setChorusRate] = useState(1.5);
  const [chorusDepth, setChorusDepth] = useState(3);
  const [chorusMix, setChorusMix] = useState(0);

  const [delayTime, setDelayTime] = useState(300);
  const [delayFeedback, setDelayFeedback] = useState(30);
  const [delayMix, setDelayMix] = useState(0);

  const [reverbDecay, setReverbDecay] = useState(2);
  const [reverbMix, setReverbMix] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);

  const ampType = AMP_TYPES.find((a) => a.id === ampTypeId) ?? AMP_TYPES[0];
  const ampTypeRef = useRef(ampType);
  const driveRef = useRef(drive);
  useEffect(() => {
    ampTypeRef.current = ampType;
  }, [ampType]);
  useEffect(() => {
    driveRef.current = drive;
  }, [drive]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const preGainRef = useRef<GainNode | null>(null);
  const waveshaperRef = useRef<WaveShaperNode | null>(null);
  const highpassRef = useRef<BiquadFilterNode | null>(null);
  const lowpassRef = useRef<BiquadFilterNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const chorusLfoRef = useRef<OscillatorNode | null>(null);
  const chorusLfoGainRef = useRef<GainNode | null>(null);
  const chorusDryRef = useRef<GainNode | null>(null);
  const chorusWetRef = useRef<GainNode | null>(null);

  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const delayDryRef = useRef<GainNode | null>(null);
  const delayWetRef = useRef<GainNode | null>(null);

  const convolverRef = useRef<ConvolverNode | null>(null);
  const reverbDryRef = useRef<GainNode | null>(null);
  const reverbWetRef = useRef<GainNode | null>(null);

  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const meterRafRef = useRef<number | null>(null);

  const updateMeters = useCallback(function loop() {
    const inputAnalyser = inputAnalyserRef.current;
    const outputAnalyser = outputAnalyserRef.current;

    if (inputAnalyser) {
      const buffer = new Float32Array(inputAnalyser.fftSize);
      inputAnalyser.getFloatTimeDomainData(buffer);
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
      setInputLevel(Math.sqrt(sumSq / buffer.length));
    }
    if (outputAnalyser) {
      const buffer = new Float32Array(outputAnalyser.fftSize);
      outputAnalyser.getFloatTimeDomainData(buffer);
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
      setOutputLevel(Math.sqrt(sumSq / buffer.length));
    }

    meterRafRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback(() => {
    if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current);
    meterRafRef.current = null;
    inputAnalyserRef.current = null;
    outputAnalyserRef.current = null;
    setInputLevel(0);
    setOutputLevel(0);

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    preGainRef.current = null;
    waveshaperRef.current = null;
    highpassRef.current = null;
    lowpassRef.current = null;
    bassRef.current = null;
    midRef.current = null;
    trebleRef.current = null;
    masterGainRef.current = null;
    chorusLfoRef.current = null;
    chorusLfoGainRef.current = null;
    chorusDryRef.current = null;
    chorusWetRef.current = null;
    delayNodeRef.current = null;
    delayFeedbackRef.current = null;
    delayDryRef.current = null;
    delayWetRef.current = null;
    convolverRef.current = null;
    reverbDryRef.current = null;
    reverbWetRef.current = null;
    setIsRunning(false);
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

        const ctx = new AudioContext({ latencyHint: "interactive" });
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);

        const inputAnalyser = ctx.createAnalyser();
        inputAnalyser.fftSize = 1024;
        source.connect(inputAnalyser);
        inputAnalyserRef.current = inputAnalyser;

        const driveAmount = 1 + (driveRef.current / 10) * ampTypeRef.current.driveMultiplier;

        const preGain = ctx.createGain();
        preGain.gain.value = driveAmount;
        preGainRef.current = preGain;

        const waveshaper = ctx.createWaveShaper();
        waveshaper.curve = makeDistortionCurve(driveAmount);
        waveshaper.oversample = "4x";
        waveshaperRef.current = waveshaper;

        const postGain = ctx.createGain();
        postGain.gain.value = 0.4;

        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = ampTypeRef.current.cabHighpassHz;
        highpassRef.current = highpass;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = ampTypeRef.current.cabLowpassHz;
        lowpassRef.current = lowpass;

        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 120;
        bassFilter.gain.value = bass;
        bassRef.current = bassFilter;

        const midFilter = ctx.createBiquadFilter();
        midFilter.type = "peaking";
        midFilter.frequency.value = 800;
        midFilter.Q.value = 0.7;
        midFilter.gain.value = mid;
        midRef.current = midFilter;

        const trebleFilter = ctx.createBiquadFilter();
        trebleFilter.type = "highshelf";
        trebleFilter.frequency.value = 3000;
        trebleFilter.gain.value = treble;
        trebleRef.current = trebleFilter;

        // --- 코러스 ---
        const chorusOut = ctx.createGain();
        const chorusDry = ctx.createGain();
        chorusDry.gain.value = 1 - chorusMix / 100;
        chorusDryRef.current = chorusDry;
        const chorusWet = ctx.createGain();
        chorusWet.gain.value = chorusMix / 100;
        chorusWetRef.current = chorusWet;
        const chorusDelay = ctx.createDelay(0.05);
        chorusDelay.delayTime.value = 0.02;
        const chorusLfo = ctx.createOscillator();
        chorusLfo.frequency.value = chorusRate;
        chorusLfoRef.current = chorusLfo;
        const chorusLfoGain = ctx.createGain();
        chorusLfoGain.gain.value = chorusDepth / 1000;
        chorusLfoGainRef.current = chorusLfoGain;
        chorusLfo.connect(chorusLfoGain).connect(chorusDelay.delayTime);
        chorusLfo.start();

        trebleFilter.connect(chorusDry).connect(chorusOut);
        trebleFilter.connect(chorusDelay).connect(chorusWet).connect(chorusOut);

        // --- 딜레이 ---
        const delayOut = ctx.createGain();
        const delayDry = ctx.createGain();
        delayDry.gain.value = 1 - delayMix / 100;
        delayDryRef.current = delayDry;
        const delayWet = ctx.createGain();
        delayWet.gain.value = delayMix / 100;
        delayWetRef.current = delayWet;
        const delayNode = ctx.createDelay(1);
        delayNode.delayTime.value = delayTime / 1000;
        delayNodeRef.current = delayNode;
        const delayFeedbackGain = ctx.createGain();
        delayFeedbackGain.gain.value = delayFeedback / 100;
        delayFeedbackRef.current = delayFeedbackGain;

        chorusOut.connect(delayDry).connect(delayOut);
        chorusOut.connect(delayNode);
        delayNode.connect(delayFeedbackGain).connect(delayNode);
        delayNode.connect(delayWet).connect(delayOut);

        // --- 리버브 ---
        const reverbOut = ctx.createGain();
        const reverbDry = ctx.createGain();
        reverbDry.gain.value = 1 - reverbMix / 100;
        reverbDryRef.current = reverbDry;
        const reverbWet = ctx.createGain();
        reverbWet.gain.value = reverbMix / 100;
        reverbWetRef.current = reverbWet;
        const convolver = ctx.createConvolver();
        convolver.buffer = createReverbImpulse(ctx, reverbDecay);
        convolverRef.current = convolver;

        delayOut.connect(reverbDry).connect(reverbOut);
        delayOut.connect(convolver).connect(reverbWet).connect(reverbOut);

        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -6;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = 0.1;

        const masterGain = ctx.createGain();
        masterGain.gain.value = masterVolume;
        masterGainRef.current = masterGain;

        const outputAnalyser = ctx.createAnalyser();
        outputAnalyser.fftSize = 1024;
        outputAnalyserRef.current = outputAnalyser;

        source
          .connect(preGain)
          .connect(waveshaper)
          .connect(postGain)
          .connect(highpass)
          .connect(lowpass)
          .connect(bassFilter)
          .connect(midFilter)
          .connect(trebleFilter);

        reverbOut.connect(limiter).connect(masterGain);
        masterGain.connect(outputAnalyser);
        masterGain.connect(ctx.destination);

        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list.filter((d) => d.kind === "audioinput"));

        const settings = stream.getAudioTracks()[0]?.getSettings();
        if (settings?.deviceId) setSelectedDeviceId(settings.deviceId);

        setIsRunning(true);
        meterRafRef.current = requestAnimationFrame(updateMeters);
      } catch {
        setError("마이크/오디오 인터페이스에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateMeters]
  );

  const handleDeviceChange = async (deviceId: string) => {
    stop();
    setSelectedDeviceId(deviceId);
    await start(deviceId);
  };

  useEffect(() => stop, [stop]);

  // 앰프 타입/드라이브가 바뀌면 이미 만들어진 노드 값만 갱신 (그래프 재구성 없음)
  useEffect(() => {
    if (!preGainRef.current || !waveshaperRef.current) return;
    const amount = 1 + (drive / 10) * ampType.driveMultiplier;
    preGainRef.current.gain.value = amount;
    waveshaperRef.current.curve = makeDistortionCurve(amount);
    if (highpassRef.current) highpassRef.current.frequency.value = ampType.cabHighpassHz;
    if (lowpassRef.current) lowpassRef.current.frequency.value = ampType.cabLowpassHz;
  }, [ampType, drive]);

  useEffect(() => {
    if (bassRef.current) bassRef.current.gain.value = bass;
  }, [bass]);
  useEffect(() => {
    if (midRef.current) midRef.current.gain.value = mid;
  }, [mid]);
  useEffect(() => {
    if (trebleRef.current) trebleRef.current.gain.value = treble;
  }, [treble]);
  useEffect(() => {
    if (masterGainRef.current) masterGainRef.current.gain.value = masterVolume;
  }, [masterVolume]);

  useEffect(() => {
    if (chorusLfoRef.current) chorusLfoRef.current.frequency.value = chorusRate;
  }, [chorusRate]);
  useEffect(() => {
    if (chorusLfoGainRef.current) chorusLfoGainRef.current.gain.value = chorusDepth / 1000;
  }, [chorusDepth]);
  useEffect(() => {
    if (chorusDryRef.current) chorusDryRef.current.gain.value = 1 - chorusMix / 100;
    if (chorusWetRef.current) chorusWetRef.current.gain.value = chorusMix / 100;
  }, [chorusMix]);

  useEffect(() => {
    if (delayNodeRef.current) delayNodeRef.current.delayTime.value = delayTime / 1000;
  }, [delayTime]);
  useEffect(() => {
    if (delayFeedbackRef.current) delayFeedbackRef.current.gain.value = delayFeedback / 100;
  }, [delayFeedback]);
  useEffect(() => {
    if (delayDryRef.current) delayDryRef.current.gain.value = 1 - delayMix / 100;
    if (delayWetRef.current) delayWetRef.current.gain.value = delayMix / 100;
  }, [delayMix]);

  useEffect(() => {
    if (convolverRef.current && audioContextRef.current) {
      convolverRef.current.buffer = createReverbImpulse(audioContextRef.current, reverbDecay);
    }
  }, [reverbDecay]);
  useEffect(() => {
    if (reverbDryRef.current) reverbDryRef.current.gain.value = 1 - reverbMix / 100;
    if (reverbWetRef.current) reverbWetRef.current.gain.value = reverbMix / 100;
  }, [reverbMix]);

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">앰프 시뮬레이터</h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          오디오 인터페이스로 기타를 입력받아 실시간으로 앰프 톤을 입혀줍니다.
        </p>
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-center text-xs text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
          ⚠️ 스피커로 재생하면 마이크가 소리를 다시 주워 하울링이 날 수 있어요. 헤드폰 사용을 권장합니다.
        </p>
      </div>

      {!isRunning ? (
        <button
          onClick={() => start()}
          className="rounded-full bg-zinc-900 px-8 py-3 text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          앰프 시작
        </button>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-6">
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

          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <LevelMeter label="입력 신호" level={inputLevel} />
            <LevelMeter label="출력 신호" level={outputLevel} />
            {inputLevel < 0.001 && (
              <p className="text-xs text-orange-500">
                입력 신호가 안 잡혀요 — 위 드롭다운에서 오디오 인터페이스를 선택했는지, 인터페이스의 입력 게인 노브가 켜져 있는지 확인해보세요.
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2">
            {AMP_TYPES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAmpTypeId(a.id)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  ampTypeId === a.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black"
                    : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <Knob label="드라이브" value={drive} min={0} max={10} onChange={setDrive} />
            <Knob label="베이스" value={bass} min={-12} max={12} onChange={setBass} />
            <Knob label="미드" value={mid} min={-12} max={12} onChange={setMid} />
            <Knob label="트레블" value={treble} min={-12} max={12} onChange={setTreble} />
            <Knob
              label="마스터 볼륨"
              value={masterVolume}
              min={0}
              max={1}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={setMasterVolume}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">코러스</span>
            <Knob
              label="레이트"
              value={chorusRate}
              min={0.1}
              max={5}
              step={0.1}
              format={(v) => `${v.toFixed(1)} Hz`}
              onChange={setChorusRate}
            />
            <Knob
              label="뎁스"
              value={chorusDepth}
              min={0}
              max={10}
              step={0.5}
              format={(v) => `${v} ms`}
              onChange={setChorusDepth}
            />
            <Knob
              label="믹스"
              value={chorusMix}
              min={0}
              max={100}
              format={(v) => `${v}%`}
              onChange={setChorusMix}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">딜레이</span>
            <Knob
              label="타임"
              value={delayTime}
              min={50}
              max={800}
              step={10}
              format={(v) => `${v} ms`}
              onChange={setDelayTime}
            />
            <Knob
              label="피드백"
              value={delayFeedback}
              min={0}
              max={90}
              format={(v) => `${v}%`}
              onChange={setDelayFeedback}
            />
            <Knob
              label="믹스"
              value={delayMix}
              min={0}
              max={100}
              format={(v) => `${v}%`}
              onChange={setDelayMix}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">리버브</span>
            <Knob
              label="디케이"
              value={reverbDecay}
              min={0.5}
              max={4}
              step={0.1}
              format={(v) => `${v.toFixed(1)}초`}
              onChange={setReverbDecay}
            />
            <Knob
              label="믹스"
              value={reverbMix}
              min={0}
              max={100}
              format={(v) => `${v}%`}
              onChange={setReverbMix}
            />
          </div>

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

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function Knob({ label, value, min, max, step = 1, format, onChange }: KnobProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-300">
        <span>{label}</span>
        <span>{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-zinc-900 dark:accent-zinc-50"
      />
    </div>
  );
}

function LevelMeter({ label, level }: { label: string; level: number }) {
  // RMS 0~0.5 정도를 0~100%로 매핑 (0.5 이상은 상당히 큰 신호)
  const percent = Math.min(100, (level / 0.5) * 100);
  const isClipping = level > 0.4;

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${isClipping ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
