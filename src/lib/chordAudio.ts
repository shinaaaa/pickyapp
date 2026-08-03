import { Chord } from "@/lib/musicTheory";

// 여러 음이 겹쳐 울려도 안전하도록 공용 리미터를 하나만 만들어 재사용한다
const limiterCache = new WeakMap<AudioContext, DynamicsCompressorNode>();

function getLimiter(ctx: AudioContext, destination: AudioNode): DynamicsCompressorNode {
  let limiter = limiterCache.get(ctx);
  if (!limiter) {
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    limiter.connect(destination);
    limiterCache.set(ctx, limiter);
  }
  return limiter;
}

const workletLoadedContexts = new WeakSet<AudioContext>();
const workletLoadingPromises = new WeakMap<AudioContext, Promise<void>>();

// 카플러스-스트롱 AudioWorklet 모듈을 이 AudioContext에서 한 번만 로드한다.
// 스케줄러(look-ahead scheduler)를 시작하기 전에 반드시 await 해야 한다 —
// 그 이후로는 playChordPad를 동기적으로 호출해도 안전하다.
export function ensureKarplusStrongWorklet(ctx: AudioContext): Promise<void> {
  if (workletLoadedContexts.has(ctx)) return Promise.resolve();
  let promise = workletLoadingPromises.get(ctx);
  if (!promise) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    promise = ctx.audioWorklet.addModule(`${basePath}/karplus-strong-worklet.js`).then(() => {
      workletLoadedContexts.add(ctx);
    });
    workletLoadingPromises.set(ctx, promise);
  }
  return promise;
}

function pluckString(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  time: number,
  durationSec: number,
  gain: number
) {
  const node = new AudioWorkletNode(ctx, "karplus-strong-processor", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    processorOptions: {
      frequency,
      gain,
      durationSec,
      startTime: time,
      decayTargetSec: durationSec * 0.8,
    },
  });
  node.connect(getLimiter(ctx, destination));

  const cleanupMs = Math.max(200, (time - ctx.currentTime + durationSec + 0.5) * 1000);
  setTimeout(() => node.disconnect(), cleanupMs);
}

export function playChordPad(
  ctx: AudioContext,
  destination: AudioNode,
  chord: Chord,
  time: number,
  durationSec: number,
  gain = 0.3
) {
  chord.frequencies.forEach((freq, i) => {
    // 스트로크처럼 각 줄을 아주 살짝 시간차를 두고 튕긴다
    pluckString(ctx, destination, freq, time + i * 0.012, durationSec, gain);
  });
}
